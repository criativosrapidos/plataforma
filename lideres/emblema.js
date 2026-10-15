// Emblema Líderes do Brasil (vetor): losango branco arredondado, círculo azul e 4 gotas convergindo ao centro
window.EMB = (size = 300, fundo = "#3F4FA0", branco = "#fff", disco = true) => {
  const stem = `M-24 -63 C-11 -55 -8 -50 -9 -42 L9 -42 C8 -50 11 -55 24 -63Z`;
  const gota = (r) => `<g transform="rotate(${r})"><path d="${stem}" fill="${branco}"/><circle cx="0" cy="-37" r="13.5" fill="${branco}"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 200 200" width="${size}" height="${size}">
    ${disco ? `<circle r="100" fill="${fundo}"/>` : ""}
    <rect x="-64" y="-64" width="128" height="128" rx="14" transform="rotate(45)" fill="${branco}"/>
    <circle r="57" fill="${fundo}"/>
    ${[0, 90, 180, 270].map(gota).join("")}
  </svg>`;
};
