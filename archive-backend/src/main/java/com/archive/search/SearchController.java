package com.archive.search;

import com.archive.common.response.ApiResponse;
import com.archive.search.dto.SearchResultsDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    public ApiResponse<SearchResultsDto> search(
            @RequestParam(required = false, defaultValue = "") String q,
            @RequestParam(required = false, defaultValue = "all") String scope,
            @AuthenticationPrincipal Long userId) {

        return ApiResponse.ok(searchService.search(q, scope, userId));
    }
}
