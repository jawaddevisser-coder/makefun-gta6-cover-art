// Draws a GTA-style multi-panel cover onto a canvas: several photo panels in a
// chosen layout, a Vice City sunset or neon colour grade, grain and a vignette,
// then a bold Anton title and a Pacifico script subtitle. Everything is drawn
// from relative coordinates, so the same state renders at any export size.

// The four layouts, each a function of the canvas size returning the panel
// rectangles (x, y, w, h as fractions of the canvas) in panel order.
export const LAYOUTS = {
  grid: (w, h) => {
    const g = 0.012;
    const hw = (1 - g * 3) / 2;
    const hh = (1 - g * 3) / 2;
    return [
      { x: g, y: g, w: hw, h: hh },
      { x: g * 2 + hw, y: g, w: hw, h: hh },
      { x: g, y: g * 2 + hh, w: hw, h: hh },
      { x: g * 2 + hw, y: g * 2 + hh, w: hw, h: hh },
    ];
  },
  hero: (w, h) => {
    const g = 0.012;
    const top = 0.62;
    const small = (1 - g * 4) / 3;
    return [
      { x: g, y: g, w: 1 - g * 2, h: top - g },
      { x: g, y: top + g, w: small, h: 1 - top - g * 2 },
      { x: g * 2 + small, y: top + g, w: small, h: 1 - top - g * 2 },
      { x: g * 3 + small * 2, y: top + g, w: small, h: 1 - top - g * 2 },
    ];
  },
  full: () => [{ x: 0, y: 0, w: 1, h: 1 }],
  tilted: (w, h) => {
    // Three overlapping snapshots, each slightly rotated, on a sunset sky.
    const pw = 0.52;
    const ph = 0.58;
    return [
      { x: 0.04, y: 0.06, w: pw, h: ph, rotate: -0.07 },
      { x: 0.44, y: 0.02, w: pw, h: ph, rotate: 0.05 },
      { x: 0.24, y: 0.34, w: pw, h: ph, rotate: -0.02 },
    ];
  },
};

// One grade: the photo filter, the tint washed over it, and the sky behind.
// The panel rectangles for a layout, in canvas pixels.
export function layoutRects(layout, w, h) {
  const maker = LAYOUTS[layout] || LAYOUTS.grid;
  return maker(w, h).map((r) => ({
    x: r.x * w,
    y: r.y * h,
    w: r.w * w,
    h: r.h * h,
    rotate: r.rotate || 0,
  }));
}

export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    filter: 'saturate(1.35) contrast(1.08) brightness(1.02)',
    tint: ['rgba(255, 122, 26, 0.22)', 'rgba(255, 0, 110, 0.30)'],
    sky: ['#2b0a3d', '#ff6b35', '#ffd319'],
  },
  neon: {
    label: 'Neon Nights',
    filter: 'saturate(1.6) contrast(1.2) brightness(0.95)',
    tint: ['rgba(0, 229, 255, 0.20)', 'rgba(255, 0, 204, 0.34)'],
    sky: ['#0a0618', '#3d0a5e', '#00e5ff'],
  },
  noir: {
    label: 'Noir',
    filter: 'grayscale(1) contrast(1.35) brightness(0.92)',
    tint: ['rgba(255, 255, 255, 0.05)', 'rgba(0, 0, 0, 0.28)'],
    sky: ['#111111', '#3a3a3a', '#8a8a8a'],
  },
  palm: {
    label: 'Palm Teal',
    filter: 'saturate(1.25) contrast(1.05) brightness(1.04) sepia(0.15)',
    tint: ['rgba(0, 200, 170, 0.20)', 'rgba(255, 180, 60, 0.22)'],
    sky: ['#062b2a', '#0e7a6b', '#ffcf5c'],
  },
  miami: {
    label: 'Miami Pink',
    filter: 'saturate(1.45) contrast(1.1) brightness(1.03)',
    tint: ['rgba(255, 105, 180, 0.28)', 'rgba(140, 0, 255, 0.24)'],
    sky: ['#1a0533', '#ff2e88', '#ffb3d9'],
  },
};

// A reusable film-grain tile, drawn faintly over the finished cover.
let grainTile = null;
function grainPattern(ctx) {
  if (grainTile) return grainTile;
  const tile = document.createElement('canvas');
  tile.width = 128;
  tile.height = 128;
  const tctx = tile.getContext('2d');
  const data = tctx.createImageData(128, 128);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 110 + Math.floor(Math.random() * 90);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  tctx.putImageData(data, 0, 0);
  grainTile = ctx.createPattern(tile, 'repeat');
  return grainTile;
}

