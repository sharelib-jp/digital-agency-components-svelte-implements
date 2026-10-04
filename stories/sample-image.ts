const landscapeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <rect width="640" height="360" fill="#e8f1ff" />
  <circle cx="530" cy="70" r="32" fill="#ffd966" />
  <path d="M0 270Q160 200 320 260T640 250V360H0Z" fill="#bedcc5" />
  <rect x="170" y="100" width="300" height="190" rx="4" fill="#ffffff" />
  <rect x="170" y="100" width="300" height="18" fill="#264f8c" />
  <g fill="#9bc5ed">
    <rect x="195" y="140" width="50" height="40" />
    <rect x="260" y="140" width="50" height="40" />
    <rect x="330" y="140" width="50" height="40" />
    <rect x="395" y="140" width="50" height="40" />
    <rect x="195" y="200" width="50" height="40" />
    <rect x="395" y="200" width="50" height="40" />
  </g>
  <rect x="280" y="210" width="80" height="80" fill="#264f8c" />
  <path d="M290 290H350L390 360H250Z" fill="#dedede" />
  <g fill="#5c805d">
    <circle cx="90" cy="245" r="42" />
    <circle cx="550" cy="245" r="42" />
  </g>
  <g stroke="#69563f" stroke-width="12">
    <path d="M90 245V310" />
    <path d="M550 245V310" />
  </g>
</svg>`;

// Data URLs do not depend on a deployment base path or an external image service.
export const sampleImageSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(landscapeSvg)}`;

export const sampleImageCompactSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  landscapeSvg.replace(
    'width="640" height="360" viewBox="0 0 640 360"',
    'width="320" height="360" viewBox="160 0 320 360"',
  ),
)}`;
