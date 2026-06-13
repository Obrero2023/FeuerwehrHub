-- Migration 061: Add HLF inspection items for vehicle inspection templates

INSERT INTO vehicle_checklist_templates (vehicle_type, item_name, description, priority, display_order) VALUES
('hlf1', 'Wassertank voll', 'Wassertank auf korrekten Füllstand überprüfen', 'critical', 10),
('hlf1', 'Benzin Voll', 'Benzinfüllstand prüfen', 'critical', 20),
('hlf1', 'Pumpe', 'Wasserpumpe auf Funktionsfähigkeit prüfen', 'critical', 30),
('hlf2', 'Wassertank voll', 'Wassertank auf korrekten Füllstand überprüfen', 'critical', 10),
('hlf2', 'Benzin Voll', 'Benzinfüllstand prüfen', 'critical', 20),
('hlf2', 'Pumpe', 'Wasserpumpe auf Funktionsfähigkeit prüfen', 'critical', 30)
ON CONFLICT (vehicle_type, item_name) DO UPDATE SET
    description = EXCLUDED.description,
    priority = EXCLUDED.priority,
    display_order = EXCLUDED.display_order;