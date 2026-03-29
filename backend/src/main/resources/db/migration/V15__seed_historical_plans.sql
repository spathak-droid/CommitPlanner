-- Seed historical weekly plans with realistic data for demo
-- Today is ~2026-03-28. Seeding 8 weeks of history for all 3 ICs.
-- Performance profiles:
--   Jordan Kim (user-1): Strong performer, high completion, mostly A-priority
--   Avery Brooks (ic-product): Average performer, mixed results, some carry-forward
--   Sam Rivera (ic-design): Improving over time, started rough, getting better

-- Clean up any existing plans/reviews for these users to avoid conflicts
DELETE FROM manager_reviews WHERE weekly_plan_id IN (SELECT id FROM weekly_plans WHERE user_id IN ('user-1', 'ic-product', 'ic-design'));
DELETE FROM weekly_commits WHERE weekly_plan_id IN (SELECT id FROM weekly_plans WHERE user_id IN ('user-1', 'ic-product', 'ic-design'));
DELETE FROM weekly_plans WHERE user_id IN ('user-1', 'ic-product', 'ic-design');

-- ============================================================
-- WEEK 1: 2026-02-02 (8 weeks ago) — oldest
-- ============================================================

-- Jordan Kim - RECONCILED, 85% avg
INSERT INTO weekly_plans (id, user_id, week_start_date, status, version) VALUES
  ('d0000000-0001-0001-0000-000000000001', 'user-1', '2026-02-02', 'RECONCILED', 3);
