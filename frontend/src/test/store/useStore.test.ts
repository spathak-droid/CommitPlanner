import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../store/useStore';

describe('useStore', () => {
  beforeEach(() => {
    // Reset store to defaults before each test
    useStore.setState({
      userId: '',
      fullName: '',
      role: 'IC',
      token: '',
      isAuthenticated: false,
      currentPlan: null,
      planError: null,
      rcdoTree: [],
      loadingRcdo: false,
      loadingPlan: false,
      teamPlans: [],
      rcdoAlignment: [],
      loadingTeam: false,
      toast: null,
      commitmentsActionTick: 0,
    });
  });

  describe('login', () => {
    it('sets userId, fullName, role, token, and isAuthenticated', () => {
      useStore.getState().login({
        userId: 'user1',
        fullName: 'Test User',
        role: 'IC',
        token: 'jwt-123',
        managedUserIds: [],
      });

      const state = useStore.getState();
      expect(state.userId).toBe('user1');
      expect(state.fullName).toBe('Test User');
      expect(state.role).toBe('IC');
      expect(state.token).toBe('jwt-123');
      expect(state.isAuthenticated).toBe(true);
    });

    it('sets manager role correctly', () => {
      useStore.getState().login({
        userId: 'mgr1',
        fullName: 'Manager User',
        role: 'MANAGER',
        token: 'jwt-456',
        managedUserIds: ['ic1', 'ic2'],
      });

      const state = useStore.getState();
      expect(state.role).toBe('MANAGER');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('logout', () => {
    it('clears user state', () => {
      // Login first
      useStore.getState().login({
        userId: 'user1',
        fullName: 'Test User',
        role: 'IC',
        token: 'jwt-123',
        managedUserIds: [],
      });

      // Now logout
      useStore.getState().logout();

      const state = useStore.getState();
      expect(state.userId).toBe('');
      expect(state.fullName).toBe('');
      expect(state.role).toBe('IC');
      expect(state.token).toBe('');
      expect(state.isAuthenticated).toBe(false);
      expect(state.currentPlan).toBeNull();
      expect(state.teamPlans).toEqual([]);
      expect(state.rcdoAlignment).toEqual([]);
    });
  });

  describe('toast', () => {
    it('showToast sets toast', () => {
      useStore.getState().showToast('Success!', 'success');

      const state = useStore.getState();
      expect(state.toast).toEqual({ message: 'Success!', type: 'success' });
    });

    it('clearToast clears toast', () => {
      useStore.getState().showToast('Error!', 'error');
      useStore.getState().clearToast();

      expect(useStore.getState().toast).toBeNull();
    });
  });

  describe('setPlan', () => {
    it('updates currentPlan', () => {
      const plan = {
        id: 'plan-1',
        userId: 'ic1',
        weekStartDate: '2026-03-23',
        status: 'DRAFT' as const,
        reviewStatus: null,
        reviewFeedback: null,
        version: 0,
        commits: [],
        createdAt: '2026-03-23T10:00:00',
        updatedAt: '2026-03-23T10:00:00',
      };

      useStore.getState().setPlan(plan);
      expect(useStore.getState().currentPlan).toEqual(plan);
    });
  });

  describe('fetchCurrentPlan', () => {
    it('calls API and sets plan', async () => {
      await useStore.getState().fetchCurrentPlan();

      const state = useStore.getState();
      expect(state.currentPlan).not.toBeNull();
      expect(state.currentPlan?.id).toBe('plan-1');
      expect(state.currentPlan?.status).toBe('DRAFT');
      expect(state.loadingPlan).toBe(false);
    });
  });

  describe('triggerCommitmentsAction', () => {
    it('increments tick', () => {
      expect(useStore.getState().commitmentsActionTick).toBe(0);

      useStore.getState().triggerCommitmentsAction();
      expect(useStore.getState().commitmentsActionTick).toBe(1);

      useStore.getState().triggerCommitmentsAction();
      expect(useStore.getState().commitmentsActionTick).toBe(2);
    });
  });

  describe('fetchRcdo', () => {
    it('populates tree', async () => {
      await useStore.getState().fetchRcdo();

      const state = useStore.getState();
      expect(state.rcdoTree).toHaveLength(1);
      expect(state.rcdoTree[0].name).toBe('Rally Cry 1');
      expect(state.rcdoTree[0].definingObjectives).toHaveLength(1);
      expect(state.rcdoTree[0].definingObjectives[0].outcomes).toHaveLength(2);
      expect(state.loadingRcdo).toBe(false);
    });
  });
});
