package com.weeklycommit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.weeklycommit.config.AnthropicConfig.AiConfig;
import com.weeklycommit.entity.AppUser;
import com.weeklycommit.entity.WeeklyCommit;
import com.weeklycommit.entity.WeeklyPlan;
import com.weeklycommit.enums.ChessPriority;
import com.weeklycommit.enums.PlanStatus;
import com.weeklycommit.enums.UserRole;
import com.weeklycommit.repository.AppUserRepository;
import com.weeklycommit.repository.ManagerAssignmentRepository;
import com.weeklycommit.repository.WeeklyPlanRepository;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
public class DailyDigestService {

    private static final Logger log = LoggerFactory.getLogger(DailyDigestService.class);

    private final AppUserRepository userRepo;
    private final ManagerAssignmentRepository assignmentRepo;
    private final WeeklyPlanRepository planRepo;
    private final EmailService emailService;
    private final AiConfig aiConfig;
    private final ObjectMapper objectMapper;
    private final OkHttpClient httpClient;

    public DailyDigestService(
            AppUserRepository userRepo,
            ManagerAssignmentRepository assignmentRepo,
            WeeklyPlanRepository planRepo,
            EmailService emailService,
            AiConfig aiConfig,
            ObjectMapper objectMapper
    ) {
        this.userRepo = userRepo;
        this.assignmentRepo = assignmentRepo;
        this.planRepo = planRepo;
        this.emailService = emailService;
        this.aiConfig = aiConfig;
        this.objectMapper = objectMapper;
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .build();
    }

    /**
     * Fires at 5 PM EST (22:00 UTC), Monday through Friday.
     */
    @Scheduled(cron = "0 0 22 * * MON-FRI", zone = "UTC")
    @Transactional(readOnly = true)
    public void sendDailyDigests() {
        log.info("Starting daily digest generation...");

        var managers = userRepo.findAll().stream()
                .filter(u -> u.getRole() == UserRole.MANAGER && u.isActive())
                .filter(u -> u.getEmail() != null && !u.getEmail().isBlank())
                .filter(AppUser::isEmailNotificationsEnabled)
                .toList();

        if (managers.isEmpty()) {
            log.info("No managers with email enabled — skipping digest.");
            return;
        }

        LocalDate monday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate prevMonday = monday.minusWeeks(1);
        String dayOfWeek = LocalDate.now().getDayOfWeek().toString();

        for (var manager : managers) {
            try {
                generateAndSendDigest(manager, monday, prevMonday, dayOfWeek);
            } catch (Exception e) {
                log.error("Failed to generate digest for manager {}: {}", manager.getUserId(), e.getMessage(), e);
            }
        }

        log.info("Daily digest complete for {} managers.", managers.size());
    }

    private void generateAndSendDigest(AppUser manager, LocalDate monday, LocalDate prevMonday, String dayOfWeek) {
        var teamMembers = assignmentRepo.findByManagerUserId(manager.getUserId()).stream()
                .map(a -> a.getMember())
                .filter(AppUser::isActive)
                .toList();

        if (teamMembers.isEmpty()) {
            return;
        }

        var memberIds = teamMembers.stream().map(AppUser::getUserId).toList();
        var currentPlans = planRepo.findByUserIdInAndWeekStartDate(memberIds, monday);
        var prevPlans = planRepo.findByUserIdInAndWeekStartDate(memberIds, prevMonday);

        // Build rules-based analysis per member
        var memberAnalyses = new ArrayList<MemberAnalysis>();
        for (var member : teamMembers) {
            var plan = currentPlans.stream()
                    .filter(p -> p.getUserId().equals(member.getUserId()))
                    .findFirst().orElse(null);
            var prevPlan = prevPlans.stream()
                    .filter(p -> p.getUserId().equals(member.getUserId()))
                    .findFirst().orElse(null);
            memberAnalyses.add(analyzeMember(member, plan, prevPlan, dayOfWeek));
        }

        // Try AI-polished digest, fall back to rules-only
        String digestHtml;
        String aiSummary = tryAiDigest(manager.getFullName(), memberAnalyses, dayOfWeek, monday);
        if (aiSummary != null) {
            digestHtml = buildAiDigestHtml(manager.getFullName(), aiSummary, monday);
        } else {
            digestHtml = buildFallbackDigestHtml(manager.getFullName(), memberAnalyses, monday);
        }

        emailService.sendRawHtmlEmail(
                manager.getEmail(),
                "Daily Team Digest — " + dayOfWeek.charAt(0) + dayOfWeek.substring(1).toLowerCase(),
                digestHtml
        );
    }

    // ============ RULES ENGINE ============

