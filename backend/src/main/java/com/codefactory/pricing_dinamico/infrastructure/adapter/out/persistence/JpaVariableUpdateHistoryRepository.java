package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistence;

import com.codefactory.pricing_dinamico.application.port.out.VariableUpdateHistoryRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableUpdateHistory;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class JpaVariableUpdateHistoryRepository
        implements VariableUpdateHistoryRepositoryPort {

    private final SpringDataVariableUpdateHistoryRepository springDataRepository;

    public JpaVariableUpdateHistoryRepository(
            SpringDataVariableUpdateHistoryRepository springDataRepository
    ) {
        this.springDataRepository = springDataRepository;
    }

    @Override
    public VariableUpdateHistory save(VariableUpdateHistory history) {
        return springDataRepository.save(history);
    }

    @Override
    public List<VariableUpdateHistory> findByVariableTypeOrderByExecutedAtDesc(
            String variableType
    ) {
        return springDataRepository.findByVariableTypeOrderByExecutedAtDesc(variableType);
    }
}
