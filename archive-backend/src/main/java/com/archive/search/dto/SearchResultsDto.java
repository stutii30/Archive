package com.archive.search.dto;

import com.archive.community.dto.PostDTO;
import com.archive.events.dto.EventDTO;
import com.archive.resource.dto.ResourceDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchResultsDto {
    private String query;
    private String scope;
    
    @Builder.Default
    private List<ResourceDTO> resources = Collections.emptyList();
    
    @Builder.Default
    private List<PostDTO> posts = Collections.emptyList();
    
    @Builder.Default
    private List<EventDTO> events = Collections.emptyList();
    
    private long totalResults;
}
