package com.archive.community.dto;

import com.archive.community.entity.Post;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Set;

@Data
public class CreatePostRequest {
    @NotBlank @Size(max = 400)
    private String title;

    @Size(max = 10000)
    private String body;

    private Post.PostType type = Post.PostType.DOUBT;

    @Size(max = 10)
    private Set<@Size(max = 80) String> tags;

    private Long linkedResourceId;
}
