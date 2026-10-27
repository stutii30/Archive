package com.archive.common.service;

import com.archive.resource.entity.Resource;
import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * AI Content Moderation Service.
 * Evaluates uploads for inappropriate/malicious content or subject mismatch
 * using Gemini API
 * with automatic local fallback heuristics.
 */
@Slf4j
@Service
public class AiModerationService {

    private final String geminiApiKey;
    private final RestTemplate restTemplate;

    public AiModerationService(
            @Value("${gemini.api-key:${GEMINI_API_KEY:}}") String geminiApiKey) {
        this.geminiApiKey = geminiApiKey;

        var requestFactory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(3000);
        requestFactory.setReadTimeout(5000);
        this.restTemplate = new RestTemplate(requestFactory);
    }

    @Data
    @Builder
    public static class ModerationResult {
        private Resource.Status status;
        private String moderationFlag;
        private String aiNotice;
    }

    private static final Set<String> UNWANTED_KEYWORDS = Set.of(
            "malware", "virus", "hack", "cheat", "casino", "gambling", "betting",
            "adult", "nsfw", "porn", "torrent", "crack", "keygen", "phishing", "spam");

    public ModerationResult evaluate(org.springframework.web.multipart.MultipartFile file, String title,
            String description, String selectedSubject, String fileType) {
        String fileContentText = extractFileContentText(file);
        String safeTitle = title != null ? title.trim() : "";
        String safeDesc = description != null ? description.trim() : "";
        String safeSubj = selectedSubject != null ? selectedSubject.trim() : "";

        String combinedText = safeTitle + "\nDescription: " + safeDesc + "\nFile Content Sample: " + fileContentText;

        // 1. Try Gemini API if key is available
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            try {
                return callGeminiApi(combinedText, safeSubj);
            } catch (Exception e) {
                log.warn("Gemini API call failed, falling back to local heuristic moderation: {}", e.getMessage());
            }
        }

