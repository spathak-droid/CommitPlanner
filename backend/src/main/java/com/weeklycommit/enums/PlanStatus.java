package com.weeklycommit.enums;

public enum PlanStatus {
    DRAFT,
    LOCKED,
    RECONCILING,
    RECONCILED,
    CARRY_FORWARD;

    public boolean canTransitionTo(PlanStatus target) {
        return switch (this) {
            case DRAFT -> target == LOCKED;
            case LOCKED -> target == RECONCILING || target == DRAFT;
            case RECONCILING -> target == RECONCILED || target == DRAFT;
            case RECONCILED -> target == CARRY_FORWARD || target == DRAFT;
            case CARRY_FORWARD -> target == DRAFT;
        };
    }
}
