import { api } from '../api.js';
import { renderShell, setShellInfo } from '../shell.js';
import { toast } from '../toast.js';
import { icon, renderIcons } from '../icons.js';
import { esc } from '../utils.js';

const VEHICLE_TYPES = {
  'hlf1-inspection': { key: 'hlf1', label: 'HLF-1', id: 'hlf1' },
  'hlf2-inspection': { key: 'hlf2', label: 'HLF-2', id: 'hlf2' },
  'mtf-inspection':  { key: 'mtf',  label: 'MTF',  id: 'mtf' },
};

export async function renderVehicleInspectionOverview() {
  try {
    const [settings, user, hlf1Templates, hlf2Templates, mtfTemplates] = await Promise.all([
      api.getSettings(),
      api.me(),
      api.getInspectionTemplates('hlf1'),
      api.getInspectionTemplates('hlf2'),
      api.getInspectionTemplates('mtf'),
    ]);

    setShellInfo(settings?.ff_name, user, settings?.modules);
    renderShell('fahrzeugpruefung');

    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="page-header">
        <div>
          <h2>Fahrzeugprüfung</h2>
          <p>Wählen Sie einen Fahrzeugtyp oder verwalten Sie Prüfpunkte.</p>
        </div>
      </div>

      <div class="card-grid">
        <div class="content-card content-card--clickable" data-route="#/hlf1-inspection">
          <h3>HLF-1</h3>
          <p>${hlf1Templates.length} Prüfpunkte verfügbar</p>
        </div>
        <div class="content-card content-card--clickable" data-route="#/hlf2-inspection">
          <h3>HLF-2</h3>
          <p>${hlf2Templates.length} Prüfpunkte verfügbar</p>
        </div>
        <div class="content-card content-card--clickable" data-route="#/mtf-inspection">
          <h3>MTF</h3>
          <p>${mtfTemplates.length} Prüfpunkte verfügbar</p>
        </div>
        <div class="content-card content-card--highlight content-card--clickable" data-route="#/inspection-templates">
          <h3>Prüfpunkte verwalten</h3>
          <p>Neue Prüfpunkt-Templates anlegen oder bestehende prüfen.</p>
        </div>
      </div>
    `;

    content.querySelectorAll('.content-card--clickable').forEach(card => {
      card.addEventListener('click', () => {
        window.location.hash = card.dataset.route;
      });
    });

    renderIcons(content);
  } catch (err) {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="page-header">
        <div>
          <h2>Fahrzeugprüfung</h2>
          <p>Fehler beim Laden der Prüfungsübersicht.</p>
        </div>
      </div>
      <div class="content-card">
        <p>${esc(err.message)}</p>
      </div>
    `;
    console.error(err);
  }
}

