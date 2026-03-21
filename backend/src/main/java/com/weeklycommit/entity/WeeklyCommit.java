package com.weeklycommit.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.weeklycommit.enums.ChessPriority;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "weekly_commits")
public class WeeklyCommit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "weekly_plan_id", nullable = false)
    @JsonIgnore
    private WeeklyPlan weeklyPlan;

    @Column(nullable = false)
    private String title;

    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "chess_priority", nullable = false)
    private ChessPriority chessPriority = ChessPriority.SHOULD_DO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "outcome_id", nullable = false)
    private Outcome outcome;

    @Column(name = "planned_hours")
    private BigDecimal plannedHours;

    @Column(name = "actual_hours")
    private BigDecimal actualHours;

    @Column(name = "completion_pct")
    private Integer completionPct;

    @Column(name = "reconciliation_notes")
    private String reconciliationNotes;

    @Column(name = "carry_forward", nullable = false)
    private boolean carryForward = false;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public WeeklyPlan getWeeklyPlan() { return weeklyPlan; }
    public void setWeeklyPlan(WeeklyPlan weeklyPlan) { this.weeklyPlan = weeklyPlan; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public ChessPriority getChessPriority() { return chessPriority; }
    public void setChessPriority(ChessPriority chessPriority) { this.chessPriority = chessPriority; }
    public Outcome getOutcome() { return outcome; }
    public void setOutcome(Outcome outcome) { this.outcome = outcome; }
    public BigDecimal getPlannedHours() { return plannedHours; }
    public void setPlannedHours(BigDecimal plannedHours) { this.plannedHours = plannedHours; }
    public BigDecimal getActualHours() { return actualHours; }
    public void setActualHours(BigDecimal actualHours) { this.actualHours = actualHours; }
    public Integer getCompletionPct() { return completionPct; }
    public void setCompletionPct(Integer completionPct) { this.completionPct = completionPct; }
    public String getReconciliationNotes() { return reconciliationNotes; }
    public void setReconciliationNotes(String reconciliationNotes) { this.reconciliationNotes = reconciliationNotes; }
    public boolean isCarryForward() { return carryForward; }
    public void setCarryForward(boolean carryForward) { this.carryForward = carryForward; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @PreUpdate
    protected void onUpdate() { this.updatedAt = LocalDateTime.now(); }
}
