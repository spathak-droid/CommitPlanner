package com.weeklycommit.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.weeklycommit.config.AnthropicConfig.AiConfig;
import com.weeklycommit.dto.RcdoTreeResponse;
import com.weeklycommit.dto.ai.*;
import com.weeklycommit.entity.AiInteraction;
import com.weeklycommit.entity.WeeklyPlan;
import com.weeklycommit.exception.AiUnavailableException;
import com.weeklycommit.repository.AiInteractionRepository;
import com.weeklycommit.repository.WeeklyPlanRepository;
import jakarta.annotation.PostConstruct;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);

    private final AiConfig config;
    private final RcdoService rcdoService;
    private final WeeklyPlanRepository planRepo;
    private final AiInteractionRepository interactionRepo;
    private final AiCacheService cacheService;
    private final AuthorizationService authService;
    private final ObjectMapper objectMapper;
    private OkHttpClient httpClient;
    private String apiBaseUrl;

    public AiService(
            AiConfig config,
            RcdoService rcdoService,
            WeeklyPlanRepository planRepo,
            AiInteractionRepository interactionRepo,
            AiCacheService cacheService,
            AuthorizationService authService,
            ObjectMapper objectMapper
    ) {
        this.config = config;
        this.rcdoService = rcdoService;
        this.planRepo = planRepo;
        this.interactionRepo = interactionRepo;
        this.cacheService = cacheService;
        this.authService = authService;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    void init() {
        if (config.enabled()) {
            this.httpClient = new OkHttpClient.Builder()
                    .connectTimeout(30, TimeUnit.SECONDS)
                    .readTimeout(60, TimeUnit.SECONDS)
                    .build();
            this.apiBaseUrl = (config.baseUrl() != null && !config.baseUrl().isBlank())
                    ? config.baseUrl()
                    : "https://api.anthropic.com/v1";
            log.info("AI client initialized — base={}, model={}", apiBaseUrl, config.model());
        } else {
            log.warn("ANTHROPIC_API_KEY not set — AI features disabled");
        }
    }

    public AiStatusResponse getStatus() {
        return new AiStatusResponse(config.enabled(), config.enabled() ? config.model() : null);
    }

    public void requireEnabled() {
        if (!config.enabled() || httpClient == null) {
            throw new AiUnavailableException("AI features are not configured. Set ANTHROPIC_API_KEY to enable.");
        }
    }

    // ---- Tier 1: Outcome Matching ----

    public List<OutcomeMatchResult> matchOutcomes(OutcomeMatchRequest request) {
        requireEnabled();
        String userId = authService.currentUserId();
        checkRateLimit(userId);

        String cacheKey = "match:" + request.title().toLowerCase().trim();
        List<OutcomeMatchResult> cached = cacheService.getCached(cacheKey, List.class);
        if (cached != null) return cached;

        String rcdoContext = buildRcdoContext();
        String prompt = """
                You are an AI assistant for a weekly planning tool. Given a commitment title and description, \
                match it to the most relevant outcomes from the RCDO hierarchy below.

                RCDO Hierarchy:
                %s

                Commitment title: "%s"
                Description: "%s"

                Return a JSON array of up to 3 best matching outcomes, ordered by confidence (highest first). \
                Each element must have these exact fields:
                - outcomeId (string UUID)
                - outcomeName (string)
                - rallyCryName (string)
                - definingObjectiveName (string)
                - confidence (number 0.0-1.0)
                - rationale (string, 1 sentence explaining why this matches)

                Return ONLY the JSON array, no other text.
                """.formatted(rcdoContext, request.title(), request.description() != null ? request.description() : "");

        long start = System.currentTimeMillis();
        String response = callClaude(prompt);
        long latency = System.currentTimeMillis() - start;

        try {
            List<OutcomeMatchResult> results = objectMapper.readValue(response, new TypeReference<>() {});
            cacheService.put(cacheKey, results);
            trackInteraction(userId, "match-outcomes", request.title(), response, latency);
            return results;
        } catch (Exception e) {
            log.error("Failed to parse outcome match response: {}", response, e);
            return List.of();
        }
    }

    // ---- Tier 1: Hours Estimation ----

    public HoursEstimate estimateHours(HoursEstimateRequest request) {
        requireEnabled();
        String userId = authService.currentUserId();
        checkRateLimit(userId);

        String historyContext = buildUserHistoryContext(userId);
        String prompt = """
                You are an AI assistant for a weekly planning tool. Estimate the hours needed for this commitment \
                based on the title, description, and the user's historical patterns.

                Commitment title: "%s"
                Description: "%s"
                Priority: %s

                User's recent commitment history (last 4 weeks):
                %s

                Return a JSON object with these exact fields:
                - estimatedHours (number, best estimate)
                - lowRange (number, optimistic)
                - highRange (number, pessimistic)
                - rationale (string, 1-2 sentences explaining the estimate)

                Return ONLY the JSON object, no other text.
                """.formatted(
                request.title(),
                request.description() != null ? request.description() : "",
                request.chessPriority() != null ? request.chessPriority() : "SHOULD_DO",
                historyContext
        );

        long start = System.currentTimeMillis();
        String response = callClaude(prompt);
        long latency = System.currentTimeMillis() - start;

        try {
            HoursEstimate result = objectMapper.readValue(response, HoursEstimate.class);
            trackInteraction(userId, "estimate-hours", request.title(), response, latency);
            return result;
        } catch (Exception e) {
            log.error("Failed to parse hours estimate response: {}", response, e);
            return new HoursEstimate(4.0, 2.0, 8.0, "Default estimate — AI parsing failed");
        }
    }

    // ---- Tier 2: Full Commit Suggestion ----

    public CommitSuggestionResponse suggestCommit(CommitSuggestionRequest request) {
        requireEnabled();
        String userId = authService.currentUserId();
        checkRateLimit(userId);

        String rcdoContext = buildRcdoContext();
        String historyContext = buildUserHistoryContext(userId);
        String prompt = """
                You are an AI assistant for a weekly planning tool. Based on the user's input, suggest a fully \
                structured weekly commitment.

                User input: "%s"

                RCDO Hierarchy (pick the best matching outcome):
                %s

                User's recent history:
                %s

                Return a JSON object with these exact fields:
                - suggestedTitle (string, concise action-oriented title)
                - suggestedDescription (string, 1-2 sentences)
                - suggestedPriority (string, one of: MUST_DO, SHOULD_DO, NICE_TO_DO)
                - suggestedOutcomeId (string UUID from the RCDO hierarchy above)
                - outcomeName (string, the name of the matched outcome)
                - estimatedHours (number)
                - rationale (string, 1-2 sentences explaining the suggestion)

                Return ONLY the JSON object, no other text.
                """.formatted(request.userInput(), rcdoContext, historyContext);

        long start = System.currentTimeMillis();
        String response = callClaude(prompt);
        long latency = System.currentTimeMillis() - start;

        try {
            CommitSuggestionResponse result = objectMapper.readValue(response, CommitSuggestionResponse.class);
            trackInteraction(userId, "suggest-commit", request.userInput(), response, latency);
            return result;
        } catch (Exception e) {
            log.error("Failed to parse commit suggestion response: {}", response, e);
            throw new RuntimeException("Failed to generate commit suggestion");
        }
    }

    // ---- Tier 2: Reconciliation Assist ----

    public ReconciliationAssist getReconciliationAssist(UUID commitId) {
        requireEnabled();
        String userId = authService.currentUserId();
        checkRateLimit(userId);

        String cacheKey = "recon:" + commitId;
        ReconciliationAssist cached = cacheService.getCached(cacheKey, ReconciliationAssist.class);
        if (cached != null) return cached;

        // Find the commit in user's plans
        var plans = planRepo.findByUserId(userId);
        String commitContext = "No commit context available.";
        for (var plan : plans) {
            for (var commit : plan.getCommits()) {
                if (commit.getId().equals(commitId)) {
                    commitContext = """
                            Title: %s
                            Description: %s
                            Priority: %s
                            Planned Hours: %s
                            Outcome: %s
                            Plan Status: %s
                            """.formatted(
                            commit.getTitle(),
                            commit.getDescription() != null ? commit.getDescription() : "N/A",
                            commit.getChessPriority(),
                            commit.getPlannedHours() != null ? commit.getPlannedHours() : "N/A",
                            commit.getOutcome().getName(),
                            plan.getStatus()
                    );
                    break;
                }
            }
        }

        String historyContext = buildUserHistoryContext(userId);
        String prompt = """
                You are an AI assistant helping with weekly plan reconciliation. Based on the commitment details \
                and the user's historical patterns, suggest reconciliation values.

                Current commitment:
                %s

                User's recent history:
                %s

                Return a JSON object with these exact fields:
                - suggestedCompletionPct (integer 0-100)
                - suggestedNotes (string, a template for reconciliation notes)
                - suggestCarryForward (boolean, whether this should carry to next week)
                - rationale (string, 1-2 sentences)

                Return ONLY the JSON object, no other text.
                """.formatted(commitContext, historyContext);

        long start = System.currentTimeMillis();
        String response = callClaude(prompt);
        long latency = System.currentTimeMillis() - start;

        try {
            ReconciliationAssist result = objectMapper.readValue(response, ReconciliationAssist.class);
            cacheService.put(cacheKey, result);
            trackInteraction(userId, "reconciliation-assist", commitContext, response, latency);
            return result;
        } catch (Exception e) {
            log.error("Failed to parse reconciliation assist response: {}", response, e);
            return new ReconciliationAssist(50, "Review and update with actual progress.", false, "Default suggestion — AI parsing failed");
        }
    }

    // ---- Tier 2: Review Insights ----

    public ReviewInsight getReviewInsight(UUID planId) {
        requireEnabled();
        String userId = authService.currentUserId();
        checkRateLimit(userId);

        String cacheKey = "review:" + planId;
        ReviewInsight cached = cacheService.getCached(cacheKey, ReviewInsight.class);
        if (cached != null) return cached;

        var plan = planRepo.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));

        StringBuilder planContext = new StringBuilder();
        planContext.append("Plan status: ").append(plan.getStatus()).append("\n");
        planContext.append("Week: ").append(plan.getWeekStartDate()).append("\n");
        planContext.append("Commits:\n");
        for (var commit : plan.getCommits()) {
            planContext.append("- ").append(commit.getTitle())
                    .append(" [").append(commit.getChessPriority()).append("]")
                    .append(" planned=").append(commit.getPlannedHours())
                    .append(" actual=").append(commit.getActualHours())
                    .append(" completion=").append(commit.getCompletionPct()).append("%")
                    .append(" carryForward=").append(commit.isCarryForward())
                    .append(" notes=").append(commit.getReconciliationNotes() != null ? commit.getReconciliationNotes() : "none")
                    .append("\n");
        }

        String prompt = """
                You are an AI assistant helping a manager review a team member's weekly plan. Analyze the plan \
                and provide insights for the review.

                Plan details:
                %s

                Return a JSON object with these exact fields:
                - patterns (array of strings, 2-3 observed patterns like "heavy on MUST_DO items" or "consistent carry-forward on same area")
                - riskSignals (array of strings, 0-2 risk signals like "underestimated hours significantly" or "low completion across board")
                - suggestedFeedback (string, 2-3 sentences of constructive feedback the manager could give)
                - overallAssessment (string, 1 sentence overall assessment)

                Return ONLY the JSON object, no other text.
                """.formatted(planContext);

        long start = System.currentTimeMillis();
        String response = callClaude(prompt);
        long latency = System.currentTimeMillis() - start;

        try {
            ReviewInsight result = objectMapper.readValue(response, ReviewInsight.class);
            cacheService.put(cacheKey, result);
            trackInteraction(userId, "review-insight", planContext.toString(), response, latency);
            return result;
        } catch (Exception e) {
            log.error("Failed to parse review insight response: {}", response, e);
            return new ReviewInsight(List.of("Unable to analyze patterns"), List.of(), "Review the plan manually.", "AI analysis unavailable");
        }
    }

    // ---- Tier 3: Alignment Suggestions ----

    public List<AlignmentSuggestion> getAlignmentSuggestions(String weekStart) {
        requireEnabled();
        String userId = authService.currentUserId();
        checkRateLimit(userId);

        String cacheKey = "align:" + weekStart;
        List<AlignmentSuggestion> cached = cacheService.getCached(cacheKey, List.class);
        if (cached != null) return cached;

        String rcdoContext = buildRcdoContext();
        LocalDate weekDate = weekStart != null ? LocalDate.parse(weekStart) : LocalDate.now();
        var allPlans = planRepo.findByWeekStartDate(weekDate);

        StringBuilder plansSummary = new StringBuilder();
        for (var plan : allPlans) {
            for (var commit : plan.getCommits()) {
                plansSummary.append("- ").append(commit.getTitle())
                        .append(" → ").append(commit.getOutcome().getName())
                        .append(" (").append(commit.getChessPriority()).append(")")
                        .append("\n");
            }
        }

        String prompt = """
                You are an AI assistant analyzing RCDO alignment across a team. Identify outcomes that are \
                abandoned or underserved and suggest focus areas.

                RCDO Hierarchy:
                %s

                Current week's commitments across all team members:
                %s

                Return a JSON array of up to 5 suggested focus areas, ordered by priority (highest first). \
                Each element must have these exact fields:
                - outcomeId (string UUID from the RCDO hierarchy)
                - outcomeName (string)
                - rallyCryName (string)
                - reason (string, 1-2 sentences why this needs attention)
                - priority (integer 1-5, where 1 is highest)

                Return ONLY the JSON array, no other text.
                """.formatted(rcdoContext, plansSummary.length() > 0 ? plansSummary : "No commitments this week.");

        long start = System.currentTimeMillis();
        String response = callClaude(prompt);
        long latency = System.currentTimeMillis() - start;

        try {
            List<AlignmentSuggestion> results = objectMapper.readValue(response, new TypeReference<>() {});
            cacheService.put(cacheKey, results);
            trackInteraction(userId, "alignment-suggestions", "week:" + weekStart, response, latency);
            return results;
        } catch (Exception e) {
            log.error("Failed to parse alignment suggestions: {}", response, e);
            return List.of();
        }
    }

    // ---- Tier 3: Weekly Digest ----

    public WeeklyDigest getWeeklyDigest(String weekStart) {
        requireEnabled();
        String userId = authService.currentUserId();
        checkRateLimit(userId);

        String cacheKey = "digest:" + weekStart;
        WeeklyDigest cached = cacheService.getCached(cacheKey, WeeklyDigest.class);
        if (cached != null) return cached;

        LocalDate weekDate = LocalDate.parse(weekStart);
        var allPlans = planRepo.findByWeekStartDate(weekDate);

        StringBuilder teamSummary = new StringBuilder();
        int totalCommits = 0;
        int totalCarryForward = 0;
        double totalPlanned = 0;
        double totalActual = 0;

        for (var plan : allPlans) {
            teamSummary.append("User: ").append(plan.getUserId())
                    .append(" Status: ").append(plan.getStatus()).append("\n");
            for (var commit : plan.getCommits()) {
                totalCommits++;
                if (commit.isCarryForward()) totalCarryForward++;
                if (commit.getPlannedHours() != null) totalPlanned += commit.getPlannedHours().doubleValue();
                if (commit.getActualHours() != null) totalActual += commit.getActualHours().doubleValue();
                teamSummary.append("  - ").append(commit.getTitle())
                        .append(" [").append(commit.getChessPriority()).append("]")
                        .append(" completion=").append(commit.getCompletionPct() != null ? commit.getCompletionPct() + "%" : "N/A")
                        .append("\n");
            }
        }

        String prompt = """
                You are an AI assistant generating a weekly team digest for a manager. Summarize the team's \
                performance for the week.

                Team data for week of %s:
                Total plans: %d
                Total commitments: %d
                Carry forward items: %d
                Total planned hours: %.1f
                Total actual hours: %.1f

                Detailed breakdown:
                %s

                Return a JSON object with these exact fields:
                - executiveSummary (string, 2-3 sentences high-level summary)
                - highlights (array of strings, 2-3 positive highlights)
                - concerns (array of strings, 0-2 areas of concern)
                - suggestedTalkingPoints (array of strings, 3-4 talking points for the team sync)

                Return ONLY the JSON object, no other text.
                """.formatted(weekStart, allPlans.size(), totalCommits, totalCarryForward, totalPlanned, totalActual, teamSummary);

        long start = System.currentTimeMillis();
        String response = callClaude(prompt);
        long latency = System.currentTimeMillis() - start;

        try {
            WeeklyDigest result = objectMapper.readValue(response, WeeklyDigest.class);
            cacheService.put(cacheKey, result);
            trackInteraction(userId, "weekly-digest", "week:" + weekStart, response, latency);
            return result;
        } catch (Exception e) {
            log.error("Failed to parse weekly digest: {}", response, e);
            return new WeeklyDigest("Unable to generate digest.", List.of(), List.of(), List.of());
        }
    }

    // ---- Context Building ----

    private String buildRcdoContext() {
        var tree = rcdoService.getTree();
        StringBuilder sb = new StringBuilder();
        for (var rc : tree) {
            sb.append("Rally Cry: ").append(rc.name()).append(" (id=").append(rc.id()).append(")\n");
            for (var dobj : rc.definingObjectives()) {
                sb.append("  Defining Objective: ").append(dobj.name()).append(" (id=").append(dobj.id()).append(")\n");
                for (var o : dobj.outcomes()) {
                    sb.append("    Outcome: ").append(o.name())
                            .append(" (id=").append(o.id()).append(")")
                            .append(" — ").append(o.description())
                            .append(" Target: ").append(o.measurableTarget())
                            .append("\n");
                }
            }
        }
        return sb.toString();
    }

    private String buildUserHistoryContext(String userId) {
        LocalDate now = LocalDate.now();
        LocalDate fourWeeksAgo = now.minusWeeks(4);
        var plans = planRepo.findByUserIdAndWeekStartDateBetween(userId, fourWeeksAgo, now);

        if (plans.isEmpty()) return "No recent history available.";

        StringBuilder sb = new StringBuilder();
        for (var plan : plans) {
            sb.append("Week of ").append(plan.getWeekStartDate()).append(" (").append(plan.getStatus()).append("):\n");
            for (var commit : plan.getCommits()) {
                sb.append("  - ").append(commit.getTitle())
                        .append(" [").append(commit.getChessPriority()).append("]")
                        .append(" planned=").append(commit.getPlannedHours() != null ? commit.getPlannedHours() + "h" : "N/A")
                        .append(" actual=").append(commit.getActualHours() != null ? commit.getActualHours() + "h" : "N/A")
                        .append(" completion=").append(commit.getCompletionPct() != null ? commit.getCompletionPct() + "%" : "N/A")
                        .append("\n");
            }
        }
        return sb.toString();
    }

    // ---- Claude API Call ----

    private String callClaude(String userPrompt) {
        try {
            Map<String, Object> requestBody = Map.of(
                    "model", config.model(),
                    "max_tokens", config.maxTokens(),
                    "messages", List.of(Map.of("role", "user", "content", userPrompt))
            );

            RequestBody body = RequestBody.create(
                    objectMapper.writeValueAsString(requestBody),
                    MediaType.get("application/json")
            );

            Request request = new Request.Builder()
                    .url(apiBaseUrl + "/chat/completions")
                    .addHeader("Authorization", "Bearer " + config.apiKey())
                    .post(body)
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                String responseBody = response.body() != null ? response.body().string() : "";
                if (!response.isSuccessful()) {
                    log.error("AI API error {}: {}", response.code(), responseBody);
                    throw new RuntimeException("AI API returned " + response.code());
                }
                JsonNode root = objectMapper.readTree(responseBody);
                return root.path("choices").path(0).path("message").path("content").asText("{}");
            }
        } catch (IOException e) {
            log.error("AI API call failed: {}", e.getMessage(), e);
            throw new RuntimeException("AI API call failed", e);
        }
    }

    // ---- Rate Limiting ----

    private void checkRateLimit(String userId) {
        if (cacheService.isRateLimited(userId)) {
            throw new IllegalStateException("AI rate limit exceeded. Please wait a minute before trying again.");
        }
        cacheService.incrementRateLimit(userId);
    }

    // ---- Interaction Tracking ----

    private void trackInteraction(String userId, String feature, String context, String response, long latencyMs) {
        try {
            var interaction = new AiInteraction();
            interaction.setUserId(userId);
            interaction.setFeature(feature);
            interaction.setContextSummary(context != null && context.length() > 500 ? context.substring(0, 500) : context);
            interaction.setResponseSummary(response != null && response.length() > 500 ? response.substring(0, 500) : response);
            interaction.setLatencyMs((int) latencyMs);
            interactionRepo.save(interaction);
        } catch (Exception e) {
            log.warn("Failed to track AI interaction: {}", e.getMessage());
        }
    }
}
