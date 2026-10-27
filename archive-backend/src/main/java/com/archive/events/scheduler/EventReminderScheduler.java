package com.archive.events.scheduler;

import com.archive.common.service.EmailService;
import com.archive.events.entity.EventSave;
import com.archive.events.repository.EventSaveRepository;
import com.archive.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class EventReminderScheduler {

    private final EventSaveRepository eventSaveRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    // Run every 6 hours (or 0 0 * * * * every hour)
    @Scheduled(cron = "0 0 */6 * * *")
    public void sendUpcomingEventReminders() {
        log.info("Running EventReminderScheduler for upcoming events...");
        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);

        List<EventSave> saves = eventSaveRepository.findByRemindTrueAndEventStartDateBetween(today, tomorrow);
        log.info("Found {} saved events scheduled for today/tomorrow", saves.size());

        for (EventSave save : saves) {
            try {
                var user = save.getUser();
                var event = save.getEvent();

                // Send Email
                emailService.sendEventReminder(
                        user.getEmail(),
                        user.getName(),
                        event.getTitle(),
                        event.getStartDate().toString(),
                        "/events/" + event.getId()
                );

                // Create In-App Notification
                notificationService.notify(
                        user.getId(),
                        "EVENT_REMINDER",
                        "Event Reminder: " + event.getTitle(),
                        "The event '" + event.getTitle() + "' starts on " + event.getStartDate() + ".",
                        "/events/" + event.getId()
                );

            } catch (Exception e) {
                log.error("Failed to process event reminder for save: {}", e.getMessage());
            }
        }
    }
}
