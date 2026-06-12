-- Migration 059: Fahrzeugprüfungen (Inspektionen)

CREATE TABLE IF NOT EXISTS vehicle_inspection_templates (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_type    TEXT        NOT NULL, -- hlf1, hlf2, mtf
    item_name       TEXT        NOT NULL,
    description     TEXT,
    priority        TEXT        DEFAULT 'normal', -- normal, critical
    display_order   INTEGER     DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(vehicle_type, item_name)
);

CREATE TABLE IF NOT EXISTS vehicle_inspections (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id      UUID        NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    inspection_date DATE        NOT NULL,
    inspected_by    UUID        REFERENCES users(id) ON DELETE SET NULL,
    inspected_by_name TEXT,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicle_inspection_items (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id   UUID        NOT NULL REFERENCES vehicle_inspections(id) ON DELETE CASCADE,
    template_id     UUID        REFERENCES vehicle_inspection_templates(id) ON DELETE SET NULL,
    item_name       TEXT        NOT NULL,
    status          TEXT        NOT NULL DEFAULT 'pending', -- pending, ok, missing, defect
    comment         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS vehicle_inspection_templates_updated_at ON vehicle_inspection_templates;
CREATE TRIGGER vehicle_inspection_templates_updated_at
    BEFORE UPDATE ON vehicle_inspection_templates
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS vehicle_inspections_updated_at ON vehicle_inspections;
CREATE TRIGGER vehicle_inspections_updated_at
    BEFORE UPDATE ON vehicle_inspections
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS vehicle_inspection_items_updated_at ON vehicle_inspection_items;
CREATE TRIGGER vehicle_inspection_items_updated_at
    BEFORE UPDATE ON vehicle_inspection_items
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Indices für bessere Abfrage-Performance
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_vehicle_id ON vehicle_inspections(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_date ON vehicle_inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspection_items_inspection_id ON vehicle_inspection_items(inspection_id);
