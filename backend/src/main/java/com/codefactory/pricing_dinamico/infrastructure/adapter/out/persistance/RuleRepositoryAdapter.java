package com.codefactory.pricing_dinamico.infrastructure.adapter.out.persistance;


import com.codefactory.pricing_dinamico.application.port.out.RuleRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.PricingRule;
import com.codefactory.pricing_dinamico.domain.model.entities.RuleStatus;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class RuleRepositoryAdapter implements RuleRepositoryPort {
    private final RuleJpaRepository ruleJpaRepository;

    public RuleRepositoryAdapter(RuleJpaRepository ruleJpaRepository) {
        this.ruleJpaRepository = ruleJpaRepository;
    }

    @Override
    public PricingRule save(PricingRule pricingRule) {
        RuleJpaEntity entity = toEntity(pricingRule);
        RuleJpaEntity saved = ruleJpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public List<PricingRule> getRules() {return ruleJpaRepository.findAll().stream().map(this::toDomain).toList();}

    @Override
    public Optional<PricingRule> getRuleById(Long id) {return ruleJpaRepository.findById(id).map(this::toDomain);}

    @Override
    public boolean existsById(Long id) {return ruleJpaRepository.existsById(id);}

    @Override
    public void deactivateRule(Long id) {
        PricingRule ruleToDeactivate = ruleJpaRepository.findById(id).map(this::toDomain).get();
        RuleStatus ruleStatus = RuleStatus.INACTIVE;
        ruleToDeactivate.setRuleStatus(ruleStatus);
    }

    @Override
    public void activateRule(Long id) {
        PricingRule ruleToDeactivate = ruleJpaRepository.findById(id).map(this::toDomain).get();
        RuleStatus ruleStatus = RuleStatus.ACTIVE;
        ruleToDeactivate.setRuleStatus(ruleStatus);
    }

    @Override
    public List<PricingRule> saveAll(List<PricingRule> rules) {
        List<RuleJpaEntity> entities = rules.stream().map(this::toEntity).toList();
        return ruleJpaRepository.saveAll(entities).stream().map(this::toDomain).toList();
    }

    private RuleJpaEntity toEntity(PricingRule pricingRule) {
        RuleJpaEntity entity;
        if (pricingRule.getVariableType() == VariableType.DEMANDA ||
                pricingRule.getVariableType() == VariableType.DISPONIBILIDAD) {
            entity = new RuleJpaEntity(pricingRule.getId(), pricingRule.getVariableType(), pricingRule.getRuleStatus(),pricingRule.getLevel(),
                    pricingRule.getEffectType(), pricingRule.getEffectValue(), pricingRule.getProductIds());
        } else {
            entity = new RuleJpaEntity(pricingRule.getId(), pricingRule.getVariableType(), pricingRule.getRuleStatus(), pricingRule.getTimeCondition(), pricingRule.getEffectType(), pricingRule.getEffectValue(), pricingRule.getProductIds());
        }
        entity.setPriority(pricingRule.getPriority());
        return entity;
    }

    private PricingRule toDomain(RuleJpaEntity entity){
        PricingRule rule;
        if (entity.getVariableType() == VariableType.DEMANDA ||
                entity.getVariableType() == VariableType.DISPONIBILIDAD) {
            rule = new PricingRule(entity.getId(),
                    entity.getVariableType(), entity.getRuleStatus(), entity.getLevel(), entity.getEffectType(), entity.getEffectValue(), entity.getProductIds());
        } else {
            rule = new PricingRule(entity.getId(),
                    entity.getVariableType(), entity.getRuleStatus(), entity.getTimeCondition(), entity.getEffectType(), entity.getEffectValue(), entity.getProductIds());
        }
        rule.setPriority(entity.getPriority());
        return rule;
    }

}
