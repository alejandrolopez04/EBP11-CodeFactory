package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.out.UserSessionRepositoryPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;

/** Borra cada hora las sesiones que terminaron hace más de un día, para que la tabla no crezca. */
@Component
public class SessionCleanupScheduler {
    private static final Logger log = LoggerFactory.getLogger(SessionCleanupScheduler.class);
    private static final Duration RETENTION = Duration.ofDays(1);

    private final UserSessionRepositoryPort sessions;
    private final Clock clock;

    public SessionCleanupScheduler(UserSessionRepositoryPort sessions, Clock clock) {
        this.sessions = sessions;
        this.clock = clock;
    }

    @Scheduled(fixedDelayString = "PT1H", initialDelayString = "PT5M")
    public void purgeEndedSessions() {
        int deleted = sessions.deleteEndedBefore(clock.instant().minus(RETENTION));
        if (deleted > 0) log.info("Sesiones terminadas eliminadas: {}", deleted);
    }
}
