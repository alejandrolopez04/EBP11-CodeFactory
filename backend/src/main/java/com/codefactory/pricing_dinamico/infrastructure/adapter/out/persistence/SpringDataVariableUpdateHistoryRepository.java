package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistence;

import com.codefactory.pricing_dinamico.domain.model.entities.VariableUpdateHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpringDataVariableUpdateHistoryRepository
        extends JpaRepository<VariableUpdateHistory, Long> {

    List<VariableUpdateHistory> findByVariableTypeOrderByExecutedAtDesc(String variableType);
}