async function createAndLoadInspection(vehicleType) {
  try {
    const [settings, user] = await Promise.all([api.getSettings(), api.me()]);
    setShellInfo(settings?.ff_name, user, settings?.modules);
    renderShell('fahrzeugpruefung');

    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="page-header">
        <div>
          <h2>Fahrzeugprüfung - ${VEHICLE_TYPES[vehicleType]?.label}</h2>
          <p>Wählen Sie ein Fahrzeug aus, um die Prüfung zu starten.</p>
        </div>
      </div>
      <div class="spinner">Lade Fahrzeuge...</div>
    `;

    const [templates, vehicles] = await Promise.all([
      api.getInspectionTemplates(VEHICLE_TYPES[vehicleType].key),
      api.getVehicles(),
    ]);

    const availableVehicles = vehicles.filter(v => v.vehicle_type === VEHICLE_TYPES[vehicleType].key);

    if (!availableVehicles.length) {
      content.innerHTML = `
        <div class="page-header">
          <div>
            <h2>Fahrzeugprüfung - ${VEHICLE_TYPES[vehicleType]?.label}</h2>
            <p>Für diesen Fahrzeugtyp sind keine Fahrzeuge vorhanden.</p>
          </div>
        </div>
        <div class="content-card">
          <p>Bitte legen Sie zunächst ein Fahrzeug vom Typ ${VEHICLE_TYPES[vehicleType]?.label} an.</p>
        </div>
      `;
      return;
    }

    renderVehicleSelection(content, VEHICLE_TYPES[vehicleType].label, VEHICLE_TYPES[vehicleType].key, availableVehicles, templates);
    renderIcons(content);
  } catch (err) {
    toast(`Fehler beim Laden der Prüfung: ${err.message}`, 'error');
    console.error(err);
  }
}

function renderVehicleSelection(content, vehicleLabel, vehicleTypeKey, vehicles, templates) {
  const options = vehicles.map(v => `
    <option value="${v.id}">${esc(v.name)}${v.short_name ? ` (${esc(v.short_name)})` : ''}</option>
  `).join('');

  content.innerHTML = `
    <div class="page-header">
      <div>
        <h2>Fahrzeugprüfung - ${vehicleLabel}</h2>
        <p>Wählen Sie ein Fahrzeug aus, um die Prüfung zu starten.</p>
      </div>
    </div>

    <div class="content-card">
      <div class="form-group">
        <label>Fahrzeug</label>
        <select id="inspection-vehicle-select" class="field">
          ${options}
        </select>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn--outline" id="btn-cancel">Abbrechen</button>
        <button type="button" class="btn btn--primary" id="btn-start-inspection">Prüfung starten</button>
      </div>
    </div>
  `;

  document.getElementById('btn-cancel').addEventListener('click', () => {
    window.location.hash = '#/vehicle-inspection';
  });

  document.getElementById('btn-start-inspection').addEventListener('click', async () => {
    const vehicleId = document.getElementById('inspection-vehicle-select').value;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) {
      toast('Bitte wählen Sie ein Fahrzeug aus.', 'error');
      return;
    }

    await loadInspectionForVehicle(content, vehicle, templates);
  });
}

async function loadInspectionForVehicle(content, vehicle, templates) {
  try {
    content.innerHTML = `
      <div class="page-header">
        <div>
          <h2>Fahrzeugprüfung - ${vehicle.name}</h2>
          <p>Prüfung für ${vehicle.name} starten.</p>
        </div>
      </div>
      <div class="spinner">Erstelle Prüfung...</div>
    `;

    const today = new Date().toISOString().split('T')[0];
    const inspection = await api.createInspection({
      vehicle_id: vehicle.id,
      inspection_date: today,
    });

    renderInspectionForm(content, vehicle.name, templates, inspection);
    renderIcons(content);
  } catch (err) {
    toast(`Fehler beim Erstellen der Prüfung: ${err.message}`, 'error');
    console.error(err);
  }
}

function renderInspectionForm(content, vehicleLabel, templates, inspection) {
  const pumpRequired = templates.some(t => /pumpe/i.test(t.item_name));
  const itemsHtml = templates.map((t, idx) => `
    <div class="inspection-item">
      <div class="inspection-item__header">
        <label class="inspection-item__title">${t.item_name}</label>
        ${t.description ? `<p class="inspection-item__desc">${t.description}</p>` : ''}
      </div>
      <div class="inspection-item__controls">
        <div class="inspection-item__status">
          <label>
            <input type="radio" name="status-${idx}" value="ok" checked>
            <span>${icon('check-circle', 16)} Geprüft</span>
          </label>
          <label>
            <input type="radio" name="status-${idx}" value="missing">
            <span>${icon('alert-circle', 16)} Fehlt</span>
          </label>
        </div>
        <textarea 
          class="inspection-item__comment" 
          name="comment-${idx}" 
          placeholder="Kommentar (optional)"
          rows="2"></textarea>
      </div>
    </div>
  `).join('');

  content.innerHTML = `
    <div class="page-header">
      <div>
        <h2>Fahrzeugprüfung - ${vehicleLabel}</h2>
        <p>Bitte prüfen Sie die aufgeführten Punkte und senden Sie die Prüfung anschließend ab.</p>
        ${pumpRequired ? `<p class="text-muted">Achten Sie darauf, dass die Pumpe geprüft wird.</p>` : ''}
      </div>
    </div>

    <form id="inspection-form" class="inspection-form">
      <div class="inspection-items">
        ${itemsHtml}
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn--outline" id="btn-cancel">Abbrechen</button>
        <button type="submit" class="btn btn--primary" id="btn-save">Prüfung senden</button>
      </div>
    </form>
  `;

  document.getElementById('btn-cancel').addEventListener('click', () => {
    window.location.hash = '#/vehicle-inspection';
  });

  document.getElementById('inspection-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const items = templates.map((t, idx) => ({
      item_name: t.item_name,
      status: document.querySelector(`input[name="status-${idx}"]:checked`)?.value || 'pending',
      comment: document.querySelector(`textarea[name="comment-${idx}"]`)?.value || null,
    }));

    try {
      await api.saveInspection(inspection.id, { items });
      toast('Prüfung gespeichert', 'success');
      setTimeout(() => {
        window.location.hash = '#/vehicle-inspection';
      }, 1000);
    } catch (err) {
      toast(`Fehler beim Speichern: ${err.message}`, 'error');
    }
  });
}

export async function renderHlf1Inspection() {
  await createAndLoadInspection('hlf1-inspection');
}

export async function renderHlf2Inspection() {
  await createAndLoadInspection('hlf2-inspection');
}

export async function renderMtfInspection() {
  await createAndLoadInspection('mtf-inspection');
}
