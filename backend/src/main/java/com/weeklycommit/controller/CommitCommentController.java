package com.weeklycommit.controller;

import com.weeklycommit.dto.CommentRequest;
import com.weeklycommit.dto.CommentResponse;
import com.weeklycommit.service.CommitCommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@Tag(name = "Comments")
public class CommitCommentController {

    private final CommitCommentService commentService;

    public CommitCommentController(CommitCommentService commentService) {
        this.commentService = commentService;
    }

    @Operation(summary = "Get comments for a commit")
    @GetMapping("/commits/{commitId}/comments")
    public List<CommentResponse> getComments(@PathVariable UUID commitId) {
        return commentService.getComments(commitId);
    }

    @Operation(summary = "Add a comment to a commit")
    @PostMapping("/commits/{commitId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponse addComment(@PathVariable UUID commitId, @Valid @RequestBody CommentRequest req) {
        return commentService.addComment(commitId, req);
    }

    @Operation(summary = "Update a comment")
    @PutMapping("/comments/{id}")
    public CommentResponse updateComment(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return commentService.updateComment(id, body.get("body"));
    }

    @Operation(summary = "Delete a comment")
    @DeleteMapping("/comments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(@PathVariable UUID id) {
        commentService.deleteComment(id);
    }
}
