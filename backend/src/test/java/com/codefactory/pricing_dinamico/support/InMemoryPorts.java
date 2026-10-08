package com.codefactory.pricing_dinamico.support;

import com.codefactory.pricing_dinamico.application.port.out.BusinessVariableRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.ProductRepositoryPort;
import com.codefactory.pricing_dinamico.application.port.out.RuleRepositoryPort;
import com.codefactory.pricing_dinamico.domain.model.entities.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/** Implementaciones en memoria de los puertos, para probar servicios sin base de datos. */
public final class InMemoryPorts {
    private InMemoryPorts() {}

    public static class Rules implements RuleRepositoryPort {
        private final Map<Integer, PricingRule> store = new LinkedHashMap<>();
        private int seq = 0;

        @Override public PricingRule save(PricingRule r) {
            PricingRule saved = r.getId() == null ? withId(r, ++seq) : r;
            store.put(saved.getId(), saved);
            return saved;
        }
        @Override public List<PricingRule> saveAll(List<PricingRule> rules) {
            return rules.stream().map(this::save).toList();
        }
        @Override public List<PricingRule> getRules() { return new ArrayList<>(store.values()); }
        @Override public Optional<PricingRule> getRuleById(Long id) { return Optional.ofNullable(store.get(id.intValue())); }
        @Override public boolean existsById(Long id) { return store.containsKey(id.intValue()); }
        @Override public void deactivateRule(Long id) { store.get(id.intValue()).setRuleStatus(RuleStatus.INACTIVE); }
        @Override public void activateRule(Long id) { store.get(id.intValue()).setRuleStatus(RuleStatus.ACTIVE); }

        /** Crea una regla de demanda ya guardada. */
        public PricingRule add(EffectType type, String value, RuleStatus status, Integer priority, Integer... productIds) {
            PricingRule r = new PricingRule(null, VariableType.DEMANDA, status, VariableLevel.values()[0],
                    type, new BigDecimal(value), List.of(productIds));
            r.setPriority(priority);
            return save(r);
        }

        private PricingRule withId(PricingRule r, int id) {
            PricingRule copy = new PricingRule(id, r.getVariableType(), r.getRuleStatus(), r.getLevel(),
                    r.getEffectType(), r.getEffectValue(), r.getProductIds());
            copy.setPriority(r.getPriority());
            return copy;
        }
    }

    public static class Products implements ProductRepositoryPort {
        private final Map<Long, Product> store = new LinkedHashMap<>();

        public Product add(long id, String name, String base, String min, String max) {
            Product p = new Product(id, "SKU-" + id, name, ProductStatus.ACTIVE,
                    new BigDecimal(base), new BigDecimal(max), new BigDecimal(min), "cat");
            store.put(id, p);
            return p;
        }
        @Override public Product save(Product p) { store.put(p.getId(), p); return p; }
        @Override public List<Product> getAllProducts() { return new ArrayList<>(store.values()); }
        @Override public Optional<Product> getProductById(Long id) { return Optional.ofNullable(store.get(id)); }
        @Override public boolean existsBySku(String sku) { return false; }
        @Override public void activateProduct(Long id) {}
        @Override public void deactivateProduct(Long id) {}
    }

    public static class Variables implements BusinessVariableRepositoryPort {
        private final List<BusinessVariable> vars = new ArrayList<>();

        public Variables() {
            vars.add(new DemandVariable(1L, VariableType.DEMANDA, LocalDateTime.now(), 10L, 100L));
        }
        @Override public BusinessVariable save(BusinessVariable v) { vars.add(v); return v; }
        @Override public List<BusinessVariable> getAllVariables() { return vars; }
        @Override public Optional<BusinessVariable> findByType(VariableType t) {
            return vars.stream().filter(v -> v.getVariableType() == t).findFirst();
        }
    }
}
