import { describe, it, expect } from 'vitest';
import {
  fetchRcdoTree,
  login,
  fetchCurrentPlan,
  fetchTeamPlans,
  fetchNotifications,
} from '../../services/api';

describe('API client', () => {
  describe('fetchRcdoTree', () => {
    it('returns RCDO tree from API', async () => {
      const tree = await fetchRcdoTree();
      expect(tree).toHaveLength(1);
      expect(tree[0].name).toBe('Rally Cry 1');
      expect(tree[0].definingObjectives).toHaveLength(1);
      expect(tree[0].definingObjectives[0].outcomes).toHaveLength(2);
    });
  });

  describe('login', () => {
    it('returns auth response', async () => {
      const auth = await login('ic1', 'password');
      expect(auth.userId).toBe('ic1');
      expect(auth.fullName).toBe('IC User 1');
      expect(auth.role).toBe('IC');
      expect(auth.token).toBe('mock-jwt-token');
    });
  });

  describe('fetchCurrentPlan', () => {
    it('returns current weekly plan', async () => {
      const plan = await fetchCurrentPlan();
      expect(plan.id).toBe('plan-1');
      expect(plan.status).toBe('DRAFT');
      expect(plan.commits).toHaveLength(1);
      expect(plan.commits[0].title).toBe('Build login page');
    });
  });

  describe('fetchTeamPlans', () => {
    it('returns team plan summaries', async () => {
      const plans = await fetchTeamPlans('2026-03-23');
      expect(plans).toHaveLength(1);
      expect(plans[0].userId).toBe('ic1');
      expect(plans[0].fullName).toBe('IC User 1');
      expect(plans[0].hasPlan).toBe(true);
    });
  });

  describe('fetchNotifications', () => {
    it('returns notifications array', async () => {
      const notifications = await fetchNotifications();
      expect(notifications).toEqual([]);
    });
  });
});