    private MemberAnalysis analyzeMember(AppUser member, WeeklyPlan plan, WeeklyPlan prevPlan, String dayOfWeek) {
        var flags = new ArrayList<String>();
        String name = member.getFullName();

        if (plan == null) {
            flags.add("No plan created for this week");
            return new MemberAnalysis(name, null, 0, 0, BigDecimal.ZERO, BigDecimal.ZERO, 0.0, flags, List.of());
        }

        var commits = plan.getCommits();
        var status = plan.getStatus();

        // Flag: still in DRAFT
        if (status == PlanStatus.DRAFT) {
            boolean isLateInWeek = dayOfWeek.equals("WEDNESDAY") || dayOfWeek.equals("THURSDAY") || dayOfWeek.equals("FRIDAY");
            if (isLateInWeek) {
                flags.add("Plan still in DRAFT — not locked yet");
            }
        }

        // Flag: previous week not reconciled
        if (prevPlan != null && prevPlan.getStatus() != PlanStatus.RECONCILED && prevPlan.getStatus() != PlanStatus.CARRY_FORWARD) {
            flags.add("Previous week's plan not yet reconciled (status: " + prevPlan.getStatus() + ")");
        }

        // Commit-level analysis
        var commitSummaries = new ArrayList<CommitSummary>();
        for (var commit : commits) {
            commitSummaries.add(new CommitSummary(
                    commit.getTitle(),
                    commit.getChessPriority().name(),
                    commit.getCompletionPct() != null ? commit.getCompletionPct() : 0,
                    commit.getPlannedHours(),
                    commit.getActualHours(),
                    commit.isCarryForward()
            ));

            // Flag: MUST_DO items with low completion late in week
            if (commit.getChessPriority() == ChessPriority.MUST_DO) {
                int pct = commit.getCompletionPct() != null ? commit.getCompletionPct() : 0;
                if (dayOfWeek.equals("WEDNESDAY") || dayOfWeek.equals("THURSDAY")) {
                    if (pct < 50) {
                        flags.add("MUST_DO \"" + commit.getTitle() + "\" at only " + pct + "% completion");
                    }
                } else if (dayOfWeek.equals("FRIDAY")) {
                    if (pct < 80) {
                        flags.add("MUST_DO \"" + commit.getTitle() + "\" at only " + pct + "% — end of week");
                    }
                }
            }
        }

        // Totals
        var totalPlanned = commits.stream().map(WeeklyCommit::getPlannedHours).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
        var totalActual = commits.stream().map(WeeklyCommit::getActualHours).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
        double avgCompletion = commits.stream().map(WeeklyCommit::getCompletionPct).filter(Objects::nonNull).mapToInt(Integer::intValue).average().orElse(0.0);

        // Flag: hours variance > 30%
        if (totalPlanned.compareTo(BigDecimal.ZERO) > 0 && totalActual.compareTo(BigDecimal.ZERO) > 0) {
            double variance = Math.abs(totalActual.doubleValue() - totalPlanned.doubleValue()) / totalPlanned.doubleValue();
            if (variance > 0.3) {
                flags.add("Hours variance: planned " + totalPlanned + "h vs actual " + totalActual + "h (" + Math.round(variance * 100) + "% off)");
            }
        }

        return new MemberAnalysis(name, status, commits.size(), (int) commits.stream().filter(c -> c.getChessPriority() == ChessPriority.MUST_DO).count(),
                totalPlanned, totalActual, avgCompletion, flags, commitSummaries);
    }

    // ============ AI DIGEST ============

    private String tryAiDigest(String managerName, List<MemberAnalysis> analyses, String dayOfWeek, LocalDate weekOf) {
        if (!aiConfig.enabled()) {
            log.info("AI not configured — using fallback digest.");
            return null;
        }

        try {
            StringBuilder context = new StringBuilder();
            context.append("Day: ").append(dayOfWeek).append(", Week of: ").append(weekOf).append("\n\n");

            for (var a : analyses) {
                context.append("## ").append(a.name).append("\n");
                context.append("Plan status: ").append(a.status != null ? a.status : "NO PLAN").append("\n");
                context.append("Commits: ").append(a.totalCommits).append(" (").append(a.mustDoCount).append(" MUST_DO)\n");
                context.append("Hours: ").append(a.totalPlanned).append("h planned / ").append(a.totalActual).append("h actual\n");
                context.append("Avg completion: ").append(String.format("%.0f", a.avgCompletion)).append("%\n");

                if (!a.flags.isEmpty()) {
                    context.append("FLAGS:\n");
                    for (var flag : a.flags) {
                        context.append("  ⚠ ").append(flag).append("\n");
                    }
                }

                if (!a.commits.isEmpty()) {
                    context.append("Commits:\n");
                    for (var c : a.commits) {
                        context.append("  - ").append(c.title).append(" [").append(c.priority).append("] ")
                                .append(c.completionPct).append("% complete")
                                .append(c.carryForward ? " (carry-forward)" : "")
                                .append("\n");
                    }
                }
                context.append("\n");
            }

            String prompt = """
                    You are writing a concise daily team digest email for a manager named %s.

                    Here is the team's status data for %s, week of %s:

                    %s

                    Write a brief, scannable email digest in HTML format. Use these guidelines:
                    - Start with a 1-2 sentence executive summary of the team's overall status
                    - For each team member, write 1-2 sentences summarizing their status
                    - Highlight any flags or concerns prominently (use bold or color)
                    - If someone is doing well, acknowledge it briefly
                    - End with a "Key Actions" section if any flags need attention
                    - Keep it under 300 words total
                    - Use clean, professional HTML with inline styles
                    - Do NOT include <html>, <head>, or <body> tags — just the content div
                    - Use a warm but professional tone

                    Return ONLY the HTML, no other text.
                    """.formatted(managerName, dayOfWeek, weekOf, context);

            return callClaude(prompt);
        } catch (Exception e) {
            log.warn("AI digest generation failed, falling back to rules: {}", e.getMessage());
            return null;
        }
    }

