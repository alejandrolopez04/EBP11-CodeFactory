package com.codefactory.pricing_dinamico.application.service;

import com.codefactory.pricing_dinamico.application.port.in.ManageVariableAutoUpdateUseCase;
import com.codefactory.pricing_dinamico.application.port.out.BusinessVariableRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.ExternalVariableSourcePort;
import com.codefactory.pricing_dinamico.application.port.out.VariableAutoUpdateConfigRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.VariableUpdateHistoryRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.AvailabilityVariable;
import com.codefactory.pricing_dinamico.domain.model.entities.BusinessVariable;
import com.codefactory.pricing_dinamico.domain.model.entities.DemandVariable;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableAutoUpdateConfig;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableType;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableUpdateHistory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class VariableAutoUpdateService implements ManageVariableAutoUpdateUseCase {

    private final VariableAutoUpdateConfigRepositoryPort configRepository;
    private final VariableUpdateHistoryRepositoryPort historyRepository;
    private final BusinessVariableRepositoryPort businessVariableRepository;
    private final ExternalVariableSourcePort externalVariableSourcePort;

    public VariableAutoUpdateService(
            VariableAutoUpdateConfigRepositoryPort configRepository,
            VariableUpdateHistoryRepositoryPort historyRepository,
            BusinessVariableRepositoryPort businessVariableRepository,
            ExternalVariableSourcePort externalVariableSourcePort
    ) {
        this.configRepository = configRepository;
        this.historyRepository = historyRepository;
        this.businessVariableRepository = businessVariableRepository;
        this.externalVariableSourcePort = externalVariableSourcePort;
    }

    @Scheduled(fixedRate = 60000)
    public void runScheduledUpdates() {

        for (VariableAutoUpdateConfig config : configRepository.findActive()) {

            boolean mustRun = config.getLastRunAt() == null ||
                    LocalDateTime.now().isAfter(
                            config.getLastRunAt().plusMinutes(config.getFrequencyMinutes())
                    );

            if (mustRun) {
                runUpdate(config.getVariableType());
            }
        }
    }

    @Override
    public List<VariableAutoUpdateConfig> getConfigurations() {
        return configRepository.findAll();
    }

    @Override
    public VariableAutoUpdateConfig saveConfiguration(VariableAutoUpdateConfig configuration) {
        return configRepository.save(configuration);
    }

    @Override
    public VariableUpdateHistory runUpdate(String variableType) {

        VariableAutoUpdateConfig config = configRepository.findByVariableType(variableType)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No existe una configuración de actualización para " + variableType
                ));

        VariableType type = VariableType.valueOf(variableType);

        BusinessVariable variable = businessVariableRepository.findByType(type)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No existe la variable " + variableType
                ));

        Long previousValue = getCurrentValue(variable);
        Long newValue;

        try {
            newValue = externalVariableSourcePort.fetchNumericValue(
                    config.getSourceUrl(),
                    config.getValueField()
            );
        } catch (Exception exception) {
            return saveHistory(
                    config,
                    previousValue,
                    null,
                    "SOURCE_UNAVAILABLE",
                    "No fue posible obtener el valor desde la fuente"
            );
        }

        if (!isValueInRange(variable, newValue)) {
            return saveHistory(
                    config,
                    previousValue,
                    newValue,
                    "VALUE_OUT_OF_RANGE",
                    "El valor recibido no cumple el rango permitido"
            );
        }

        applyValue(variable, newValue);
        variable.setUpdatedAt(LocalDateTime.now());
        businessVariableRepository.save(variable);

        config.setLastRunAt(LocalDateTime.now());
        configRepository.save(config);

        return saveHistory(
                config,
                previousValue,
                newValue,
                "SUCCESS",
                "Actualización automática exitosa"
        );
    }

    @Override
    public List<VariableUpdateHistory> getHistory(String variableType) {
        return historyRepository.findByVariableTypeOrderByExecutedAtDesc(variableType);
    }

    private Long getCurrentValue(BusinessVariable variable) {

        if (variable instanceof DemandVariable demand) {
            return demand.getDemandLow();
        }

        if (variable instanceof AvailabilityVariable availability) {
            return availability.getAvailabilityLow();
        }

        return null;
    }

    private boolean isValueInRange(BusinessVariable variable, Long value) {

        if (value == null) {
            return false;
        }

        if (variable instanceof DemandVariable demand) {
            return value >= demand.getDemandLow() && value <= demand.getDemandHigh();
        }

        if (variable instanceof AvailabilityVariable availability) {
            return value >= availability.getAvailabilityLow()
                    && value <= availability.getAvailabilityHigh();
        }

        return false;
    }

    private void applyValue(BusinessVariable variable, Long value) {

        if (variable instanceof DemandVariable demand) {
            demand.setDemandLow(value);
        }

        if (variable instanceof AvailabilityVariable availability) {
            availability.setAvailabilityLow(value);
        }
    }

    private VariableUpdateHistory saveHistory(
            VariableAutoUpdateConfig config,
            Long previousValue,
            Long newValue,
            String result,
            String message
    ) {

        VariableUpdateHistory history = new VariableUpdateHistory();
        history.setVariableType(config.getVariableType());
        history.setSourceName(config.getSourceName());
        history.setPreviousValue(previousValue);
        history.setNewValue(newValue);
        history.setResult(result);
        history.setMessage(message);
        history.setExecutedAt(LocalDateTime.now());

        return historyRepository.save(history);
    }
}
