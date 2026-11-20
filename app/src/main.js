// Wires the Vice Cover Maker page: photos in, layout and grade picked, caption
// typed, and the cover exported as a PNG. A `?shot=` query sets up a fixed
// scene for a screenshot instead (./shots.js).
import { drawCover, renderExport, layoutRects, GRADES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');

// The editor's state: everything drawCover needs, nothing more.
const state = {
  layout: 'hero',
  grade: 'sunset',
  grain: true,
  vignette: true,
  title: 'VICE CITY',
  subtitle: 'one last ride',
  photos: [],
  photoNames: [],
  panels: [
    { photo: 0, zoom: 1, dx: 0, dy: 0 },
    { photo: 1, zoom: 1, dx: 0, dy: 0 },
    { photo: 1, zoom: 1, dx: 0, dy: 0 },
    { photo: 0, zoom: 1, dx: 0, dy: 0 },
  ],
};
let selectedPanel = 0;

const panelSelect = document.getElementById('panel');
const panelPhoto = document.getElementById('panelPhoto');
const thumbs = document.getElementById('thumbs');

function redraw() {
  drawCover(canvas, state);
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// How many panels the current layout actually shows.
function panelCount() {
  return layoutRects(state.layout, canvas.width, canvas.height).length;
}

// Rebuilds the photo picker and the thumbnail strip after photos change.
function refreshPhotoUI() {
  panelPhoto.innerHTML = '';
  state.photoNames.forEach((name, i) => {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = name;
    panelPhoto.appendChild(option);
  });
  panelPhoto.value = String(state.panels[selectedPanel].photo);
  thumbs.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const img = document.createElement('img');
    img.src = photo.src;
    img.alt = state.photoNames[i];
    img.title = state.photoNames[i];
    if (state.panels[selectedPanel].photo === i) img.classList.add('selected');
    img.addEventListener('click', () => {
      state.panels[selectedPanel].photo = i;
      syncPanelControls();
      refreshPhotoUI();
      redraw();
    });
    thumbs.appendChild(img);
  });
}

// Copies the selected panel's zoom and offsets into the sliders.
function syncPanelControls() {
  const panel = state.panels[selectedPanel];
  document.getElementById('zoom').value = panel.zoom;
  document.getElementById('dx').value = panel.dx;
  document.getElementById('dy').value = panel.dy;
  document.getElementById('zoomVal').textContent = `${panel.zoom.toFixed(2)}×`;
  document.getElementById('dxVal').textContent = panel.dx.toFixed(2);
  document.getElementById('dyVal').textContent = panel.dy.toFixed(2);
  panelSelect.value = String(selectedPanel);
  panelPhoto.value = String(panel.photo);
  panelSelect.querySelectorAll('option').forEach((option) => {
    option.disabled = Number(option.value) >= panelCount();
  });
}

document.getElementById('photos').addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    const img = await loadImage(URL.createObjectURL(file));
    state.photos.push(img);
    state.photoNames.push(file.name);
  }
  refreshPhotoUI();
  redraw();
});

document.getElementById('layouts').addEventListener('click', (e) => {
  const button = e.target.closest('button[data-layout]');
  if (!button) return;
  state.layout = button.dataset.layout;
  document.querySelectorAll('#layouts button').forEach((b) => {
    b.classList.toggle('active', b === button);
  });
  syncPanelControls();
  redraw();
});

panelSelect.addEventListener('change', () => {
  selectedPanel = Number(panelSelect.value);
  syncPanelControls();
  refreshPhotoUI();
});
panelPhoto.addEventListener('change', () => {
  state.panels[selectedPanel].photo = Number(panelPhoto.value);
  refreshPhotoUI();
  redraw();
});
document.getElementById('zoom').addEventListener('input', (e) => {
  state.panels[selectedPanel].zoom = Number(e.target.value);
  syncPanelControls();
  redraw();
});
document.getElementById('dx').addEventListener('input', (e) => {
  state.panels[selectedPanel].dx = Number(e.target.value);
  syncPanelControls();
  redraw();
});
document.getElementById('dy').addEventListener('input', (e) => {
  state.panels[selectedPanel].dy = Number(e.target.value);
  syncPanelControls();
  redraw();
});
document.getElementById('fillAll').addEventListener('click', () => {
  const photo = state.panels[selectedPanel].photo;
  state.panels.forEach((panel) => { panel.photo = photo; });
  refreshPhotoUI();
  redraw();
});