    private String callClaude(String userPrompt) {
        try {
            String apiBaseUrl = (aiConfig.baseUrl() != null && !aiConfig.baseUrl().isBlank())
                    ? aiConfig.baseUrl()
                    : "https://api.anthropic.com/v1";

            var requestBody = Map.of(
                    "model", aiConfig.model(),
                    "max_tokens", 1024,
                    "messages", List.of(Map.of("role", "user", "content", userPrompt))
            );

            var body = RequestBody.create(
                    objectMapper.writeValueAsString(requestBody),
                    MediaType.get("application/json")
            );

            var request = new Request.Builder()
                    .url(apiBaseUrl + "/chat/completions")
                    .addHeader("Authorization", "Bearer " + aiConfig.apiKey())
                    .post(body)
                    .build();

            try (var response = httpClient.newCall(request).execute()) {
                var responseBody = response.body() != null ? response.body().string() : "";
                if (!response.isSuccessful()) {
                    log.error("AI API error {}: {}", response.code(), responseBody);
                    return null;
                }
                var root = objectMapper.readTree(responseBody);
                var content = root.path("choices").path(0).path("message").path("content").asText("");
                content = content.strip();
                if (content.startsWith("```")) {
                    int firstNewline = content.indexOf('\n');
                    if (firstNewline != -1) content = content.substring(firstNewline + 1);
                    if (content.endsWith("```")) content = content.substring(0, content.length() - 3).strip();
                }
                return content;
            }
        } catch (Exception e) {
            log.error("AI API call failed: {}", e.getMessage());
            return null;
        }
    }

    // ============ EMAIL HTML BUILDERS ============

    private String buildAiDigestHtml(String managerName, String aiContent, LocalDate weekOf) {
        return """
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 24px; border-radius: 16px 16px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 20px;">Daily Team Digest</h1>
                        <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 14px;">Week of %s</p>
                    </div>
                    <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
                        %s
                    </div>
                    <p style="color: #9e9e9e; font-size: 12px; margin-top: 16px; text-align: center;">Weekly Commit System — Daily Digest</p>
                </div>
                """.formatted(weekOf, aiContent);
    }

    private String buildFallbackDigestHtml(String managerName, List<MemberAnalysis> analyses, LocalDate weekOf) {
        var sb = new StringBuilder();
        sb.append("""
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 24px; border-radius: 16px 16px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 20px;">Daily Team Digest</h1>
                        <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 14px;">Week of %s</p>
                    </div>
                    <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
                """.formatted(weekOf));

        for (var a : analyses) {
            String statusColor = a.status == null ? "#ef4444" : switch (a.status) {
                case DRAFT -> "#f59e0b";
                case LOCKED, RECONCILING -> "#3b82f6";
                case RECONCILED, CARRY_FORWARD -> "#22c55e";
            };

            sb.append("""
                    <div style="border-bottom: 1px solid #f3f4f6; padding: 16px 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <strong style="font-size: 15px;">%s</strong>
                            <span style="background: %s; color: white; padding: 2px 10px; border-radius: 12px; font-size: 12px;">%s</span>
                        </div>
                        <p style="color: #6b7280; margin: 6px 0 0; font-size: 13px;">
                            %d commits (%d MUST_DO) · %.0f%% avg completion · %sh planned / %sh actual
                        </p>
                    """.formatted(
                    a.name,
                    statusColor,
                    a.status != null ? a.status : "NO PLAN",
                    a.totalCommits,
                    a.mustDoCount,
                    a.avgCompletion,
                    a.totalPlanned,
                    a.totalActual
            ));

            if (!a.flags.isEmpty()) {
                for (var flag : a.flags) {
                    sb.append("""
                            <p style="color: #dc2626; font-size: 13px; margin: 4px 0 0; padding-left: 12px; border-left: 3px solid #fca5a5;">
                                %s
                            </p>
                            """.formatted(flag));
                }
            }
            sb.append("</div>");
        }

        sb.append("""
                    </div>
                    <p style="color: #9e9e9e; font-size: 12px; margin-top: 16px; text-align: center;">Weekly Commit System — Daily Digest</p>
                </div>
                """);
        return sb.toString();
    }

    // ============ DATA RECORDS ============

    record MemberAnalysis(
            String name,
            PlanStatus status,
            int totalCommits,
            int mustDoCount,
            BigDecimal totalPlanned,
            BigDecimal totalActual,
            double avgCompletion,
            List<String> flags,
            List<CommitSummary> commits
    ) {}

    record CommitSummary(
            String title,
            String priority,
            int completionPct,
            BigDecimal plannedHours,
            BigDecimal actualHours,
            boolean carryForward
    ) {}
}
