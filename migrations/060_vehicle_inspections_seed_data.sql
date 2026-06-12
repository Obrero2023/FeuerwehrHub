-- Example inspection templates for vehicle types

INSERT INTO vehicle_inspection_templates (vehicle_type, item_name, description, priority, display_order) VALUES
-- HLF-1 (Hilfeleistungslöschfahrzeug)
('hlf1', 'Wassertank Füllstand', 'Wassertank auf korrekten Füllstand überprüfen', 'critical', 10),
('hlf1', 'Pumpe funktionsfähig', 'Wasserpumpe auf Funktionsfähigkeit prüfen', 'critical', 20),
('hlf1', 'Schläuche intakt', 'Alle Schläuche auf Beschädigungen prüfen', 'critical', 30),
('hlf1', 'Strahlrohr vorhanden', 'Strahlrohre und Düsen kontrollieren', 'normal', 40),
('hlf1', 'Verbandskasten vollständig', 'Verbandskasten auf Vollständigkeit prüfen', 'normal', 50),
('hlf1', 'Feuerlöscher geprüft', 'Feuerlöscher auf Gültigkeitsdatum kontrollieren', 'critical', 60),
('hlf1', 'Beleuchtung funktionsfähig', 'Alle Leuchten und Warnleuchten testen', 'normal', 70),
('hlf1', 'Reifen Zustand', 'Reifenprofil und -druck überprüfen', 'critical', 80),

-- HLF-2 (Hilfeleistungslöschfahrzeug 2)
('hlf2', 'Wassertank Füllstand', 'Wassertank auf korrekten Füllstand überprüfen', 'critical', 10),
('hlf2', 'Pumpe funktionsfähig', 'Wasserpumpe auf Funktionsfähigkeit prüfen', 'critical', 20),
('hlf2', 'Schläuche intakt', 'Alle Schläuche auf Beschädigungen prüfen', 'critical', 30),
('hlf2', 'Rettungsgeräte vorhanden', 'Spreizer, Schere und Hebekissen kontrollieren', 'critical', 40),
('hlf2', 'Verbandskasten vollständig', 'Verbandskasten auf Vollständigkeit prüfen', 'normal', 50),
('hlf2', 'Feuerlöscher geprüft', 'Feuerlöscher auf Gültigkeitsdatum kontrollieren', 'critical', 60),
('hlf2', 'Beleuchtung funktionsfähig', 'Alle Leuchten und Warnleuchten testen', 'normal', 70),
('hlf2', 'Reifen Zustand', 'Reifenprofil und -druck überprüfen', 'critical', 80),

-- MTF (Mehrzweck-Transporter-Fahrzeug)
('mtf', 'Wassertank Füllstand', 'Wassertank auf korrekten Füllstand überprüfen', 'critical', 10),
('mtf', 'Transportbehälter sicher', 'Alle Transportbehälter auf sichere Befestigung prüfen', 'critical', 20),
('mtf', 'Wartungsgeräte vorhanden', 'Wartungsgeräte und Ersatzteile kontrollieren', 'normal', 30),
('mtf', 'Beleuchtung funktionsfähig', 'Alle Leuchten und Warnleuchten testen', 'normal', 40),
('mtf', 'Verbandskasten vollständig', 'Verbandskasten auf Vollständigkeit prüfen', 'normal', 50),
('mtf', 'Feuerlöscher geprüft', 'Feuerlöscher auf Gültigkeitsdatum kontrollieren', 'critical', 60),
('mtf', 'Reifen Zustand', 'Reifenprofil und -druck überprüfen', 'critical', 70),
('mtf', 'Bremsen Funktion', 'Bremsfunktion und Bremsflüssigkeit überprüfen', 'critical', 80)
ON CONFLICT (vehicle_type, item_name) DO NOTHING;
