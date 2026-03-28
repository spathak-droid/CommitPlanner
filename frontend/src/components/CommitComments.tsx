import React, { useEffect, useState, useCallback } from 'react';
import * as api from '../services/api';
import { useStore } from '../store/useStore';
import type { CommentResponse } from '../types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface Props {
  commitId: string;
  initiallyOpen?: boolean;
}

export const CommitComments: React.FC<Props> = ({ commitId, initiallyOpen = false }) => {
  const [open, setOpen] = useState(initiallyOpen);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { userId, showToast } = useStore();

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchComments(commitId);
      setComments(data);
    } catch {
      // silently fail on load
    } finally {
      setLoading(false);
    }
  }, [commitId]);

  useEffect(() => {
    if (open) {
      void loadComments();
    }
  }, [open, loadComments]);

  const handleSubmit = async () => {
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      const newComment = await api.addComment(commitId, body.trim(), replyTo ?? undefined);
      setComments((prev) => [...prev, newComment]);
      setBody('');
      setReplyTo(null);
    } catch {
      showToast('Failed to add comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await api.deleteCommentById(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      showToast('Failed to delete comment', 'error');
    }
  };

  const topLevel = comments.filter((c) => !c.parentCommentId);
  const replies = (parentId: string) => comments.filter((c) => c.parentCommentId === parentId);

  const renderComment = (comment: CommentResponse, isReply = false) => (
    <div key={comment.id} className={`flex gap-3 ${isReply ? 'ml-8 pl-4 border-l-2 border-outline-variant/20' : ''}`}>
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-tertiary-container flex items-center justify-center">
        <span className="text-[11px] font-bold text-on-tertiary-container">{getInitials(comment.authorName)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-on-surface">{comment.authorName}</span>
          <span className="text-xs text-secondary">{timeAgo(comment.createdAt)}</span>
          {userId === comment.authorUserId && (
            <button
              onClick={() => handleDelete(comment.id)}
              className="ml-auto p-1 rounded-full hover:bg-error-container text-secondary hover:text-error transition-colors"
              title="Delete comment"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>
        <p className="text-sm text-on-surface mt-0.5 leading-relaxed">{comment.body}</p>
        {!isReply && (
          <button
            onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
            className="text-xs text-tertiary font-semibold mt-1 hover:underline"
          >
            Reply
          </button>
        )}
        {replyTo === comment.id && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Write a reply..."
              className="flex-1 bg-white border border-outline-variant/15 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tertiary/30"
            />
            <button
              onClick={handleSubmit}
              disabled={!body.trim() || submitting}
              className="px-4 py-2 bg-tertiary text-on-tertiary rounded-full font-bold text-xs disabled:opacity-40 transition-all"
            >
              Reply
            </button>
          </div>
        )}
        {replies(comment.id).map((r) => renderComment(r, true))}
      </div>
    </div>
  );

  const commentCount = comments.length;

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-tertiary transition-colors px-1 py-1"
      >
        <span className="material-symbols-outlined text-sm">
          {open ? 'expand_less' : 'chat_bubble_outline'}
        </span>
        {open ? 'Hide comments' : commentCount > 0 ? `${commentCount} comment${commentCount !== 1 ? 's' : ''}` : 'Add comment'}
      </button>

      {open && (
        <div className="mt-2 space-y-4 rounded-[0.75rem] bg-white/60 p-4 ring-1 ring-outline-variant/10">
          {loading && <p className="text-xs text-secondary">Loading comments...</p>}

          {!loading && topLevel.length === 0 && (
            <p className="text-xs text-secondary">No comments yet. Be the first to comment.</p>
          )}

          {topLevel.map((c) => renderComment(c))}

          {!replyTo && (
            <div className="flex gap-2 pt-2 border-t border-outline-variant/10">
              <input
                type="text"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Write a comment..."
                className="flex-1 bg-white border border-outline-variant/15 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tertiary/30"
              />
              <button
                onClick={handleSubmit}
                disabled={!body.trim() || submitting}
                className="px-4 py-2 bg-tertiary text-on-tertiary rounded-full font-bold text-xs disabled:opacity-40 transition-all"
              >
                Post
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
