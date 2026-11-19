-- Defensa a nivel de base de datos (PostgreSQL) para el requisito de inmutabilidad:
-- ni siquiera un usuario con acceso directo a la BD (o un admin) puede modificar o borrar registros.
-- Ejecutar UNA vez, después de que Hibernate cree la tabla price_change_records.
CREATE OR REPLACE FUNCTION prevent_price_change_mutation() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'Los registros de cambios de precio son inmutables (% no permitido).', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_price_change_immutable ON price_change_records;
CREATE TRIGGER trg_price_change_immutable
    BEFORE UPDATE OR DELETE ON price_change_records
    FOR EACH ROW EXECUTE FUNCTION prevent_price_change_mutation();