document.getElementById('title').addEventListener('input', (e) => {
  state.title = e.target.value;
  redraw();
});
document.getElementById('subtitle').addEventListener('input', (e) => {
  state.subtitle = e.target.value;
  redraw();
});

// The grade buttons are built from GRADES, so the list stays in one place.
const gradesBox = document.getElementById('grades');
Object.entries(GRADES).forEach(([key, grade]) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.grade = key;
  button.textContent = grade.label;
  if (key === state.grade) button.classList.add('active');
  button.addEventListener('click', () => {
    state.grade = key;
    gradesBox.querySelectorAll('button').forEach((b) => {
      b.classList.toggle('active', b === button);
    });
    redraw();
  });
  gradesBox.appendChild(button);
});
document.getElementById('grain').addEventListener('change', (e) => {
  state.grain = e.target.checked;
  redraw();
});
document.getElementById('vignette').addEventListener('change', (e) => {
  state.vignette = e.target.checked;
  redraw();
});

// Dragging on the preview pans the panel under the pointer.
let drag = null;
function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * canvas.width,
    y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    w: canvas.width,
    h: canvas.height,
  };
}
canvas.addEventListener('pointerdown', (e) => {
  const point = canvasPoint(e);
  const rects = layoutRects(state.layout, point.w, point.h);
  const hit = rects.findIndex((r) => (
    point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h
  ));
  if (hit === -1) return;
  selectedPanel = hit;
  drag = { panel: hit, x: point.x, y: point.y, dx: state.panels[hit].dx, dy: state.panels[hit].dy };
  canvas.setPointerCapture(e.pointerId);
  syncPanelControls();
  refreshPhotoUI();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const point = canvasPoint(e);
  const rect = layoutRects(state.layout, point.w, point.h)[drag.panel];
  const panel = state.panels[drag.panel];
  panel.dx = Math.max(-1, Math.min(1, drag.dx + ((point.x - drag.x) / rect.w) * 2));
  panel.dy = Math.max(-1, Math.min(1, drag.dy + ((point.y - drag.y) / rect.h) * 2));
  syncPanelControls();
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('pointercancel', () => { drag = null; });

// One export button per post size; each renders the same state at that size.
async function exportCover(width, height, name) {
  status.textContent = 'Rendering…';
  const blob = await renderExport(state, width, height);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  status.textContent = `Saved ${name}`;
}
document.getElementById('exportSquare').addEventListener('click', () => {
  exportCover(1080, 1080, 'vice-cover-1080x1080.png');
});
document.getElementById('exportPortrait').addEventListener('click', () => {
  exportCover(1080, 1350, 'vice-cover-1080x1350.png');
});
document.getElementById('exportWide').addEventListener('click', () => {
  exportCover(1920, 1080, 'vice-cover-1920x1080.png');
});

// Applies a shot scene's state, then redraws once the fonts are in.
function applyShot(shotState) {
  Object.assign(state, shotState);
  document.querySelectorAll('#layouts button').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  gradesBox.querySelectorAll('button').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('grain').checked = state.grain;
  document.getElementById('vignette').checked = state.vignette;
  syncPanelControls();
  refreshPhotoUI();
  redraw();
}

async function boot() {
  const [boulevard, pier] = await Promise.all([
    loadImage('samples/boulevard.jpg'),
    loadImage('samples/pier.jpg'),
  ]);
  boulevard.src = 'samples/boulevard.jpg';
  pier.src = 'samples/pier.jpg';
  state.photos = [boulevard, pier];
  state.photoNames = ['Boulevard (sample)', 'Pier (sample)'];
  const shot = new URLSearchParams(location.search).get('shot');
  if (shot) {
    runShot(shot, new URLSearchParams(location.search), applyShot, state);
  }
  // The Anton and Pacifico files load locally; redraw once they arrive so the
  // title is set in the right faces instead of the fallback.
  if (document.fonts) {
    await document.fonts.ready;
    redraw();
  } else {
    redraw();
  }
  syncPanelControls();
  refreshPhotoUI();
}

boot();
