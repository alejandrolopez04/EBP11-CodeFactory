package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.out.BusinessVariableRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.RuleRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.PricingRule;
import com.codefactory.pricing_dinamico.domain.model.entities.RuleStatus;
import com.codefactory.pricing_dinamico.domain.model.entities.TemporalVariable;
import com.codefactory.pricing_dinamico.domain.model.entities.TimeBoundary;
import com.codefactory.pricing_dinamico.domain.model.entities.TimeConditionType;
import com.codefactory.pricing_dinamico.domain.model.entities.TriggerType;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableType;
import com.codefactory.pricing_dinamico.domain.model.events.PricingInputsChangedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ScheduledFuture;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Component
public class PriceChangeScheduler {

    private static final Logger log = LoggerFactory.getLogger(PriceChangeScheduler.class);
    // Debe ser la misma zona que usa PricingRule.currentBusinessTime()
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("America/Bogota");

    private final TaskScheduler taskScheduler;
    private final PricingEngineService engine;
    private final RuleRepositoryPort ruleRepositoryPort;
    private final BusinessVariableRepositoryPort businessVariableRepositoryPort;

    private ScheduledFuture<?> pendingTask;
    private volatile TimeBoundary nextBoundary;

    public PriceChangeScheduler(TaskScheduler taskScheduler, PricingEngineService engine,
                                RuleRepositoryPort ruleRepositoryPort,
                                BusinessVariableRepositoryPort businessVariableRepositoryPort) {
        this.taskScheduler = taskScheduler;
        this.engine = engine;
        this.ruleRepositoryPort = ruleRepositoryPort;
        this.businessVariableRepositoryPort = businessVariableRepositoryPort;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        engine.recalculateAll(TriggerType.INICIO, "Arranque del sistema");
        scheduleNext();
    }

    /** Cambiaron horarios, meses, reglas o vigencias: la próxima frontera puede ser otra. */
    @TransactionalEventListener(fallbackExecution = true)
    public void onInputsChanged(PricingInputsChangedEvent event) {
        scheduleNext();
    }

    public synchronized void scheduleNext() {
        if (pendingTask != null) pendingTask.cancel(false);

        TimeBoundary boundary = findNextBoundary(PricingRule.currentBusinessTime());
        nextBoundary = boundary;
        if (boundary == null) {
            log.info("Sin cambios de precio programados.");
            return;
        }
        pendingTask = taskScheduler.schedule(() -> fire(boundary),
                boundary.at().atZone(BUSINESS_ZONE).toInstant());
        log.info("Próximo cambio programado: {} a las {} ({} producto(s))",
                boundary.description(), boundary.at(), boundary.productIds().size());
    }

    private void fire(TimeBoundary boundary) {
        try {
            boundary.productIds().forEach(id -> engine.recalculate(id, TriggerType.HORARIO, boundary.description()));
        } finally {
            scheduleNext();   // pase lo que pase, se programa la siguiente
        }
    }

    public Optional<TimeBoundary> getNextBoundary() {
        return Optional.ofNullable(nextBoundary);
    }

    // ---- Cálculo de la próxima frontera ----

    private TimeBoundary findNextBoundary(LocalDateTime now) {
        List<PricingRule> activeRules = ruleRepositoryPort.getRules().stream()
                .filter(r -> r.getRuleStatus() == RuleStatus.ACTIVE).toList();
        List<TimeBoundary> candidates = new ArrayList<>();

        // 1. Horas pico y cambio de mes (solo si hay reglas que dependan de ellos)
        Set<Long> peakProducts = productsOf(activeRules, r -> r.getTimeCondition() == TimeConditionType.HORA_PICO);
        Set<Long> seasonProducts = productsOf(activeRules, r -> r.getTimeCondition() == TimeConditionType.TEMPORADA_ALTA);

        businessVariableRepositoryPort.findByType(VariableType.TEMPORAL)
                .filter(TemporalVariable.class::isInstance).map(TemporalVariable.class::cast)
                .ifPresent(t -> {
                    if (!peakProducts.isEmpty()) {
                        for (LocalDate day : List.of(now.toLocalDate(), now.toLocalDate().plusDays(1))) {
                            addIfFuture(candidates, now, day, t.getMorningStartTime(), "Inicio hora pico AM", peakProducts);
                            addIfFuture(candidates, now, day, t.getMorningEndTime(), "Fin hora pico AM", peakProducts);
                            addIfFuture(candidates, now, day, t.getAfternoonStartTime(), "Inicio hora pico PM", peakProducts);
                            addIfFuture(candidates, now, day, t.getAfternoonEndTime(), "Fin hora pico PM", peakProducts);
                        }
                    }
                    if (!seasonProducts.isEmpty()) {
                        LocalDateTime nextMonth = now.toLocalDate().withDayOfMonth(1).plusMonths(1).atStartOfDay();
                        candidates.add(new TimeBoundary(nextMonth, "Cambio de mes (temporada alta)", seasonProducts));
                    }
                });

        // 2. Inicio y fin de vigencia de cada regla
        for (PricingRule rule : activeRules) {
            Set<Long> ids = productsOf(List.of(rule), r -> true);
            if (rule.getValidFrom() != null && rule.getValidFrom().isAfter(now)) {
                candidates.add(new TimeBoundary(rule.getValidFrom(), "Inicia vigencia de la regla " + rule.getId(), ids));
            }
            if (rule.getValidTo() != null && rule.getValidTo().isAfter(now)) {
                candidates.add(new TimeBoundary(rule.getValidTo(), "Termina vigencia de la regla " + rule.getId(), ids));
            }
        }

        // 3. La más próxima; si varias caen en el mismo instante se combinan
        return candidates.stream().map(TimeBoundary::at).min(Comparator.naturalOrder())
                .map(at -> merge(at, candidates)).orElse(null);
    }

    private void addIfFuture(List<TimeBoundary> list, LocalDateTime now, LocalDate day,
                             LocalTime time, String description, Set<Long> productIds) {
        if (time == null) return;
        LocalDateTime at = day.atTime(time);
        if (at.isAfter(now)) list.add(new TimeBoundary(at, description + " (" + time + ")", productIds));
    }

    private TimeBoundary merge(LocalDateTime at, List<TimeBoundary> candidates) {
        List<TimeBoundary> same = candidates.stream().filter(b -> b.at().equals(at)).toList();
        String description = same.stream().map(TimeBoundary::description).collect(Collectors.joining(" + "));
        Set<Long> ids = same.stream().flatMap(b -> b.productIds().stream()).collect(Collectors.toSet());
        return new TimeBoundary(at, description, ids);
    }

    private Set<Long> productsOf(List<PricingRule> rules, Predicate<PricingRule> filter) {
        return rules.stream().filter(filter).filter(r -> r.getProductIds() != null)
                .flatMap(r -> r.getProductIds().stream()).map(Integer::longValue)
                .collect(Collectors.toSet());
    }
}
