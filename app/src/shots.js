// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos
// loaded; ?shot=cover shows the cover alone. `layout` picks the panel layout,
// `grade` the colour grade, `photo` and `photo2` the samples (boulevard, pier),
// `caption` the title and `subtitle` the script line. window.__shotReady is set
// once the fonts are in and the scene is painted.
export async function runShot(shot, query, apply) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photoIndex = { boulevard: 0, pier: 1 };
  const main = photoIndex[query.get('photo')] ?? 0;
  const second = photoIndex[query.get('photo2')] ?? 1;
  apply({
    layout: query.get('layout') || 'hero',
    grade: query.get('grade') || 'sunset',
    title: query.get('caption') || 'VICE CITY',
    subtitle: query.get('subtitle') || 'one last ride',
    panels: [
      { photo: main, zoom: 1.0, dx: 0, dy: 0 },
      { photo: second, zoom: 1.05, dx: 0, dy: 0 },
      { photo: second, zoom: 1.15, dx: 0.2, dy: 0 },
      { photo: main, zoom: 1.05, dx: -0.15, dy: 0 },
    ],
  });
  if (document.fonts) await document.fonts.ready;
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