// Draws one photo into one panel rectangle, honouring the panel's zoom and
// offsets: the photo always covers the panel, the offsets pan inside it.
function drawPanelPhoto(ctx, photo, rect, panel) {
  const { x, y, w, h, rotate = 0 } = rect;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  if (rotate) ctx.rotate(rotate);
  ctx.translate(-w / 2, -h / 2);
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();
  if (photo) {
    const zoom = panel.zoom || 1;
    const base = Math.max(w / photo.naturalWidth, h / photo.naturalHeight);
    const scale = base * zoom;
    const pw = photo.naturalWidth * scale;
    const ph = photo.naturalHeight * scale;
    const ox = (panel.dx || 0) * (pw - w) * 0.5;
    const oy = (panel.dy || 0) * (ph - h) * 0.5;
    ctx.drawImage(photo, (w - pw) / 2 + ox, (h - ph) / 2 + oy, pw, ph);
  } else {
    ctx.fillStyle = '#3a2140';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

// Paints the gradient sky used as the backdrop of the tilted layout.
function drawSky(ctx, w, h, grade) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.55, grade.sky[1]);
  sky.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // A low sun disc, half sunk behind the panels.
  const sun = ctx.createRadialGradient(w * 0.5, h * 0.42, 4, w * 0.5, h * 0.42, w * 0.34);
  sun.addColorStop(0, 'rgba(255, 240, 180, 0.95)');
  sun.addColorStop(0.5, 'rgba(255, 160, 60, 0.55)');
  sun.addColorStop(1, 'rgba(255, 120, 40, 0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);
}

// The title block: a slanted hot-pink band, the Anton title in white with a
// dark outline, and the Pacifico subtitle tucked underneath it.
function drawTitleBlock(ctx, w, h, title, subtitle) {
  const bandH = h * 0.16;
  const bandY = h - bandH - h * 0.02;
  ctx.save();
  ctx.translate(0, bandY + bandH / 2);
  ctx.rotate(-0.02);
  ctx.translate(0, -bandH / 2);
  const band = ctx.createLinearGradient(0, 0, w, 0);
  band.addColorStop(0, '#ff2e88');
  band.addColorStop(0.5, '#ff5e3a');
  band.addColorStop(1, '#ffb347');
  ctx.fillStyle = band;
  ctx.fillRect(-w * 0.02, 0, w * 1.04, bandH);
  ctx.restore();

  const text = (title || '').trim().toUpperCase();
  if (text) {
    let size = bandH * 0.62;
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
    while (ctx.measureText(text).width > w * 0.92 && size > 14) {
      size -= 2;
      ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(20, 0, 30, 0.85)';
    ctx.lineWidth = Math.max(2, size * 0.09);
    ctx.strokeText(text, w / 2, bandY + bandH * 0.42);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, w / 2, bandY + bandH * 0.42);
  }
  const sub = (subtitle || '').trim();
  if (sub) {
    let size = bandH * 0.34;
    ctx.font = `${size}px Pacifico, cursive`;
    while (ctx.measureText(sub).width > w * 0.7 && size > 12) {
      size -= 1;
      ctx.font = `${size}px Pacifico, cursive`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff7d6';
    ctx.shadowColor = 'rgba(20, 0, 30, 0.8)';
    ctx.shadowBlur = size * 0.25;
    ctx.fillText(sub, w / 2, bandY + bandH * 0.86);
    ctx.shadowBlur = 0;
  }
}

/**
 * Draws the whole cover for `state` onto `canvas` (any size):
 * state = { layout, grade, grain, vignette, title, subtitle,
 *           photos: [Image|null, ...], panels: [{photo, zoom, dx, dy}, ...] }
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const rects = layoutRects(state.layout, w, h);

  ctx.save();
  ctx.filter = 'none';
  if (state.layout === 'tilted') {
    drawSky(ctx, w, h, grade);
  } else {
    ctx.fillStyle = '#160a24';
    ctx.fillRect(0, 0, w, h);
  }

  rects.forEach((rect, i) => {
    const panel = state.panels[i] || { photo: 0, zoom: 1, dx: 0, dy: 0 };
    const photo = state.photos[panel.photo] || null;
    ctx.save();
    ctx.filter = grade.filter;
    drawPanelPhoto(ctx, photo, rect, panel);
    ctx.restore();
    // The grade tint, washed over the photo only.
    ctx.save();
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    if (rect.rotate) ctx.rotate(rect.rotate);
    ctx.translate(-rect.w / 2, -rect.h / 2);
    ctx.beginPath();
    ctx.rect(0, 0, rect.w, rect.h);
    ctx.clip();
    const tint = ctx.createLinearGradient(0, 0, rect.w, rect.h);
    tint.addColorStop(0, grade.tint[0]);
    tint.addColorStop(1, grade.tint[1]);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, rect.w, rect.h);
    ctx.globalCompositeOperation = 'source-over';
    // A white frame around each panel, like a printed poster.
    ctx.lineWidth = Math.max(2, w * 0.006);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.strokeRect(0, 0, rect.w, rect.h);
    ctx.restore();
  });

  if (state.vignette) {
    const vig = ctx.createRadialGradient(
      w / 2, h / 2, Math.min(w, h) * 0.42,
      w / 2, h / 2, Math.max(w, h) * 0.75,
    );
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(10, 0, 20, 0.42)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }
  if (state.grain) {
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = grainPattern(ctx);
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  drawTitleBlock(ctx, w, h, state.title, state.subtitle);
  ctx.restore();
}

// Renders the cover at an export size and resolves with its PNG blob.
export function renderExport(state, width, height) {
  const off = document.createElement('canvas');
  off.width = width;
  off.height = height;
  drawCover(off, state);
  return new Promise((resolve) => off.toBlob(resolve, 'image/png'));
}
