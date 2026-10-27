package com.archive.common;

import com.archive.auth.entity.User;
import com.archive.auth.repository.UserRepository;
import com.archive.community.entity.Post;
import com.archive.community.repository.PostRepository;
import com.archive.events.entity.Event;
import com.archive.events.entity.EventStage;
import com.archive.events.repository.EventRepository;
import com.archive.resource.entity.Resource;
import com.archive.resource.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final PostRepository postRepository;
    private final EventRepository eventRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        User student;
        User admin;

        if (userRepository.count() == 0) {
            log.info("[DATA INITIALIZER] No users found. Seeding default demo accounts...");

            String defaultPasswordHash = passwordEncoder.encode("password123");

            student = User.builder()
                    .name("Demo Student")
                    .email("demo@college.edu")
                    .passwordHash(defaultPasswordHash)
                    .college("IIT Bombay")
                    .department("Computer Science")
                    .year((byte) 3)
                    .role(User.Role.STUDENT)
                    .build();

            admin = User.builder()
                    .name("System Admin")
                    .email("admin@college.edu")
                    .passwordHash(defaultPasswordHash)
                    .college("IIT Bombay")
                    .department("Administration")
                    .year((byte) 4)
                    .role(User.Role.ADMIN)
                    .build();

            student = userRepository.save(student);
            admin = userRepository.save(admin);
        } else {
            student = userRepository.findAll().get(0);
            admin = userRepository.findAll().stream().filter(u -> u.getRole() == User.Role.ADMIN).findFirst().orElse(student);
        }

        if (resourceRepository.count() == 0) {
            log.info("[DATA INITIALIZER] Clean start: No sample resources automatically seeded.");
        }

            // ── Community Posts ────────────────────────────────────────────────────────
            Post post1 = Post.builder()
                    .author(student)
                    .type(Post.PostType.PLACEMENT)
                    .title("How to prepare for Tier-1 Tech Placements in 3 months?")
                    .body("Sharing my structured roadmap for DSA, System Design basics, and CS fundamentals for placement preparation.")
                    .tags(Set.of("placement", "interview", "dsa"))
                    .upvoteCount(18)
                    .replyCount(5)
                    .build();

            Post post2 = Post.builder()
                    .author(student)
                    .type(Post.PostType.DOUBT)
                    .title("Understanding Reader-Writer Problem with Semaphores")
                    .body("Can someone explain why writer starvation occurs in first reader-writer problem? Looking for intuitive diagrams.")
                    .tags(Set.of("os", "doubt", "concurrency"))
                    .upvoteCount(7)
                    .replyCount(2)
                    .build();

            Post post3 = Post.builder()
                    .author(admin)
                    .type(Post.PostType.DSA_PROBLEM)
                    .title("Weekly Coding Challenge: Minimum Window Substring")
                    .body("Solve LeetCode #76 using sliding window + hashmap approach. Post your time/space complexity breakdown below!")
                    .tags(Set.of("dsa", "leetcode", "algorithms"))
                    .upvoteCount(24)
                    .replyCount(9)
                    .build();

            postRepository.saveAll(List.of(post1, post2, post3));

            // ── Events ─────────────────────────────────────────────────────────────────
            Event evt1 = Event.builder()
                    .creator(admin)
                    .title("HackArchive National Hackathon 2026")
                    .description("36-hour non-stop hybrid hackathon open to all engineering & tech students. Prizes worth $5,000!")
                    .organizer("Developer Student Club")
                    .type(Event.EventType.HACKATHON)
                    .location("Auditorium Hall A & Online")
                    .startDate(LocalDate.now().plusDays(7))
                    .endDate(LocalDate.now().plusDays(9))
                    .registrationLink("https://hackarchive2026.devpost.com")
                    .registrantCount(120)
                    .build();

            EventStage stage1 = EventStage.builder().event(evt1).stageNumber(1).title("Registration & Team Formation").description("Register online and find teammates.").build();
            EventStage stage2 = EventStage.builder().event(evt1).stageNumber(2).title("Hacking Phase").description("36 hours live coding sprint.").build();
            EventStage stage3 = EventStage.builder().event(evt1).stageNumber(3).title("Pitch & Judging").description("Project demo to jury panel.").build();
            evt1.setStages(List.of(stage1, stage2, stage3));

            Event evt2 = Event.builder()
                    .creator(admin)
                    .title("Annual Tech & Cultural Fest 2026")
                    .description("Flagship annual fest featuring robot wars, coding contests, guest lectures, and cultural performances.")
                    .organizer("Student Activity Center")
                    .type(Event.EventType.FEST)
                    .location("Main Campus Grounds")
                    .startDate(LocalDate.now().plusDays(14))
                    .endDate(LocalDate.now().plusDays(16))
                    .registrantCount(350)
                    .build();

            Event evt3 = Event.builder()
                    .creator(admin)
                    .title("Google & Microsoft Placement Drive")
                    .description("Campus recruitment drive for SDE-1 and Cloud Engineer roles for final year batch.")
                    .organizer("Training & Placement Cell")
                    .type(Event.EventType.PLACEMENT)
                    .location("Placement Block & Online Test Center")
                    .startDate(LocalDate.now().plusDays(21))
                    .endDate(LocalDate.now().plusDays(22))
                    .registrantCount(85)
                    .build();

            Event evt4 = Event.builder()
                    .creator(admin)
                    .title("Distributed Systems & Cloud Architecture Seminar")
                    .description("Special guest lecture by Principal Engineers on building resilient microservices.")
                    .organizer("Department of Computer Science")
                    .type(Event.EventType.SEMINAR)
                    .location("Seminar Hall 2")
                    .startDate(LocalDate.now().plusDays(3))
                    .endDate(LocalDate.now().plusDays(3))
                    .registrantCount(60)
                    .build();

            eventRepository.saveAll(List.of(evt1, evt2, evt3, evt4));

            log.info("[DATA INITIALIZER] Demo accounts and initial demo data seeded successfully!");
    }
}
