package com.weeklycommit.service;

import com.weeklycommit.dto.CommentRequest;
import com.weeklycommit.dto.CommentResponse;
import com.weeklycommit.entity.CommitComment;
import com.weeklycommit.repository.AppUserRepository;
import com.weeklycommit.repository.CommitCommentRepository;
import com.weeklycommit.repository.ManagerAssignmentRepository;
import com.weeklycommit.repository.WeeklyCommitRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class CommitCommentService {

    private final CommitCommentRepository commentRepo;
    private final WeeklyCommitRepository commitRepo;
    private final AppUserRepository userRepo;
    private final ManagerAssignmentRepository assignmentRepo;
    private final AuthorizationService authorizationService;
    private final NotificationService notificationService;

    public CommitCommentService(
        CommitCommentRepository commentRepo,
        WeeklyCommitRepository commitRepo,
        AppUserRepository userRepo,
        ManagerAssignmentRepository assignmentRepo,
        AuthorizationService authorizationService,
        NotificationService notificationService
    ) {
        this.commentRepo = commentRepo;
        this.commitRepo = commitRepo;
        this.userRepo = userRepo;
        this.assignmentRepo = assignmentRepo;
        this.authorizationService = authorizationService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(UUID commitId) {
        commitRepo.findById(commitId)
            .orElseThrow(() -> new EntityNotFoundException("Commit not found: " + commitId));
        return commentRepo.findByCommitIdOrderByCreatedAtAsc(commitId).stream()
            .map(this::toResponse)
            .toList();
    }

    public CommentResponse addComment(UUID commitId, CommentRequest req) {
        var commit = commitRepo.findById(commitId)
            .orElseThrow(() -> new EntityNotFoundException("Commit not found: " + commitId));

        var currentUserId = authorizationService.currentUserId();

        var comment = new CommitComment();
        comment.setCommitId(commitId);
        comment.setAuthorUserId(currentUserId);
        comment.setBody(req.body());
        comment.setParentCommentId(req.parentCommentId());

        var saved = commentRepo.save(comment);

        // Notify the other party
        var planOwnerUserId = commit.getWeeklyPlan().getUserId();
        if (currentUserId.equals(planOwnerUserId)) {
            // IC commented — notify manager
            var managers = assignmentRepo.findByMemberUserId(planOwnerUserId);
            for (var assignment : managers) {
                notificationService.send(
                    assignment.getManager().getUserId(),
                    "COMMENT",
                    "New comment on a commit",
                    currentUserId + " commented on commit: " + commit.getTitle()
                );
            }
        } else {
            // Manager (or other party) commented — notify IC
            notificationService.send(
                planOwnerUserId,
                "COMMENT",
                "New comment on your commit",
                currentUserId + " commented on your commit: " + commit.getTitle()
            );
        }

        return toResponse(saved);
    }

    public CommentResponse updateComment(UUID commentId, String body) {
        var comment = commentRepo.findById(commentId)
            .orElseThrow(() -> new EntityNotFoundException("Comment not found: " + commentId));

        var currentUserId = authorizationService.currentUserId();
        if (!comment.getAuthorUserId().equals(currentUserId)) {
            throw new IllegalArgumentException("You can only edit your own comments");
        }

        if (comment.getCreatedAt().isBefore(LocalDateTime.now().minusHours(24))) {
            throw new IllegalStateException("Comments can only be edited within 24 hours of creation");
        }

        comment.setBody(body);
        comment.setUpdatedAt(LocalDateTime.now());
        var saved = commentRepo.save(comment);
        return toResponse(saved);
    }

    public void deleteComment(UUID commentId) {
        var comment = commentRepo.findById(commentId)
            .orElseThrow(() -> new EntityNotFoundException("Comment not found: " + commentId));

        var currentUserId = authorizationService.currentUserId();
        if (!comment.getAuthorUserId().equals(currentUserId)) {
            throw new IllegalArgumentException("You can only delete your own comments");
        }

        commentRepo.delete(comment);
    }

    private CommentResponse toResponse(CommitComment c) {
        var authorName = userRepo.findById(c.getAuthorUserId())
            .map(u -> u.getFullName())
            .orElse(c.getAuthorUserId());
        return new CommentResponse(
            c.getId(),
            c.getCommitId(),
            c.getAuthorUserId(),
            authorName,
            c.getBody(),
            c.getParentCommentId(),
            c.getCreatedAt(),
            c.getUpdatedAt()
        );
    }
}
