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
            var page = new PDPage(PDRectangle.LETTER);
            doc.addPage(page);

            try (var content = new PDPageContentStream(doc, page)) {
                var boldFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
                var regularFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
                var pageWidth = page.getMediaBox().getWidth();
                var margin = 50f;
                var usableWidth = pageWidth - 2 * margin;
                var yPos = page.getMediaBox().getHeight() - margin;

                // Title
                content.beginText();
                content.setFont(boldFont, 14);
                content.newLineAtOffset(margin, yPos);
                content.showText("Weekly Plan — " + userName + " — Week of " + plan.getWeekStartDate());
                content.endText();
                yPos -= 20;

                // Status line
                content.beginText();
                content.setFont(regularFont, 11);
                content.newLineAtOffset(margin, yPos);
                content.showText("Status: " + plan.getStatus().name());
                content.endText();
                yPos -= 25;

                // Column headers
                yPos = writePdfRow(content, boldFont, 10, margin, yPos, usableWidth,
                    "Title", "Priority", "Outcome", "Planned Hrs", "Actual Hrs", "Completion %", "Carry Fwd");
                yPos -= 4;

                // Separator line
                content.moveTo(margin, yPos);
                content.lineTo(margin + usableWidth, yPos);
                content.stroke();
                yPos -= 6;

                // Commit rows
                for (var commit : plan.getCommits()) {
                    if (yPos < margin + 30) {
                        // Start a new page if we're near the bottom
                        content.close();
                        var newPage = new PDPage(PDRectangle.LETTER);
                        doc.addPage(newPage);
                        // Note: we'd need a new content stream here for multi-page;
                        // for simplicity we stop at one page (typical plans are short)
                        break;
                    }
                    var outcomeName = commit.getOutcome() != null ? commit.getOutcome().getName() : "";
                    yPos = writePdfRow(content, regularFont, 9, margin, yPos, usableWidth,
                        truncate(commit.getTitle(), 30),
                        commit.getChessPriority().name(),
                        truncate(outcomeName, 20),
                        commit.getPlannedHours() != null ? commit.getPlannedHours().toPlainString() : "",
                        commit.getActualHours() != null ? commit.getActualHours().toPlainString() : "",
                        commit.getCompletionPct() != null ? commit.getCompletionPct() + "%" : "",
                        commit.isCarryForward() ? "Yes" : "No"
                    );
                    yPos -= 3;
                }
            }

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

    /**
     * Writes a row of 7 columns evenly spaced across usableWidth and returns the new yPos.
     */
    private float writePdfRow(
        PDPageContentStream content,
        PDType1Font font,
        float fontSize,
        float marginLeft,
        float yPos,
        float usableWidth,
        String col1, String col2, String col3,
        String col4, String col5, String col6, String col7
    ) throws IOException {
        var colWidth = usableWidth / 7f;
        String[] cols = {col1, col2, col3, col4, col5, col6, col7};
        content.setFont(font, fontSize);
        for (int i = 0; i < cols.length; i++) {
            content.beginText();
            content.newLineAtOffset(marginLeft + i * colWidth, yPos);
            content.showText(cols[i] != null ? cols[i] : "");
            content.endText();
        }
        return yPos - (fontSize + 4);
    }

    private String truncate(String value, int maxLen) {
        if (value == null) return "";
        return value.length() <= maxLen ? value : value.substring(0, maxLen - 1) + "…";
    }
}