INSERT INTO weekly_commits (id, weekly_plan_id, title, description, chess_priority, outcome_id, planned_hours, actual_hours, completion_pct, reconciliation_notes, sort_order) VALUES
  ('e0000000-0001-0001-0001-000000000001', 'd0000000-0001-0001-0000-000000000001', 'Design onboarding flow v2', 'Wireframes and prototype for simplified onboarding', 'MUST_DO', 'c1000000-0000-0000-0000-000000000001', 12, 14, 90, 'Completed all screens, minor feedback pending', 0),
  ('e0000000-0001-0001-0002-000000000001', 'd0000000-0001-0001-0000-000000000001', 'Fix login timeout bug', 'Users experiencing session drops after 30 min', 'MUST_DO', 'c1000000-0000-0000-0000-000000000003', 6, 5, 100, 'Root cause found and patched', 1),
  ('e0000000-0001-0001-0003-000000000001', 'd0000000-0001-0001-0000-000000000001', 'Write unit tests for auth module', 'Cover edge cases in token refresh', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000004', 8, 9, 75, 'Got through 80% of test cases', 2),
  ('e0000000-0001-0001-0004-000000000001', 'd0000000-0001-0001-0000-000000000001', 'Update API documentation', 'Swagger docs for v2 endpoints', 'NICE_TO_DO', 'c1000000-0000-0000-0000-000000000002', 4, 3, 70, 'Core endpoints documented', 3);

-- Avery Brooks - RECONCILED, 55% avg
INSERT INTO weekly_plans (id, user_id, week_start_date, status, version) VALUES
  ('d0000000-0001-0002-0000-000000000001', 'ic-product', '2026-02-02', 'RECONCILED', 3);
INSERT INTO weekly_commits (id, weekly_plan_id, title, description, chess_priority, outcome_id, planned_hours, actual_hours, completion_pct, reconciliation_notes, carry_forward, sort_order) VALUES
  ('e0000000-0001-0002-0001-000000000001', 'd0000000-0001-0002-0000-000000000001', 'Competitor analysis report', 'Deep dive into 3 competitor pricing models', 'MUST_DO', 'c1000000-0000-0000-0000-000000000005', 10, 8, 60, 'Got through 2 of 3 competitors', false, 0),
  ('e0000000-0001-0002-0002-000000000001', 'd0000000-0001-0002-0000-000000000001', 'Trial flow A/B test setup', 'Configure experiments for trial page', 'MUST_DO', 'c1000000-0000-0000-0000-000000000007', 8, 6, 40, 'Blocked by analytics team', true, 1),
  ('e0000000-0001-0002-0003-000000000001', 'd0000000-0001-0002-0000-000000000001', 'Customer interview summaries', 'Synthesize 5 enterprise prospect calls', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000006', 6, 7, 70, 'All interviews summarized', false, 2),
  ('e0000000-0001-0002-0004-000000000001', 'd0000000-0001-0002-0000-000000000001', 'Update product roadmap deck', 'Q2 roadmap for leadership review', 'NICE_TO_DO', 'c1000000-0000-0000-0000-000000000005', 4, 2, 50, 'Draft started, needs data', false, 3);

-- Sam Rivera - RECONCILED, 40% avg (rough start)
INSERT INTO weekly_plans (id, user_id, week_start_date, status, version) VALUES
  ('d0000000-0001-0003-0000-000000000001', 'ic-design', '2026-02-02', 'RECONCILED', 3);
INSERT INTO weekly_commits (id, weekly_plan_id, title, description, chess_priority, outcome_id, planned_hours, actual_hours, completion_pct, reconciliation_notes, carry_forward, sort_order) VALUES
  ('e0000000-0001-0003-0001-000000000001', 'd0000000-0001-0003-0000-000000000001', 'Design system color tokens', 'Migrate to new color system', 'MUST_DO', 'c1000000-0000-0000-0000-000000000002', 14, 10, 35, 'Underestimated scope, only base tokens done', true, 0),
  ('e0000000-0001-0003-0002-000000000001', 'd0000000-0001-0003-0000-000000000001', 'Icon library audit', 'Catalog and tag all icons', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000002', 6, 8, 50, 'Audit complete, tagging in progress', false, 1),
  ('e0000000-0001-0003-0003-000000000001', 'd0000000-0001-0003-0000-000000000001', 'Mobile nav prototype', 'Bottom nav patterns for mobile app', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000001', 8, 4, 30, 'Only explored patterns, no prototype yet', true, 2);

-- ============================================================
-- WEEK 2: 2026-02-09
-- ============================================================

-- Jordan Kim - RECONCILED, 90% avg
INSERT INTO weekly_plans (id, user_id, week_start_date, status, version) VALUES
  ('d0000000-0002-0001-0000-000000000001', 'user-1', '2026-02-09', 'RECONCILED', 3);
INSERT INTO weekly_commits (id, weekly_plan_id, title, description, chess_priority, outcome_id, planned_hours, actual_hours, completion_pct, reconciliation_notes, sort_order) VALUES
  ('e0000000-0002-0001-0001-000000000001', 'd0000000-0002-0001-0000-000000000001', 'Implement onboarding stepper', 'Build the 3-step onboarding component', 'MUST_DO', 'c1000000-0000-0000-0000-000000000001', 16, 15, 95, 'Feature complete, in QA', 0),
  ('e0000000-0002-0001-0002-000000000001', 'd0000000-0002-0001-0000-000000000001', 'Deploy monitoring dashboards', 'Grafana boards for key API metrics', 'MUST_DO', 'c1000000-0000-0000-0000-000000000003', 8, 8, 100, 'All dashboards live', 1),
  ('e0000000-0002-0001-0003-000000000001', 'd0000000-0002-0001-0000-000000000001', 'PR review backlog', 'Clear 6 pending PRs for team', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000012', 6, 7, 85, '5 of 6 reviewed', 2),
  ('e0000000-0002-0001-0004-000000000001', 'd0000000-0002-0001-0000-000000000001', 'Mentoring session with Sam', 'Help Sam with design system patterns', 'NICE_TO_DO', 'c1000000-0000-0000-0000-000000000011', 2, 2, 100, 'Great session, covered component architecture', 3);

-- Avery Brooks - RECONCILED, 65% avg
INSERT INTO weekly_plans (id, user_id, week_start_date, status, version) VALUES
  ('d0000000-0002-0002-0000-000000000001', 'ic-product', '2026-02-09', 'RECONCILED', 3);
INSERT INTO weekly_commits (id, weekly_plan_id, title, description, chess_priority, outcome_id, planned_hours, actual_hours, completion_pct, reconciliation_notes, carry_forward, sort_order) VALUES
  ('e0000000-0002-0002-0001-000000000001', 'd0000000-0002-0002-0000-000000000001', 'Trial flow A/B test (carried)', 'Resumed after analytics unblocked', 'MUST_DO', 'c1000000-0000-0000-0000-000000000007', 8, 10, 80, 'Test running, early results look good', false, 0),
  ('e0000000-0002-0002-0002-000000000001', 'd0000000-0002-0002-0000-000000000001', 'Enterprise pricing page mock', 'High-fidelity mocks for pricing redesign', 'MUST_DO', 'c1000000-0000-0000-0000-000000000005', 10, 8, 70, 'V1 mocks done, awaiting feedback', false, 1),
  ('e0000000-0002-0002-0003-000000000001', 'd0000000-0002-0002-0000-000000000001', 'Churn analysis Q4 data', 'Pull and analyze churn reasons', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000008', 6, 4, 50, 'Data pulled, analysis half done', true, 2),
  ('e0000000-0002-0002-0004-000000000001', 'd0000000-0002-0002-0000-000000000001', 'Write self-serve onboarding PRD', 'Requirements doc for self-serve flow', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000007', 6, 5, 60, 'First draft complete', false, 3);

-- Sam Rivera - RECONCILED, 50% avg (slight improvement)
INSERT INTO weekly_plans (id, user_id, week_start_date, status, version) VALUES
  ('d0000000-0002-0003-0000-000000000001', 'ic-design', '2026-02-09', 'RECONCILED', 3);
INSERT INTO weekly_commits (id, weekly_plan_id, title, description, chess_priority, outcome_id, planned_hours, actual_hours, completion_pct, reconciliation_notes, carry_forward, sort_order) VALUES
  ('e0000000-0002-0003-0001-000000000001', 'd0000000-0002-0003-0000-000000000001', 'Design system color tokens (carried)', 'Continue color token migration', 'MUST_DO', 'c1000000-0000-0000-0000-000000000002', 10, 12, 65, 'Semantic tokens done, component tokens next', false, 0),
  ('e0000000-0002-0003-0002-000000000001', 'd0000000-0002-0003-0000-000000000001', 'Mobile nav prototype (carried)', 'Resume bottom nav prototyping', 'MUST_DO', 'c1000000-0000-0000-0000-000000000001', 8, 7, 50, 'Prototype started, 2 of 4 patterns done', false, 1),
  ('e0000000-0002-0003-0003-000000000001', 'd0000000-0002-0003-0000-000000000001', 'Design sprint facilitation prep', 'Materials for Tuesday design sprint', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000011', 4, 5, 40, 'Ran out of time before sprint', false, 2);

-- ============================================================
-- WEEK 3: 2026-02-16
-- ============================================================

-- Jordan Kim - RECONCILED, 88% avg
INSERT INTO weekly_plans (id, user_id, week_start_date, status, version) VALUES
  ('d0000000-0003-0001-0000-000000000001', 'user-1', '2026-02-16', 'RECONCILED', 3);
INSERT INTO weekly_commits (id, weekly_plan_id, title, description, chess_priority, outcome_id, planned_hours, actual_hours, completion_pct, reconciliation_notes, sort_order) VALUES
  ('e0000000-0003-0001-0001-000000000001', 'd0000000-0003-0001-0000-000000000001', 'Onboarding QA fixes', 'Address 8 QA findings from stepper', 'MUST_DO', 'c1000000-0000-0000-0000-000000000001', 10, 12, 100, 'All 8 issues resolved and verified', 0),
  ('e0000000-0003-0001-0002-000000000001', 'd0000000-0003-0001-0000-000000000001', 'Alerting rules for P0 incidents', 'PagerDuty integration + alert thresholds', 'MUST_DO', 'c1000000-0000-0000-0000-000000000003', 8, 7, 90, 'Alerts configured, testing in staging', 1),
  ('e0000000-0003-0001-0003-000000000001', 'd0000000-0003-0001-0000-000000000001', 'Sprint retro action items', 'Follow through on 3 retro improvements', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000011', 4, 4, 75, '2 of 3 items addressed', 2),
  ('e0000000-0003-0001-0004-000000000001', 'd0000000-0003-0001-0000-000000000001', 'Tech debt: remove legacy auth', 'Clean up deprecated OAuth1 code', 'NICE_TO_DO', 'c1000000-0000-0000-0000-000000000004', 6, 5, 85, 'Legacy code removed, tests passing', 3);

-- Avery Brooks - RECONCILED, 58% avg
INSERT INTO weekly_plans (id, user_id, week_start_date, status, version) VALUES
  ('d0000000-0003-0002-0000-000000000001', 'ic-product', '2026-02-16', 'RECONCILED', 3);
INSERT INTO weekly_commits (id, weekly_plan_id, title, description, chess_priority, outcome_id, planned_hours, actual_hours, completion_pct, reconciliation_notes, carry_forward, sort_order) VALUES
  ('e0000000-0003-0002-0001-000000000001', 'd0000000-0003-0002-0000-000000000001', 'Enterprise demo environment', 'Set up dedicated demo instance for sales', 'MUST_DO', 'c1000000-0000-0000-0000-000000000005', 12, 10, 55, 'Environment up but data seeding incomplete', true, 0),
  ('e0000000-0003-0002-0002-000000000001', 'd0000000-0003-0002-0000-000000000001', 'Churn analysis (carried)', 'Finish Q4 churn root cause analysis', 'MUST_DO', 'c1000000-0000-0000-0000-000000000008', 6, 7, 75, 'Analysis complete, drafting recommendations', false, 1),
  ('e0000000-0003-0002-0003-000000000001', 'd0000000-0003-0002-0000-000000000001', 'Sales enablement deck', 'Create pitch deck for enterprise prospects', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000006', 8, 4, 40, 'Only outline done, got pulled into support', true, 2);

-- Sam Rivera - RECONCILED, 60% avg (improving)
INSERT INTO weekly_plans (id, user_id, week_start_date, status, version) VALUES
  ('d0000000-0003-0003-0000-000000000001', 'ic-design', '2026-02-16', 'RECONCILED', 3);
INSERT INTO weekly_commits (id, weekly_plan_id, title, description, chess_priority, outcome_id, planned_hours, actual_hours, completion_pct, reconciliation_notes, sort_order) VALUES
  ('e0000000-0003-0003-0001-000000000001', 'd0000000-0003-0003-0000-000000000001', 'Component library buttons', 'Design and spec all button variants', 'MUST_DO', 'c1000000-0000-0000-0000-000000000002', 10, 11, 70, 'Primary and secondary done, tertiary next week', 0),
  ('e0000000-0003-0003-0002-000000000001', 'd0000000-0003-0003-0000-000000000001', 'Onboarding illustration set', '6 spot illustrations for new onboarding', 'MUST_DO', 'c1000000-0000-0000-0000-000000000001', 12, 10, 65, '4 of 6 illustrations complete', 1),
  ('e0000000-0003-0003-0003-000000000001', 'd0000000-0003-0003-0000-000000000001', 'Design critique session', 'Lead weekly design critique', 'NICE_TO_DO', 'c1000000-0000-0000-0000-000000000011', 2, 2, 50, 'Session held but cut short', 2);

-- ============================================================
-- WEEK 4: 2026-02-23
-- ============================================================

-- Jordan Kim - RECONCILED, 92% avg
INSERT INTO weekly_plans (id, user_id, week_start_date, status, version) VALUES
  ('d0000000-0004-0001-0000-000000000001', 'user-1', '2026-02-23', 'RECONCILED', 3);
INSERT INTO weekly_commits (id, weekly_plan_id, title, description, chess_priority, outcome_id, planned_hours, actual_hours, completion_pct, reconciliation_notes, sort_order) VALUES
  ('e0000000-0004-0001-0001-000000000001', 'd0000000-0004-0001-0000-000000000001', 'Launch onboarding v2 to prod', 'Feature flag rollout 10% -> 50% -> 100%', 'MUST_DO', 'c1000000-0000-0000-0000-000000000001', 8, 8, 100, 'Launched to 100%, metrics looking great', 0),
  ('e0000000-0004-0001-0002-000000000001', 'd0000000-0004-0001-0000-000000000001', 'Incident response runbook', 'Document P0 response procedures', 'MUST_DO', 'c1000000-0000-0000-0000-000000000003', 6, 5, 90, 'Runbook published to wiki', 1),
  ('e0000000-0004-0001-0003-000000000001', 'd0000000-0004-0001-0000-000000000001', 'CI pipeline optimization', 'Reduce build time from 12 to 6 min', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000011', 8, 10, 85, 'Down to 7 min, caching helped', 2),
  ('e0000000-0004-0001-0004-000000000001', 'd0000000-0004-0001-0000-000000000001', 'Interview 2 senior candidates', 'Technical phone screens', 'NICE_TO_DO', 'c1000000-0000-0000-0000-000000000009', 3, 3, 100, 'Both interviews done, 1 strong hire rec', 3);

-- Avery Brooks - RECONCILED, 70% avg (better week)
INSERT INTO weekly_plans (id, user_id, week_start_date, status, version) VALUES
  ('d0000000-0004-0002-0000-000000000001', 'ic-product', '2026-02-23', 'RECONCILED', 3);
INSERT INTO weekly_commits (id, weekly_plan_id, title, description, chess_priority, outcome_id, planned_hours, actual_hours, completion_pct, reconciliation_notes, sort_order) VALUES
  ('e0000000-0004-0002-0001-000000000001', 'd0000000-0004-0002-0000-000000000001', 'A/B test results analysis', 'Pull and present trial flow experiment data', 'MUST_DO', 'c1000000-0000-0000-0000-000000000007', 8, 8, 85, 'Results show 18% lift in variant B', 0),
  ('e0000000-0004-0002-0002-000000000001', 'd0000000-0004-0002-0000-000000000001', 'Enterprise demo data seeding', 'Finish demo environment setup', 'MUST_DO', 'c1000000-0000-0000-0000-000000000005', 6, 7, 80, 'Demo ready for sales calls', 1),
  ('e0000000-0004-0002-0003-000000000001', 'd0000000-0004-0002-0000-000000000001', 'Sales enablement deck (carried)', 'Finish enterprise pitch deck', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000006', 6, 5, 60, 'Deck 70% done, missing case studies', 2),
  ('e0000000-0004-0002-0004-000000000001', 'd0000000-0004-0002-0000-000000000001', 'Write blog post on product vision', 'Thought leadership content', 'NICE_TO_DO', 'c1000000-0000-0000-0000-000000000008', 4, 3, 50, 'Outline and first section written', 3);

-- Sam Rivera - RECONCILED, 68% avg (solid improvement)
INSERT INTO weekly_plans (id, user_id, week_start_date, status, version) VALUES
  ('d0000000-0004-0003-0000-000000000001', 'ic-design', '2026-02-23', 'RECONCILED', 3);
INSERT INTO weekly_commits (id, weekly_plan_id, title, description, chess_priority, outcome_id, planned_hours, actual_hours, completion_pct, reconciliation_notes, sort_order) VALUES
  ('e0000000-0004-0003-0001-000000000001', 'd0000000-0004-0003-0000-000000000001', 'Component library form inputs', 'Design input, select, checkbox, radio variants', 'MUST_DO', 'c1000000-0000-0000-0000-000000000002', 12, 13, 75, 'Input and select done, checkbox/radio next', 0),
  ('e0000000-0004-0003-0002-000000000001', 'd0000000-0004-0003-0000-000000000001', 'Finish onboarding illustrations', 'Complete remaining 2 illustrations', 'MUST_DO', 'c1000000-0000-0000-0000-000000000001', 8, 7, 80, '5 of 6 done, last one in review', 1),
  ('e0000000-0004-0003-0003-000000000001', 'd0000000-0004-0003-0000-000000000001', 'Accessibility audit findings', 'Review and document a11y issues', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000002', 6, 6, 50, 'Audit run, 12 issues found and documented', 2);

-- ============================================================
-- WEEK 5: 2026-03-02
-- ============================================================

-- Jordan Kim - RECONCILED, 87% avg
INSERT INTO weekly_plans (id, user_id, week_start_date, status, version) VALUES
  ('d0000000-0005-0001-0000-000000000001', 'user-1', '2026-03-02', 'RECONCILED', 3);
INSERT INTO weekly_commits (id, weekly_plan_id, title, description, chess_priority, outcome_id, planned_hours, actual_hours, completion_pct, reconciliation_notes, sort_order) VALUES
  ('e0000000-0005-0001-0001-000000000001', 'd0000000-0005-0001-0000-000000000001', 'Onboarding v2 metrics review', 'Analyze first week of onboarding data', 'MUST_DO', 'c1000000-0000-0000-0000-000000000001', 6, 6, 100, 'Time-to-first-value dropped 45%!', 0),
  ('e0000000-0005-0001-0002-000000000001', 'd0000000-0005-0001-0000-000000000001', 'Database query optimization', 'Fix N+1 queries in plan listing', 'MUST_DO', 'c1000000-0000-0000-0000-000000000004', 10, 12, 80, 'Top 5 slow queries fixed, 2 more identified', 1),
  ('e0000000-0005-0001-0003-000000000001', 'd0000000-0005-0001-0000-000000000001', 'Hiring: review take-home assignments', 'Evaluate 4 candidate submissions', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000009', 4, 4, 100, 'All reviewed, 2 advancing to final round', 2),
  ('e0000000-0005-0001-0004-000000000001', 'd0000000-0005-0001-0000-000000000001', 'Team knowledge sharing session', 'Present architecture decisions for Q1', 'NICE_TO_DO', 'c1000000-0000-0000-0000-000000000011', 3, 3, 70, 'Session done, slides need publishing', 3);

-- Avery Brooks - RECONCILED, 60% avg (dipped)
INSERT INTO weekly_plans (id, user_id, week_start_date, status, version) VALUES
  ('d0000000-0005-0002-0000-000000000001', 'ic-product', '2026-03-02', 'RECONCILED', 3);
INSERT INTO weekly_commits (id, weekly_plan_id, title, description, chess_priority, outcome_id, planned_hours, actual_hours, completion_pct, reconciliation_notes, carry_forward, sort_order) VALUES
  ('e0000000-0005-0002-0001-000000000001', 'd0000000-0005-0002-0000-000000000001', 'Enterprise contract template', 'Legal-reviewed contract template for sales', 'MUST_DO', 'c1000000-0000-0000-0000-000000000005', 10, 8, 55, 'Legal had major revisions, back and forth', true, 0),
  ('e0000000-0005-0002-0002-000000000001', 'd0000000-0005-0002-0000-000000000001', 'Self-serve conversion funnel fix', 'Address drop-off at payment step', 'MUST_DO', 'c1000000-0000-0000-0000-000000000007', 8, 6, 70, 'Identified 3 UX issues, fixed 2', false, 1),
  ('e0000000-0005-0002-0003-000000000001', 'd0000000-0005-0002-0000-000000000001', 'Quarterly business review prep', 'Slides and data for QBR', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000008', 8, 10, 55, 'Data gathered, deck half built', true, 2);

-- Sam Rivera - RECONCILED, 72% avg (continuing upward)
INSERT INTO weekly_plans (id, user_id, week_start_date, status, version) VALUES
  ('d0000000-0005-0003-0000-000000000001', 'ic-design', '2026-03-02', 'RECONCILED', 3);
INSERT INTO weekly_commits (id, weekly_plan_id, title, description, chess_priority, outcome_id, planned_hours, actual_hours, completion_pct, reconciliation_notes, sort_order) VALUES
  ('e0000000-0005-0003-0001-000000000001', 'd0000000-0005-0003-0000-000000000001', 'Fix top 6 a11y issues', 'Address critical accessibility problems', 'MUST_DO', 'c1000000-0000-0000-0000-000000000002', 10, 10, 80, '5 of 6 fixed, last one needs eng support', 0),
  ('e0000000-0005-0003-0002-000000000001', 'd0000000-0005-0003-0000-000000000001', 'Dashboard redesign concepts', '3 layout concepts for analytics dashboard', 'MUST_DO', 'c1000000-0000-0000-0000-000000000002', 12, 11, 75, 'All 3 concepts presented, stakeholder picked option B', 1),
  ('e0000000-0005-0003-0003-000000000001', 'd0000000-0005-0003-0000-000000000001', 'Figma component cleanup', 'Organize and name all components properly', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000012', 4, 4, 60, 'Main pages cleaned up', 2);

-- ============================================================
-- WEEK 6: 2026-03-09
-- ============================================================

-- Jordan Kim - RECONCILED, 93% avg (peak week)
INSERT INTO weekly_plans (id, user_id, week_start_date, status, version) VALUES
  ('d0000000-0006-0001-0000-000000000001', 'user-1', '2026-03-09', 'RECONCILED', 3);
INSERT INTO weekly_commits (id, weekly_plan_id, title, description, chess_priority, outcome_id, planned_hours, actual_hours, completion_pct, reconciliation_notes, sort_order) VALUES
  ('e0000000-0006-0001-0001-000000000001', 'd0000000-0006-0001-0000-000000000001', 'Task completion tracking feature', 'Build progress tracking for user tasks', 'MUST_DO', 'c1000000-0000-0000-0000-000000000002', 14, 14, 95, 'Feature shipped, A/B test starting', 0),
  ('e0000000-0006-0001-0002-000000000001', 'd0000000-0006-0001-0000-000000000001', 'Remaining DB query fixes', 'Fix last 2 slow queries identified', 'MUST_DO', 'c1000000-0000-0000-0000-000000000004', 6, 5, 100, 'All queries optimized, p95 latency down 60%', 1),
  ('e0000000-0006-0001-0003-000000000001', 'd0000000-0006-0001-0000-000000000001', 'Final round interviews', '2 senior eng final interviews', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000009', 4, 4, 100, 'Both done, extending offer to candidate A', 2),
  ('e0000000-0006-0001-0004-000000000001', 'd0000000-0006-0001-0000-000000000001', 'Deploy frequency automation', 'Auto-deploy on green CI for staging', 'NICE_TO_DO', 'c1000000-0000-0000-0000-000000000011', 4, 5, 80, 'Pipeline working, needs prod approval step', 3);

-- Avery Brooks - RECONCILED, 62% avg
INSERT INTO weekly_plans (id, user_id, week_start_date, status, version) VALUES
  ('d0000000-0006-0002-0000-000000000001', 'ic-product', '2026-03-09', 'RECONCILED', 3);
INSERT INTO weekly_commits (id, weekly_plan_id, title, description, chess_priority, outcome_id, planned_hours, actual_hours, completion_pct, reconciliation_notes, carry_forward, sort_order) VALUES
  ('e0000000-0006-0002-0001-000000000001', 'd0000000-0006-0002-0000-000000000001', 'Enterprise contract (carried)', 'Finalize legal-approved contract template', 'MUST_DO', 'c1000000-0000-0000-0000-000000000005', 6, 8, 80, 'Template finalized, sales team trained', false, 0),
  ('e0000000-0006-0002-0002-000000000001', 'd0000000-0006-0002-0000-000000000001', 'QBR presentation (carried)', 'Finish and rehearse QBR deck', 'MUST_DO', 'c1000000-0000-0000-0000-000000000008', 8, 6, 70, 'Deck done, dry run with Nina went well', false, 1),
  ('e0000000-0006-0002-0003-000000000001', 'd0000000-0006-0002-0000-000000000001', 'Pricing experiment design', 'Design 3 pricing tiers experiment', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000007', 8, 6, 45, 'Research done, experiment not launched yet', true, 2),
  ('e0000000-0006-0002-0004-000000000001', 'd0000000-0006-0002-0000-000000000001', 'User feedback synthesis', 'Summarize 20 NPS responses', 'NICE_TO_DO', 'c1000000-0000-0000-0000-000000000008', 4, 3, 50, 'Read all responses, summary in progress', false, 3);

-- Sam Rivera - RECONCILED, 78% avg (strong improvement)
INSERT INTO weekly_plans (id, user_id, week_start_date, status, version) VALUES
  ('d0000000-0006-0003-0000-000000000001', 'ic-design', '2026-03-09', 'RECONCILED', 3);
INSERT INTO weekly_commits (id, weekly_plan_id, title, description, chess_priority, outcome_id, planned_hours, actual_hours, completion_pct, reconciliation_notes, sort_order) VALUES
  ('e0000000-0006-0003-0001-000000000001', 'd0000000-0006-0003-0000-000000000001', 'Dashboard redesign hi-fi', 'High-fidelity designs for option B', 'MUST_DO', 'c1000000-0000-0000-0000-000000000002', 14, 15, 85, 'All screens designed, dev handoff ready', 0),
  ('e0000000-0006-0003-0002-000000000001', 'd0000000-0006-0003-0000-000000000001', 'Design system documentation', 'Write usage guidelines for components', 'MUST_DO', 'c1000000-0000-0000-0000-000000000002', 8, 7, 80, 'Buttons and inputs documented', 1),
  ('e0000000-0006-0003-0003-000000000001', 'd0000000-0006-0003-0000-000000000001', 'Hiring: portfolio reviews', 'Review 5 design candidate portfolios', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000010', 3, 3, 100, 'All reviewed, 2 moving to interview', 2),
  ('e0000000-0006-0003-0004-000000000001', 'd0000000-0006-0003-0000-000000000001', 'Design QA for onboarding', 'Verify implementation matches designs', 'NICE_TO_DO', 'c1000000-0000-0000-0000-000000000001', 3, 3, 50, 'Checked 3 of 6 screens', 3);

-- ============================================================
-- WEEK 7: 2026-03-16 (last last week) — RECONCILED
-- ============================================================

-- Jordan Kim - RECONCILED, 90% avg
INSERT INTO weekly_plans (id, user_id, week_start_date, status, version) VALUES
  ('d0000000-0007-0001-0000-000000000001', 'user-1', '2026-03-16', 'RECONCILED', 3);
INSERT INTO weekly_commits (id, weekly_plan_id, title, description, chess_priority, outcome_id, planned_hours, actual_hours, completion_pct, reconciliation_notes, sort_order) VALUES
  ('e0000000-0007-0001-0001-000000000001', 'd0000000-0007-0001-0000-000000000001', 'Task completion A/B results', 'Analyze experiment and decide rollout', 'MUST_DO', 'c1000000-0000-0000-0000-000000000002', 6, 6, 100, 'Task completion rate +12%, shipping to all users', 0),
  ('e0000000-0007-0001-0002-000000000001', 'd0000000-0007-0001-0000-000000000001', 'API rate limiting implementation', 'Protect public APIs from abuse', 'MUST_DO', 'c1000000-0000-0000-0000-000000000003', 12, 14, 85, 'Rate limiting live, tuning thresholds', 1),
  ('e0000000-0007-0001-0003-000000000001', 'd0000000-0007-0001-0000-000000000001', 'Senior eng onboarding plan', 'Prepare 30/60/90 for new hire starting Apr', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000009', 4, 3, 90, 'Plan drafted and reviewed with manager', 2),
  ('e0000000-0007-0001-0004-000000000001', 'd0000000-0007-0001-0000-000000000001', 'Reduce PR review time', 'Set up auto-assignment and review SLAs', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000012', 6, 6, 85, 'Auto-assignment working, avg review time down to 3.5h', 3);

-- Avery Brooks - RECONCILED, 58% avg (inconsistent)
INSERT INTO weekly_plans (id, user_id, week_start_date, status, version) VALUES
  ('d0000000-0007-0002-0000-000000000001', 'ic-product', '2026-03-16', 'RECONCILED', 3);
INSERT INTO weekly_commits (id, weekly_plan_id, title, description, chess_priority, outcome_id, planned_hours, actual_hours, completion_pct, reconciliation_notes, carry_forward, sort_order) VALUES
  ('e0000000-0007-0002-0001-000000000001', 'd0000000-0007-0002-0000-000000000001', 'Enterprise deal support - Acme Corp', 'Technical requirements gathering for Acme', 'MUST_DO', 'c1000000-0000-0000-0000-000000000005', 10, 12, 70, 'Requirements doc done, pricing discussion ongoing', false, 0),
  ('e0000000-0007-0002-0002-000000000001', 'd0000000-0007-0002-0000-000000000001', 'Pricing experiment launch', 'Finally launch the pricing tier test', 'MUST_DO', 'c1000000-0000-0000-0000-000000000007', 6, 4, 40, 'Blocked again — engineering capacity issue', true, 1),
  ('e0000000-0007-0002-0003-000000000001', 'd0000000-0007-0002-0000-000000000001', 'Monthly churn report', 'Pull Feb churn data and analyze', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000008', 6, 6, 65, 'Data pulled, report 70% written', false, 2),
  ('e0000000-0007-0002-0004-000000000001', 'd0000000-0007-0002-0000-000000000001', 'Customer advisory board planning', 'Organize Q2 CAB session', 'NICE_TO_DO', 'c1000000-0000-0000-0000-000000000006', 4, 3, 55, 'Invites drafted, venue TBD', false, 3);

-- Sam Rivera - RECONCILED, 82% avg (great week)
INSERT INTO weekly_plans (id, user_id, week_start_date, status, version) VALUES
  ('d0000000-0007-0003-0000-000000000001', 'ic-design', '2026-03-16', 'RECONCILED', 3);
INSERT INTO weekly_commits (id, weekly_plan_id, title, description, chess_priority, outcome_id, planned_hours, actual_hours, completion_pct, reconciliation_notes, sort_order) VALUES
  ('e0000000-0007-0003-0001-000000000001', 'd0000000-0007-0003-0000-000000000001', 'Dashboard implementation support', 'Pair with eng on dashboard build', 'MUST_DO', 'c1000000-0000-0000-0000-000000000002', 10, 10, 90, 'All core components implemented correctly', 0),
  ('e0000000-0007-0003-0002-000000000001', 'd0000000-0007-0003-0000-000000000001', 'Mobile responsive audit', 'Test all screens on mobile breakpoints', 'MUST_DO', 'c1000000-0000-0000-0000-000000000001', 8, 8, 85, 'Found 8 issues, fixed 6', 1),
  ('e0000000-0007-0003-0003-000000000001', 'd0000000-0007-0003-0000-000000000001', 'Design interview: mid-level candidate', 'Portfolio review + design exercise', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000010', 3, 3, 100, 'Strong candidate, recommending hire', 2),
  ('e0000000-0007-0003-0004-000000000001', 'd0000000-0007-0003-0000-000000000001', 'Brand guidelines update', 'Refresh brand book with new colors', 'NICE_TO_DO', 'c1000000-0000-0000-0000-000000000002', 4, 4, 50, 'Color section updated, typography next', 3);

-- ============================================================
-- WEEK 8: 2026-03-23 (last week) — RECONCILED
-- ============================================================

-- Jordan Kim - RECONCILED, 88% avg
INSERT INTO weekly_plans (id, user_id, week_start_date, status, version) VALUES
  ('d0000000-0008-0001-0000-000000000001', 'user-1', '2026-03-23', 'RECONCILED', 3);
INSERT INTO weekly_commits (id, weekly_plan_id, title, description, chess_priority, outcome_id, planned_hours, actual_hours, completion_pct, reconciliation_notes, sort_order) VALUES
  ('e0000000-0008-0001-0001-000000000001', 'd0000000-0008-0001-0000-000000000001', 'Rate limiting threshold tuning', 'Adjust limits based on first week of data', 'MUST_DO', 'c1000000-0000-0000-0000-000000000003', 6, 5, 95, 'Final thresholds set, no false positives', 0),
  ('e0000000-0008-0001-0002-000000000001', 'd0000000-0008-0001-0000-000000000001', 'Onboarding v2 iteration', 'Address user feedback from first 2 weeks', 'MUST_DO', 'c1000000-0000-0000-0000-000000000001', 10, 12, 85, 'Top 3 feedback items addressed', 1),
  ('e0000000-0008-0001-0003-000000000001', 'd0000000-0008-0001-0000-000000000001', 'New hire desk and access setup', 'Prepare workstation for senior eng starting Apr 1', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000009', 3, 3, 100, 'Everything ready for day 1', 2),
  ('e0000000-0008-0001-0004-000000000001', 'd0000000-0008-0001-0000-000000000001', 'E2E test suite expansion', 'Add 10 critical path E2E tests', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000004', 8, 9, 75, '8 of 10 tests written and passing', 3);

-- Avery Brooks - RECONCILED, 52% avg (tough week)
INSERT INTO weekly_plans (id, user_id, week_start_date, status, version) VALUES
  ('d0000000-0008-0002-0000-000000000001', 'ic-product', '2026-03-23', 'RECONCILED', 3);
INSERT INTO weekly_commits (id, weekly_plan_id, title, description, chess_priority, outcome_id, planned_hours, actual_hours, completion_pct, reconciliation_notes, carry_forward, sort_order) VALUES
  ('e0000000-0008-0002-0001-000000000001', 'd0000000-0008-0002-0000-000000000001', 'Acme Corp proposal finalization', 'Final pricing and SOW for Acme deal', 'MUST_DO', 'c1000000-0000-0000-0000-000000000005', 12, 10, 60, 'SOW drafted but legal needs another round', true, 0),
  ('e0000000-0008-0002-0002-000000000001', 'd0000000-0008-0002-0000-000000000001', 'Pricing experiment (carried again)', 'Third attempt to launch pricing test', 'MUST_DO', 'c1000000-0000-0000-0000-000000000007', 6, 4, 35, 'Still blocked, escalated to VP Eng', true, 1),
  ('e0000000-0008-0002-0003-000000000001', 'd0000000-0008-0002-0000-000000000001', 'Competitive win/loss analysis', 'Why we lost 3 deals last month', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000006', 8, 6, 60, 'Interviews done, writeup pending', false, 2),
  ('e0000000-0008-0002-0004-000000000001', 'd0000000-0008-0002-0000-000000000001', 'Product metrics dashboard spec', 'Requirements for product health dashboard', 'NICE_TO_DO', 'c1000000-0000-0000-0000-000000000008', 4, 3, 50, 'Metrics identified, spec started', false, 3);

-- Sam Rivera - RECONCILED, 80% avg (consistent now)
INSERT INTO weekly_plans (id, user_id, week_start_date, status, version) VALUES
  ('d0000000-0008-0003-0000-000000000001', 'ic-design', '2026-03-23', 'RECONCILED', 3);
INSERT INTO weekly_commits (id, weekly_plan_id, title, description, chess_priority, outcome_id, planned_hours, actual_hours, completion_pct, reconciliation_notes, sort_order) VALUES
  ('e0000000-0008-0003-0001-000000000001', 'd0000000-0008-0003-0000-000000000001', 'Dashboard dev QA round 2', 'Final design QA before launch', 'MUST_DO', 'c1000000-0000-0000-0000-000000000002', 8, 8, 90, 'All issues resolved, looks pixel-perfect', 0),
  ('e0000000-0008-0003-0002-000000000001', 'd0000000-0008-0003-0000-000000000001', 'Mobile fix remaining 2 issues', 'Fix last responsive breakpoint bugs', 'MUST_DO', 'c1000000-0000-0000-0000-000000000001', 6, 5, 85, 'Both fixed and verified on device', 1),
  ('e0000000-0008-0003-0003-000000000001', 'd0000000-0008-0003-0000-000000000001', 'Design system Storybook setup', 'Configure Storybook for component docs', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000012', 8, 9, 70, 'Storybook running, 60% of components added', 2),
  ('e0000000-0008-0003-0004-000000000001', 'd0000000-0008-0003-0000-000000000001', 'Typography scale refinement', 'Finalize type scale for brand refresh', 'NICE_TO_DO', 'c1000000-0000-0000-0000-000000000002', 4, 4, 75, 'Scale defined, implementing in tokens', 3);

-- ============================================================
-- MANAGER REVIEWS — approve top performers, flag concerns
-- ============================================================

-- Maya (manager-1) reviews for Jordan Kim
INSERT INTO manager_reviews (id, weekly_plan_id, reviewer_id, status, feedback, reviewed_at) VALUES
  ('f0000000-0001-0001-0000-000000000001', 'd0000000-0007-0001-0000-000000000001', 'manager-1', 'APPROVED', 'Outstanding week Jordan. Rate limiting and A/B results show real impact. Keep the momentum going into next sprint.', '2026-03-20 14:30:00'),
  ('f0000000-0001-0002-0000-000000000001', 'd0000000-0008-0001-0000-000000000001', 'manager-1', 'APPROVED', 'Solid execution across the board. New hire prep shows great team ownership. E2E tests will pay dividends.', '2026-03-27 16:00:00');

-- Nina (lead-product) reviews for Avery Brooks
INSERT INTO manager_reviews (id, weekly_plan_id, reviewer_id, status, feedback, reviewed_at) VALUES
  ('f0000000-0002-0001-0000-000000000001', 'd0000000-0007-0002-0000-000000000001', 'lead-product', 'FLAGGED', 'Avery, the pricing experiment has been carried forward 3 weeks now. We need to either unblock this or descope. Lets talk Monday about escalation path.', '2026-03-20 15:00:00'),
  ('f0000000-0002-0002-0000-000000000001', 'd0000000-0008-0002-0000-000000000001', 'lead-product', 'FLAGGED', 'Completion trending down. Acme deal is important but the carry-forward pattern on pricing is concerning. Blocking items need to be surfaced earlier in the week.', '2026-03-27 11:30:00');

-- Adrian (director-ops) reviews for Sam Rivera
INSERT INTO manager_reviews (id, weekly_plan_id, reviewer_id, status, feedback, reviewed_at) VALUES
  ('f0000000-0003-0001-0000-000000000001', 'd0000000-0007-0003-0000-000000000001', 'director-ops', 'APPROVED', 'Great improvement Sam! Dashboard work is high quality and the mobile audit was thorough. Really seeing the growth trajectory.', '2026-03-21 10:00:00'),
  ('f0000000-0003-0002-0000-000000000001', 'd0000000-0008-0003-0000-000000000001', 'director-ops', 'APPROVED', 'Consistent delivery this week. Storybook setup is a great investment. Keep pushing on the design system — its becoming a real asset.', '2026-03-27 14:00:00');

-- ============================================================
-- CURRENT WEEK: 2026-03-30 — DRAFT plans (in progress)
-- ============================================================

-- Jordan Kim - DRAFT (current week)
INSERT INTO weekly_plans (id, user_id, week_start_date, status, version) VALUES
  ('d0000000-0009-0001-0000-000000000001', 'user-1', '2026-03-30', 'DRAFT', 0);
INSERT INTO weekly_commits (id, weekly_plan_id, title, description, chess_priority, outcome_id, planned_hours, sort_order) VALUES
  ('e0000000-0009-0001-0001-000000000001', 'd0000000-0009-0001-0000-000000000001', 'New hire Day 1 onboarding', 'Welcome and orient new senior engineer', 'MUST_DO', 'c1000000-0000-0000-0000-000000000009', 8, 0),
  ('e0000000-0009-0001-0002-000000000001', 'd0000000-0009-0001-0000-000000000001', 'E2E test suite: finish last 2', 'Complete remaining critical path tests', 'MUST_DO', 'c1000000-0000-0000-0000-000000000004', 6, 1),
  ('e0000000-0009-0001-0003-000000000001', 'd0000000-0009-0001-0000-000000000001', 'Sprint planning facilitation', 'Run sprint planning for Q2 Sprint 1', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000011', 4, 2);

-- Avery Brooks - DRAFT (current week)
INSERT INTO weekly_plans (id, user_id, week_start_date, status, version) VALUES
  ('d0000000-0009-0002-0000-000000000001', 'ic-product', '2026-03-30', 'DRAFT', 0);
INSERT INTO weekly_commits (id, weekly_plan_id, title, description, chess_priority, outcome_id, planned_hours, sort_order) VALUES
  ('e0000000-0009-0002-0001-000000000001', 'd0000000-0009-0002-0000-000000000001', 'Acme Corp SOW finalization', 'Get legal sign-off and send to Acme', 'MUST_DO', 'c1000000-0000-0000-0000-000000000005', 8, 0),
  ('e0000000-0009-0002-0002-000000000001', 'd0000000-0009-0002-0000-000000000001', 'Pricing experiment — escalation follow-up', 'Work with VP Eng to unblock', 'MUST_DO', 'c1000000-0000-0000-0000-000000000007', 6, 1);

-- Sam Rivera - DRAFT (current week)
INSERT INTO weekly_plans (id, user_id, week_start_date, status, version) VALUES
  ('d0000000-0009-0003-0000-000000000001', 'ic-design', '2026-03-30', 'DRAFT', 0);
INSERT INTO weekly_commits (id, weekly_plan_id, title, description, chess_priority, outcome_id, planned_hours, sort_order) VALUES
  ('e0000000-0009-0003-0001-000000000001', 'd0000000-0009-0003-0000-000000000001', 'Dashboard launch prep', 'Final assets and release notes for dashboard', 'MUST_DO', 'c1000000-0000-0000-0000-000000000002', 8, 0),
  ('e0000000-0009-0003-0002-000000000001', 'd0000000-0009-0003-0000-000000000001', 'Storybook: add remaining components', 'Finish adding all design system components', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000012', 10, 1),
  ('e0000000-0009-0003-0003-000000000001', 'd0000000-0009-0003-0000-000000000001', 'New hire design buddy plan', 'Prepare design onboarding for mid-level hire', 'SHOULD_DO', 'c1000000-0000-0000-0000-000000000010', 4, 2);
