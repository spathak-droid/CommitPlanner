CREATE TABLE commit_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commit_id UUID NOT NULL REFERENCES weekly_commits(id) ON DELETE CASCADE,
  author_user_id VARCHAR(255) NOT NULL REFERENCES app_users(user_id),
  body TEXT NOT NULL,
  parent_comment_id UUID REFERENCES commit_comments(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_commit ON commit_comments(commit_id);
CREATE INDEX idx_comments_author ON commit_comments(author_user_id);
