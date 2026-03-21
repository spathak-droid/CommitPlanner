-- Seed RCDO Hierarchy

-- Rally Cry 1: Product Excellence
INSERT INTO rally_cries (id, name, description) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'Product Excellence', 'Deliver best-in-class product experiences that delight customers');

INSERT INTO defining_objectives (id, rally_cry_id, name, description) VALUES
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Improve Core UX', 'Reduce friction in primary user workflows'),
    ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Platform Reliability', 'Achieve 99.9% uptime across all services');

INSERT INTO outcomes (id, defining_objective_id, name, description, measurable_target) VALUES
    ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Reduce Onboarding Time', 'Cut new user onboarding from 10 min to 3 min', 'Onboarding < 3 minutes'),
    ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'Increase Task Completion Rate', 'Improve task completion from 65% to 85%', 'Task completion >= 85%'),
    ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000002', 'Zero Critical Incidents', 'No P0 incidents for 90 consecutive days', '0 P0 incidents in 90 days'),
    ('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000002', 'Reduce MTTR', 'Mean time to recovery under 15 minutes', 'MTTR < 15 min');

-- Rally Cry 2: Revenue Growth
INSERT INTO rally_cries (id, name, description) VALUES
    ('a1000000-0000-0000-0000-000000000002', 'Revenue Growth', 'Accelerate revenue through expansion and new market entry');

INSERT INTO defining_objectives (id, rally_cry_id, name, description) VALUES
    ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'Enterprise Sales Pipeline', 'Build repeatable enterprise sales motion'),
    ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'Self-Serve Conversion', 'Improve free-to-paid conversion rate');

INSERT INTO outcomes (id, defining_objective_id, name, description, measurable_target) VALUES
    ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000003', 'Close 5 Enterprise Deals', 'Sign 5 enterprise contracts in Q1', '5 signed contracts'),
    ('c1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000003', 'Reduce Sales Cycle', 'Cut average sales cycle from 90 to 60 days', 'Avg cycle <= 60 days'),
    ('c1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000004', 'Improve Trial-to-Paid', 'Increase conversion from 5% to 12%', 'Conversion >= 12%'),
    ('c1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000004', 'Reduce Churn', 'Decrease monthly churn from 8% to 4%', 'Monthly churn <= 4%');

-- Rally Cry 3: Team Scaling
INSERT INTO rally_cries (id, name, description) VALUES
    ('a1000000-0000-0000-0000-000000000003', 'Team Scaling', 'Build the team and culture to support 3x growth');

INSERT INTO defining_objectives (id, rally_cry_id, name, description) VALUES
    ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000003', 'Hiring Pipeline', 'Fill all critical roles within 45 days'),
    ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000003', 'Engineering Velocity', 'Improve developer productivity and satisfaction');

INSERT INTO outcomes (id, defining_objective_id, name, description, measurable_target) VALUES
    ('c1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000005', 'Hire 3 Senior Engineers', 'Fill senior engineering positions', '3 senior engineers hired'),
    ('c1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000005', 'Reduce Time-to-Hire', 'Cut hiring timeline to under 30 days', 'Time-to-hire < 30 days'),
    ('c1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000006', 'Improve Deploy Frequency', 'Ship to production daily', '>= 1 deploy per day'),
    ('c1000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000006', 'Reduce PR Review Time', 'Average PR review under 4 hours', 'Avg PR review < 4 hours');
