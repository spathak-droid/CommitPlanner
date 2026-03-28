ALTER TABLE weekly_commits ADD COLUMN carried_from_commit_id UUID REFERENCES weekly_commits(id);
