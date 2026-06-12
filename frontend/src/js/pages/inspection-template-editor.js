import { api } from '../api.js';
import { renderShell, setShellInfo } from '../shell.js';
import { toast } from '../toast.js';
import { icon, renderIcons } from '../icons.js';
import { esc } from '../utils.js';

export async function renderInspectionTemplateEditor() {
  try {
    const [settings, user, vehicles] = await Promise.all([
      api.getSettings(),
      api.me(),
      api.getVehicles(),
    ]);

    setShellInfo(settings?.ff_name, user, settings?.modules);
    renderShell('fahrzeugpruefung');

    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="page-header">
        <div>
          <h2>Prüfungsitems verwalten</h2>
          <p>Wählen Sie ein Fahrzeug aus und legen Sie einen neuen Prüfpunkteintrag an.</p>
        </div>
      </div>
    `;

    if (!vehicles.length) {
      content.innerHTML += `
        <div class="content-card">
          <p>Keine Fahrzeuge gefunden. Bitte legen Sie zuerst ein Fahrzeug an.</p>
        </div>
      `;
      return;
    }

    const vehicleOptions = vehicles.map(v => `
      <option value="${v.id}">${esc(v.name)}${v.short_name ? ` (${esc(v.short_name)})` : ''} - ${esc(v.vehicle_type)}</option>
    `).join('');

    content.innerHTML += `
      <div class="content-card">
        <form id="template-form" class="inspection-form">
          <div class="form-group">
            <label>Fahrzeug</label>
            <select id="template-vehicle-select" class="field">
              ${vehicleOptions}
            </select>
          </div>

          <div class="form-group">
            <label>Prüfpunkt</label>
            <input type="text" id="template-item-name" class="field" placeholder="z.B. Pumpe" />
          </div>

          <div class="form-group">
            <label>Beschreibung</label>
            <textarea id="template-description" class="field" rows="3" placeholder="Optional: Hinweise zur Prüfung"></textarea>
          </div>

          <div class="form-group">
            <label>Priorität</label>
            <select id="template-priority" class="field">
              <option value="normal">Normal</option>
              <option value="critical">Kritisch</option>
            </select>
          </div>

          <div class="form-group">
            <label>Anzeigereihenfolge</label>
            <input type="number" id="template-display-order" class="field" value="100" min="1" />
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn--outline" id="btn-cancel-template">Abbrechen</button>
            <button type="submit" class="btn btn--primary" id="btn-save-template">Speichern</button>
          </div>
        </form>
      </div>

      <div id="existing-templates-wrap" class="content-card">
        <div class="card__header">Vorhandene Prüfpunkte</div>
        <div id="existing-templates" class="inspection-items">Lade...</div>
      </div>
    `;

    const vehicleSelect = document.getElementById('template-vehicle-select');
    vehicleSelect.addEventListener('change', () => loadExistingTemplates(vehicleSelect.value));

    document.getElementById('btn-cancel-template').addEventListener('click', () => {
      window.location.hash = '#/vehicle-inspection';
    });

    document.getElementById('template-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      const vehicleId = vehicleSelect.value;
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (!vehicle) {
        toast('Bitte wählen Sie ein Fahrzeug aus.', 'error');
        return;
      }

      const itemName = document.getElementById('template-item-name').value.trim();
      const description = document.getElementById('template-description').value.trim();
      const priority = document.getElementById('template-priority').value;
      const displayOrder = Number(document.getElementById('template-display-order').value) || 100;

      if (!itemName) {
        toast('Bitte geben Sie einen Prüfpunktnamen ein.', 'error');
        return;
      }

      try {
        await api.createInspectionTemplate({
          vehicle_type: vehicle.vehicle_type,
          item_name: itemName,
          description: description || null,
          priority,
          display_order: displayOrder,
        });
        toast('Prüfpunkt gespeichert', 'success');
        document.getElementById('template-item-name').value = '';
        document.getElementById('template-description').value = '';
        loadExistingTemplates(vehicleId);
      } catch (err) {
        toast(`Fehler beim Speichern: ${err.message}`, 'error');
      }
    });

    await loadExistingTemplates(vehicleSelect.value);
    renderIcons(content);
  } catch (err) {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="page-header">
        <div>
          <h2>Prüfungsitems verwalten</h2>
        </div>
      </div>
      <div class="content-card">
        <p>Fehler beim Laden der Seite: ${esc(err.message)}</p>
      </div>
    `;
  }
}

async function loadExistingTemplates(vehicleId) {
  const wrap = document.getElementById('existing-templates');
  if (!wrap) return;

  const response = await api.getVehicle(vehicleId);
  const vehicleType = response.vehicle_type;
  const templates = await api.getInspectionTemplates(vehicleType);

  if (!templates.length) {
    wrap.innerHTML = '<p class="text-muted">Keine Prüfpunkte für diesen Fahrzeugtyp vorhanden.</p>';
    return;
  }

  wrap.innerHTML = templates.map(t => `
    <div class="inspection-item">
      <div class="inspection-item__header">
        <label class="inspection-item__title">${esc(t.item_name)}</label>
        ${t.description ? `<p class="inspection-item__desc">${esc(t.description)}</p>` : ''}
      </div>
      <div class="inspection-item__controls">
        <span class="text-muted">Priorität: ${esc(t.priority)}</span>
      </div>
    </div>
  `).join('');
}
