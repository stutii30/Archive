package com.archive.common.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

import org.springframework.beans.factory.annotation.Value;

@Slf4j
@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public void sendEmail(String to, String subject, String bodyHtml) {
        log.info("======================== [EMAIL NOTIFICATION] ========================");
        log.info("TO: {}", to);
        log.info("SUBJECT: {}", subject);
        log.info("BODY:\n{}", bodyHtml);
        log.info("======================================================================");

        if (mailSender == null) {
            log.info("[EMAIL STUB] MailSender unconfigured. Logged notification above.");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            String sender = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail : "noreply@archive.com";
            helper.setFrom(sender);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(bodyHtml, true);
            mailSender.send(message);
            log.info("Email successfully dispatched via SMTP to {}", to);
        } catch (Exception e) {
            log.error("Failed to dispatch email via SMTP to {}: {}", to, e.getMessage());
        }
    }

    public void sendEventReminder(String to, String userName, String eventTitle, String eventDate, String eventLink) {
        String subject = "Reminder: " + eventTitle + " is coming up!";
        String html = "<h2>Hi " + userName + ",</h2>" +
                "<p>This is a reminder that <strong>" + eventTitle + "</strong> is scheduled for " + eventDate + ".</p>" +
                "<p><a href='" + eventLink + "'>Click here to view event details</a></p>" +
                "<p>Best regards,<br>The Archive Team</p>";
        sendEmail(to, subject, html);
    }
}
