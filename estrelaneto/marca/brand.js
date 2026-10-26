// Estrela Neto Advogados - recriação vetorial do logotipo e monograma (fonte Jost, traço fino)
window.EN = {
  cores: { petroleo: "#163543", ardosia: "#3F5866", aco: "#6E7F86", nevoa: "#8A9497", gelo: "#EEF0F1" },
  logo(width = 700, cor = "#fff") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 180" width="${width}" height="${width * 180 / 800}">
      <text x="400" y="88" text-anchor="middle" font-family="Jost" font-weight="300" font-size="92" letter-spacing="9" fill="${cor}">ESTRELA NETO</text>
      <rect x="38" y="112" width="724" height="2.5" fill="${cor}"/>
      <text x="400" y="160" text-anchor="middle" font-family="Jost" font-weight="400" font-size="30" letter-spacing="4" fill="${cor}" opacity=".85">ADVOGADOS | ASSOCIADOS</text>
    </svg>`;
  },
  mono(size = 200, cor = "#fff", anel = true) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${size}" height="${size}">
      ${anel ? `<circle cx="100" cy="100" r="96" fill="none" stroke="${cor}" stroke-width="1.6" opacity=".7"/>` : ""}
      <text x="62" y="124" text-anchor="middle" font-family="Jost" font-weight="300" font-size="70" fill="${cor}">E</text>
      <rect x="99" y="62" width="2.4" height="76" fill="${cor}"/>
      <text x="140" y="124" text-anchor="middle" font-family="Jost" font-weight="300" font-size="70" fill="${cor}">N</text>
    </svg>`;
  },
};
