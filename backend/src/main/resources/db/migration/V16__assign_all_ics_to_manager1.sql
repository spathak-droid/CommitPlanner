-- For demo: manager-1 (Maya Reynolds) can see all ICs in team views
-- Existing: manager-1 -> user-1
-- Adding: manager-1 -> ic-product, manager-1 -> ic-design
INSERT INTO manager_assignments (manager_id, member_id) VALUES
    ('manager-1', 'ic-product'),
    ('manager-1', 'ic-design')
ON CONFLICT (manager_id, member_id) DO NOTHING;
