package com.archive.community.dto;

import com.archive.auth.dto.UserDTO;
import com.archive.community.entity.Post;
import com.archive.community.entity.Reply;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.Set;

/** Full post projection used on detail page and after creation. */
@Data @Builder
public class PostDTO {
    private Long id;
    private String type;
    private String title;
    private String body;
    private Set<String> tags;
    private Integer upvoteCount;
    private Integer replyCount;
    private Integer bookmarkCount;
    private boolean upvoted;
    private boolean bookmarked;
    private Instant createdAt;
    private Instant updatedAt;
    private UserDTO author;
    private LinkedResourceDTO linkedResource;

    public static PostDTO from(Post p, UserDTO author, LinkedResourceDTO lr,
                               boolean upvoted, boolean bookmarked) {
        return PostDTO.builder()
                .id(p.getId()).type(p.getType().name()).title(p.getTitle()).body(p.getBody())
                .tags(p.getTags()).upvoteCount(p.getUpvoteCount()).replyCount(p.getReplyCount())
                .bookmarkCount(p.getBookmarkCount()).upvoted(upvoted).bookmarked(bookmarked)
                .createdAt(p.getCreatedAt()).updatedAt(p.getUpdatedAt())
                .author(author).linkedResource(lr).build();
    }

    /** Lightweight linked-resource preview (id, title, type, fileType). */
    @Data @Builder
    public static class LinkedResourceDTO {
        private Long id;
        private String title;
        private String type;
        private String fileType;
    }

    /** Reply DTO. */
    @Data @Builder
    public static class ReplyDTO {
        private Long id;
        private Long parentReplyId;
        private String body;
        private Integer upvoteCount;
        private Instant createdAt;
        private UserDTO author;
        private List<ReplyDTO> nested;

        public static ReplyDTO from(Reply r, UserDTO author) {
            return ReplyDTO.builder()
                    .id(r.getId())
                    .parentReplyId(r.getParentReply() != null ? r.getParentReply().getId() : null)
                    .body(r.getBody()).upvoteCount(r.getUpvoteCount())
                    .createdAt(r.getCreatedAt()).author(author).build();
        }
    }
}
