-- HU: orden de prioridad entre reglas. ddl-auto=validate => ejecutar ANTES de levantar el backend.
ALTER TABLE pricing_rules ADD COLUMN IF NOT EXISTS priority INTEGER;

-- Opcional: asigna prioridad inicial a las reglas ya existentes (por id, secuencial).
UPDATE pricing_rules SET priority = sub.rn
FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM pricing_rules) sub
WHERE pricing_rules.id = sub.id AND pricing_rules.priority IS NULL;
