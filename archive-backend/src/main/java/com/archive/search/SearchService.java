package com.archive.search;

import com.archive.auth.dto.UserDTO;
import com.archive.community.dto.PostDTO;
import com.archive.community.repository.PostRepository;
import com.archive.events.dto.EventDTO;
import com.archive.events.repository.EventRepository;
import com.archive.resource.dto.ResourceDTO;
import com.archive.resource.repository.ResourceRepository;
import com.archive.search.dto.SearchResultsDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SearchService {

    private final ResourceRepository resourceRepository;
    private final PostRepository postRepository;
    private final EventRepository eventRepository;

    public SearchResultsDto search(String query, String scope, Long userId) {
        String cleanQuery = (query != null) ? query.trim() : "";
        String cleanScope = (scope != null && !scope.isBlank()) ? scope.toLowerCase() : "all";

        if (cleanQuery.isEmpty()) {
            return SearchResultsDto.builder()
                    .query(cleanQuery)
                    .scope(cleanScope)
                    .resources(List.of())
                    .posts(List.of())
                    .events(List.of())
                    .totalResults(0)
                    .build();
        }

        List<ResourceDTO> resources = new ArrayList<>();
        List<PostDTO> posts = new ArrayList<>();
        List<EventDTO> events = new ArrayList<>();
        long total = 0;

        PageRequest pageRequest = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt"));

        if ("all".equals(cleanScope) || "resources".equals(cleanScope)) {
            var resPage = resourceRepository.searchByKeyword(cleanQuery, pageRequest);
            resources = resPage.getContent().stream()
                    .map(r -> ResourceDTO.from(r, UserDTO.from(r.getUploader())))
                    .toList();
            total += resPage.getTotalElements();
        }

        if ("all".equals(cleanScope) || "posts".equals(cleanScope)) {
            var postPage = postRepository.searchByKeyword(cleanQuery, pageRequest);
            posts = postPage.getContent().stream()
                    .map(p -> {
                        PostDTO.LinkedResourceDTO lr = null;
                        if (p.getLinkedResource() != null) {
                            var r = p.getLinkedResource();
                            lr = PostDTO.LinkedResourceDTO.builder()
                                    .id(r.getId()).title(r.getTitle())
                                    .type(r.getType().name()).fileType(r.getFileType()).build();
                        }
                        return PostDTO.from(p, UserDTO.from(p.getAuthor()), lr, false, false);
                    })
                    .toList();
            total += postPage.getTotalElements();
        }

        if ("all".equals(cleanScope) || "events".equals(cleanScope)) {
            var eventPage = eventRepository.searchByKeyword(cleanQuery, PageRequest.of(0, 20, Sort.by(Sort.Direction.ASC, "startDate")));
            events = eventPage.getContent().stream()
                    .map(e -> EventDTO.from(e, UserDTO.from(e.getCreator()), false, false))
                    .toList();
            total += eventPage.getTotalElements();
        }

        return SearchResultsDto.builder()
                .query(cleanQuery)
                .scope(cleanScope)
                .resources(resources)
                .posts(posts)
                .events(events)
                .totalResults(total)
                .build();
    }
}
