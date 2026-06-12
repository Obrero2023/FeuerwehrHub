import { api } from '../api.js';
import { renderShell, setShellInfo } from '../shell.js';

const TYPE_TITLES = {
  'hlf1-inspection': 'HLF-1',
  'hlf2-inspection': 'HLF-2',
  'mtf-inspection': 'MTF',
};

export async function renderVehicleInspectionOverview() {
  const [settings, user] = await Promise.all([api.getSettings(), api.me()]);
  setShellInfo(settings?.ff_name, user, settings?.modules);
  renderShell('fahrzeugpruefung');

  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="page-header">
      <div>
        <h2>Fahrzeugprüfung</h2>
        <p>Die Unterpunkte HLF-1, HLF-2 und MTF sind bereits eingebaut.</p>
      </div>
    </div>
    <div class="content-card">
      <p>Diese Seite ist aktuell leer und wird später mit Prüfungsinhalten gefüllt.</p>
    </div>
  `;
}

export async function renderHlf1Inspection() {
  await renderInspectionPage('hlf1-inspection');
}

export async function renderHlf2Inspection() {
  await renderInspectionPage('hlf2-inspection');
}

export async function renderMtfInspection() {
  await renderInspectionPage('mtf-inspection');
}

async function renderInspectionPage(pageKey) {
  const [settings, user] = await Promise.all([api.getSettings(), api.me()]);
  setShellInfo(settings?.ff_name, user, settings?.modules);
  renderShell('fahrzeugpruefung');

  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="page-header">
      <div>
        <h2>Fahrzeugprüfung - ${TYPE_TITLES[pageKey]}</h2>
        <p>Diese Seite ist aktuell leer und wird später mit Prüfungsdetails gefüllt.</p>
      </div>
    </div>
    <div class="content-card">
      <p>Hier werden später Prüfungen für ${TYPE_TITLES[pageKey]} angezeigt.</p>
    </div>
  `;
}