        // 2. Local Fallback Heuristic Moderation
        return evaluateLocalHeuristics(combinedText, safeSubj);
    }

    private String extractFileContentText(org.springframework.web.multipart.MultipartFile file) {
        if (file == null || file.isEmpty())
            return "";
        try {
            byte[] bytes = file.getInputStream().readNBytes(64 * 1024);
            String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";

            if (filename.endsWith(".pdf")) {
                StringBuilder sb = new StringBuilder();
                String raw = new String(bytes, java.nio.charset.StandardCharsets.ISO_8859_1);
                java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("\\(([\\w\\s\\-\\.,:;/()]{3,})\\)")
                        .matcher(raw);
                while (matcher.find() && sb.length() < 2000) {
                    sb.append(matcher.group(1)).append(" ");
                }
                String ascii = raw.replaceAll("[^a-zA-Z0-9\\s]", " ");
                return (sb.toString() + " " + ascii).trim();
            } else {
                String raw = new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
                return raw.replaceAll("[^a-zA-Z0-9\\s]", " ").trim();
            }
        } catch (Exception e) {
            log.warn("Could not extract text from file content: {}", e.getMessage());
            return "";
        }
    }

    private ModerationResult callGeminiApi(String combinedText, String subject) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key="
                + geminiApiKey;

        String truncatedText = combinedText.length() > 2500 ? combinedText.substring(0, 2500) : combinedText;

        String promptText = String.format(
                "You are an academic content moderator for a college notes platform. " +
                        "Evaluate the following upload metadata and extracted file text:\n%s\nSelected Subject: %s\n\n"
                        +
                        "Respond in raw JSON format with 3 fields:\n" +
                        "1. \"isUnwanted\": true/false (true if inappropriate, spam, malware, or non-educational)\n" +
                        "2. \"flagReason\": \"INAPPROPRIATE\" or \"SPAM\" or null\n" +
                        "3. \"subjectNotice\": text statement if the extracted file content belongs to a noticeably different academic subject than Selected Subject (e.g. \"Notice: The uploaded data does not seem to belong to this subject.\"), otherwise null.",
                truncatedText, subject);

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", promptText)))));

        Map<?, ?> response = restTemplate.postForObject(url, requestBody, Map.class);
        if (response != null && response.containsKey("candidates")) {
            List<?> candidates = (List<?>) response.get("candidates");
            if (!candidates.isEmpty() && candidates.get(0) instanceof Map<?, ?> firstCand) {
                Map<?, ?> content = (Map<?, ?>) firstCand.get("content");
                if (content != null && content.get("parts") instanceof List<?> parts && !parts.isEmpty()) {
                    Map<?, ?> firstPart = (Map<?, ?>) parts.get(0);
                    String text = (String) firstPart.get("text");
                    if (text != null) {
                        return parseGeminiJsonResponse(text);
                    }
                }
            }
        }

        return evaluateLocalHeuristics(combinedText, subject);
    }

    private ModerationResult parseGeminiJsonResponse(String rawJson) {
        String cleanJson = rawJson.replace("```json", "").replace("```", "").trim();
        boolean isUnwanted = cleanJson.contains("\"isUnwanted\": true") || cleanJson.contains("\"isUnwanted\":true");
        String notice = null;

        if (cleanJson.contains("\"subjectNotice\":")) {
            int start = cleanJson.indexOf("\"subjectNotice\":");
            int valStart = cleanJson.indexOf("\"", start + 16);
            if (valStart != -1) {
                int valEnd = cleanJson.indexOf("\"", valStart + 1);
                if (valEnd != -1) {
                    notice = cleanJson.substring(valStart + 1, valEnd);
                    if (notice.equalsIgnoreCase("null"))
                        notice = null;
                }
            }
        }

        if (isUnwanted) {
            return ModerationResult.builder()
                    .status(Resource.Status.PENDING_REVIEW)
                    .moderationFlag("INAPPROPRIATE")
                    .aiNotice("Flagged by AI: Upload flagged for Admin review prior to public listing.")
                    .build();
        }

        return ModerationResult.builder()
                .status(Resource.Status.APPROVED)
                .moderationFlag(notice != null ? "SUBJECT_MISMATCH" : null)
                .aiNotice(notice)
                .build();
    }

    private ModerationResult evaluateLocalHeuristics(String combinedText, String subject) {
        String lowerCombined = combinedText.toLowerCase();

        // Check for unwanted keywords inside text content & metadata
        for (String kw : UNWANTED_KEYWORDS) {
            if (lowerCombined.contains(kw)) {
                log.info("AI Moderation local heuristic flagged upload for keyword='{}'", kw);
                return ModerationResult.builder()
                        .status(Resource.Status.PENDING_REVIEW)
                        .moderationFlag("INAPPROPRIATE")
                        .aiNotice("Flagged by AI: Upload flagged for Admin review prior to public listing.")
                        .build();
            }
        }

        // Check for subject mismatch heuristic across extracted text
        String notice = checkSubjectMismatchHeuristic(combinedText, subject);

        return ModerationResult.builder()
                .status(Resource.Status.APPROVED)
                .moderationFlag(notice != null ? "SUBJECT_MISMATCH" : null)
                .aiNotice(notice)
                .build();
    }

    private static final Map<String, String> SUBJECT_KEYWORDS = Map.ofEntries(
            Map.entry("coa", "Computer Organization & Architecture"),
            Map.entry("computer organization", "Computer Organization & Architecture"),
            Map.entry("computer architecture", "Computer Organization & Architecture"),
            Map.entry("os", "Operating Systems"),
            Map.entry("operating system", "Operating Systems"),
            Map.entry("operating systems", "Operating Systems"),
            Map.entry("cn", "Computer Networks"),
            Map.entry("computer network", "Computer Networks"),
            Map.entry("computer networks", "Computer Networks"),
            Map.entry("dbms", "Database Management Systems"),
            Map.entry("rdbms", "Database Management Systems"),
            Map.entry("sql", "Database Management Systems"),
            Map.entry("database", "Database Management Systems"),
            Map.entry("toc", "Theory of Computation"),
            Map.entry("flat", "Formal Languages & Automata Theory"),
            Map.entry("automata", "Theory of Computation"),
            Map.entry("cd", "Compiler Design"),
            Map.entry("compiler", "Compiler Design"),
            Map.entry("se", "Software Engineering"),
            Map.entry("software engineering", "Software Engineering"),
            Map.entry("oops", "Object Oriented Programming"),
            Map.entry("oop", "Object Oriented Programming"),
            Map.entry("ai", "Artificial Intelligence"),
            Map.entry("ml", "Machine Learning"),
            Map.entry("machine learning", "Artificial Intelligence / ML"),
            Map.entry("dsa", "Data Structures & Algorithms"),
            Map.entry("data structure", "Data Structures & Algorithms"),
            Map.entry("data structures", "Data Structures & Algorithms"),
            Map.entry("algo", "Algorithms"),
            Map.entry("algorithm", "Algorithms"),
            Map.entry("algorithms", "Algorithms"),
            Map.entry("physics", "Physics"),
            Map.entry("thermodynamics", "Physics / Mechanical Engineering"),
            Map.entry("kinematics", "Physics"),
            Map.entry("quantum", "Physics"),
            Map.entry("chemistry", "Chemistry"),
            Map.entry("organic chemistry", "Chemistry"),
            Map.entry("math", "Mathematics"),
            Map.entry("maths", "Mathematics"),
            Map.entry("calculus", "Mathematics"),
            Map.entry("algebra", "Mathematics"));

    private String checkSubjectMismatchHeuristic(String combinedText, String selectedSubject) {
        if (selectedSubject == null || selectedSubject.isBlank())
            return null;

        String rawText = (combinedText != null ? combinedText : "").toLowerCase().replaceAll("[^a-z0-9\\s]", " ");
        String subjLower = selectedSubject.toLowerCase().replaceAll("[^a-z0-9\\s]", " ");

        // Split text into tokens for exact word matching of short abbreviations (like
        // coa, os, cn, dbms)
        java.util.Set<String> tokens = new java.util.HashSet<>(java.util.Arrays.asList(rawText.split("\\s+")));

        for (Map.Entry<String, String> entry : SUBJECT_KEYWORDS.entrySet()) {
            String kw = entry.getKey();
            String detectedDomain = entry.getValue();

            boolean kwFound = false;
            if (kw.length() <= 4) {
                // Short abbreviation -> exact token match
                kwFound = tokens.contains(kw);
            } else {
                // Phrase -> substring match
                kwFound = rawText.contains(kw);
            }

            if (kwFound) {
                boolean matchesSelected = subjLower.contains(kw) || subjLower.contains(detectedDomain.toLowerCase());
                if (!matchesSelected) {
                    return "Notice: The uploaded data does not seem to belong to this subject.";
                }
            }
        }

        return null;
    }
}
