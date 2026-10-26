// Agiliza Nota - prévia da identidade remodelada (símbolo, assinatura e slogan em SVG).
// Mantém o que já é reconhecido (nuvem + "a" + azul) e moderniza: traço cheio, selo verde de "nota emitida",
// tipografia Inter Display e um azul mais vivo.
window.AGILIZA = {
  cores: { azul: "#1660F5", azul2: "#0B3FB8", noite: "#0A1633", ciano: "#19C3FF", verde: "#22D38A", gelo: "#F3F6FB", erro: "#FF3B4E" },

  // Símbolo: nuvem cheia com "a" e selo de check (nota emitida). tema: cor | branco | mono
  simbolo(size = 300, tema = "cor", uid = "s") {
    const c = this.cores;
    const nuvem = tema === "branco" ? "#fff" : tema === "mono" ? c.noite : `url(#g${uid})`;
    const letra = tema === "branco" ? c.azul : "#fff";
    const selo = tema === "mono" ? c.noite : c.verde;
    const borda = tema === "branco" ? c.azul : tema === "mono" ? "#fff" : "#fff";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 160" width="${size}" height="${size * 160 / 220}">
      <defs><linearGradient id="g${uid}" gradientUnits="userSpaceOnUse" x1="20" y1="14" x2="200" y2="150"><stop offset="0" stop-color="${c.ciano}"/><stop offset=".55" stop-color="${c.azul}"/><stop offset="1" stop-color="${c.azul2}"/></linearGradient></defs>
      <g fill="${nuvem}"><circle cx="58" cy="102" r="40"/><circle cx="108" cy="70" r="56"/><circle cx="164" cy="100" r="42"/><rect x="58" y="90" width="106" height="52"/></g>
      <text x="110" y="124" text-anchor="middle" font-family="Inter Display" font-weight="900" font-size="104" fill="${letra}">a</text>
      <g transform="translate(176 122)"><circle r="26" fill="${selo}" stroke="${borda}" stroke-width="7"/>
        <path d="M-11 1 -3 9 12 -8" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g>
    </svg>`;
  },

  // Assinatura horizontal: símbolo + "agiliza nota"
  horizontal(width = 900, tema = "claro", simb = "cor") {
    const c = this.cores;
    const a = tema === "escuro" ? "#fff" : c.noite;
    const n = tema === "escuro" ? c.verde : c.azul;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 220" width="${width}" height="${width * 220 / 960}">
      <g transform="translate(0 26)">${this.simbolo(236, simb, "h" + Math.round(Math.random() * 1e6))}</g>
      <text x="268" y="152" font-family="Inter Display" font-weight="900" font-size="132" letter-spacing="-4" fill="${a}">agiliza<tspan dx="30" fill="${n}">nota</tspan></text>
    </svg>`;
  },

  // Slogan oficial
  slogan(width = 900, tema = "claro") {
    const c = this.cores;
    const a = tema === "escuro" ? "#fff" : c.noite;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 120" width="${width}" height="${width * 120 / 1000}">
      <text x="500" y="82" text-anchor="middle" font-family="Inter Display" font-weight="900" font-size="64" letter-spacing="-2" fill="${a}">Nota fiscal <tspan fill="${tema === "escuro" ? c.verde : c.azul}">sem dor de cabeça.</tspan></text>
    </svg>`;
  },
};
