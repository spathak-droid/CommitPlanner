package com.weeklycommit.service;

import com.opencsv.CSVWriter;
import com.weeklycommit.entity.WeeklyCommit;
import com.weeklycommit.entity.WeeklyPlan;
import com.weeklycommit.repository.AppUserRepository;
import com.weeklycommit.repository.WeeklyPlanRepository;
import jakarta.persistence.EntityNotFoundException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ExportService {

    private static final String[] CSV_PLAN_HEADER = {
        "Title", "Priority", "Outcome", "Planned Hours", "Actual Hours",
        "Completion %", "Notes", "Carry Forward"
    };

    private static final String[] CSV_TEAM_HEADER = {
        "Member", "Title", "Priority", "Outcome", "Planned Hours", "Actual Hours",
        "Completion %", "Notes", "Carry Forward"
    };

    private final WeeklyPlanRepository planRepo;
    private final AppUserRepository userRepo;
    private final AuthorizationService authorizationService;

    public ExportService(
        WeeklyPlanRepository planRepo,
        AppUserRepository userRepo,
        AuthorizationService authorizationService
    ) {
        this.planRepo = planRepo;
        this.userRepo = userRepo;
        this.authorizationService = authorizationService;
    }

    public byte[] exportPlanCsv(UUID planId) {
        var plan = findPlan(planId);
        authorizationService.requireCanAccessUser(plan.getUserId());

        var out = new ByteArrayOutputStream();
        try (var writer = new CSVWriter(new OutputStreamWriter(out, StandardCharsets.UTF_8))) {
            writer.writeNext(CSV_PLAN_HEADER);
            for (var commit : plan.getCommits()) {
                writer.writeNext(commitToRow(commit));
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate CSV", e);
        }
        return out.toByteArray();
    }

    public byte[] exportPlanPdf(UUID planId) {
        var plan = findPlan(planId);
        authorizationService.requireCanAccessUser(plan.getUserId());

        var userName = userRepo.findByUserIdAndActiveTrue(plan.getUserId())
            .map(u -> u.getFullName())
            .orElse(plan.getUserId());

        try (var doc = new PDDocument()) {
            var boldFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            var regularFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

            // Use landscape for more horizontal room
            var landscape = new PDRectangle(PDRectangle.LETTER.getHeight(), PDRectangle.LETTER.getWidth());
            var margin = 40f;
            var usableWidth = landscape.getWidth() - 2 * margin;
            var rowHeight = 22f;
            var headerRowHeight = 26f;
            var fontSize = 9f;
            var headerFontSize = 9f;

            // Column definitions: name, proportional width fraction
            String[] headers = {"Title", "Priority", "Outcome", "Planned Hrs", "Actual Hrs", "Completion", "Notes", "Carry Fwd"};
            float[] colFractions = {0.22f, 0.08f, 0.18f, 0.08f, 0.08f, 0.08f, 0.20f, 0.08f};
            float[] colWidths = new float[colFractions.length];
            float[] colX = new float[colFractions.length];
            for (int i = 0; i < colFractions.length; i++) {
                colWidths[i] = usableWidth * colFractions[i];
                colX[i] = margin + (i == 0 ? 0 : colX[i - 1] - margin + colWidths[i - 1]);
            }

            var page = new PDPage(landscape);
            doc.addPage(page);
            var content = new PDPageContentStream(doc, page);
            var yPos = landscape.getHeight() - margin;

            // Title
            content.beginText();
            content.setFont(boldFont, 16);
            content.newLineAtOffset(margin, yPos);
            content.showText("Weekly Plan - " + userName);
            content.endText();
            yPos -= 20;

            // Subtitle
            content.beginText();
            content.setFont(regularFont, 11);
            content.newLineAtOffset(margin, yPos);
            content.showText("Week of " + plan.getWeekStartDate() + "  |  Status: " + plan.getStatus().name());
            content.endText();
            yPos -= 30;

            // Table header background
            content.setNonStrokingColor(0.15f, 0.15f, 0.2f);
            content.addRect(margin, yPos - headerRowHeight + 4, usableWidth, headerRowHeight);
            content.fill();

            // Table header text
            content.setNonStrokingColor(1f, 1f, 1f);
            content.setFont(boldFont, headerFontSize);
            for (int i = 0; i < headers.length; i++) {
                content.beginText();
                content.newLineAtOffset(colX[i] + 4, yPos - headerRowHeight + 10);
                content.showText(headers[i]);
                content.endText();
            }
            yPos -= headerRowHeight;

            // Data rows
            int rowIndex = 0;
            for (var commit : plan.getCommits()) {
                if (yPos - rowHeight < margin) {
                    content.close();
                    page = new PDPage(landscape);
                    doc.addPage(page);
                    content = new PDPageContentStream(doc, page);
                    yPos = landscape.getHeight() - margin;
                }

                // Alternating row background
                if (rowIndex % 2 == 0) {
                    content.setNonStrokingColor(0.96f, 0.96f, 0.97f);
                } else {
                    content.setNonStrokingColor(1f, 1f, 1f);
                }
                content.addRect(margin, yPos - rowHeight + 4, usableWidth, rowHeight);
                content.fill();

                // Row text
                content.setNonStrokingColor(0.1f, 0.1f, 0.1f);
                content.setFont(regularFont, fontSize);
                var outcomeName = commit.getOutcome() != null ? commit.getOutcome().getName() : "";
                String[] cells = {
                    commit.getTitle(),
                    commit.getChessPriority().name(),
                    outcomeName,
                    commit.getPlannedHours() != null ? commit.getPlannedHours().toPlainString() : "-",
                    commit.getActualHours() != null ? commit.getActualHours().toPlainString() : "-",
                    commit.getCompletionPct() != null ? commit.getCompletionPct() + "%" : "-",
                    commit.getReconciliationNotes() != null ? commit.getReconciliationNotes() : "",
                    commit.isCarryForward() ? "Yes" : "No"
                };
                var cellPad = 8f;
                for (int i = 0; i < cells.length; i++) {
                    var fitted = truncateToFit(cells[i], regularFont, fontSize, colWidths[i] - cellPad);
                    content.beginText();
                    content.newLineAtOffset(colX[i] + 4, yPos - rowHeight + 10);
                    content.showText(fitted);
                    content.endText();
                }

                yPos -= rowHeight;
                rowIndex++;
            }

            // Bottom border line
            content.setStrokingColor(0.8f, 0.8f, 0.8f);
            content.setLineWidth(0.5f);
            content.moveTo(margin, yPos + 4);
            content.lineTo(margin + usableWidth, yPos + 4);
            content.stroke();

            // Summary footer
            yPos -= 20;
            content.setNonStrokingColor(0.3f, 0.3f, 0.3f);
            content.beginText();
            content.setFont(regularFont, 9);
            content.newLineAtOffset(margin, yPos);
            content.showText("Total commitments: " + plan.getCommits().size()
                + "  |  Generated: " + LocalDate.now());
            content.endText();

            content.close();

            var out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }

    public byte[] exportTeamCsv(LocalDate weekStart) {
        authorizationService.requireManager();
        var monday = weekStart.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        var plans = planRepo.findByWeekStartDate(monday);

        var out = new ByteArrayOutputStream();
        try (var writer = new CSVWriter(new OutputStreamWriter(out, StandardCharsets.UTF_8))) {
            writer.writeNext(CSV_TEAM_HEADER);
            for (var plan : plans) {
                var memberName = userRepo.findByUserIdAndActiveTrue(plan.getUserId())
                    .map(u -> u.getFullName())
                    .orElse(plan.getUserId());
                for (var commit : plan.getCommits()) {
                    var row = new String[9];
                    row[0] = memberName;
                    var planRow = commitToRow(commit);
                    System.arraycopy(planRow, 0, row, 1, planRow.length);
                    writer.writeNext(row);
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate team CSV", e);
        }
        return out.toByteArray();
    }

    // --- helpers ---

    private WeeklyPlan findPlan(UUID planId) {
        return planRepo.findById(planId)
            .orElseThrow(() -> new EntityNotFoundException("Weekly plan not found: " + planId));
    }

    private String[] commitToRow(WeeklyCommit commit) {
        return new String[]{
            commit.getTitle(),
            commit.getChessPriority().name(),
            commit.getOutcome() != null ? commit.getOutcome().getName() : "",
            commit.getPlannedHours() != null ? commit.getPlannedHours().toPlainString() : "",
            commit.getActualHours() != null ? commit.getActualHours().toPlainString() : "",
            commit.getCompletionPct() != null ? commit.getCompletionPct().toString() : "",
            commit.getReconciliationNotes() != null ? commit.getReconciliationNotes() : "",
            commit.isCarryForward() ? "true" : "false",
        };
    }

    private String truncateToFit(String value, PDType1Font font, float fontSize, float maxWidth) {
        if (value == null || value.isEmpty()) return "";
        try {
            float fullWidth = font.getStringWidth(value) / 1000f * fontSize;
            if (fullWidth <= maxWidth) return value;
            String ellipsis = "..";
            float ellipsisWidth = font.getStringWidth(ellipsis) / 1000f * fontSize;
            for (int i = value.length() - 1; i > 0; i--) {
                float w = font.getStringWidth(value.substring(0, i)) / 1000f * fontSize;
                if (w + ellipsisWidth <= maxWidth) {
                    return value.substring(0, i) + ellipsis;
                }
            }
            return ellipsis;
        } catch (IOException e) {
            return value.length() > 10 ? value.substring(0, 8) + ".." : value;
        }
    }
}
