// Inezo Reformas e Construções - prévia da identidade renovada.
// Mantém o que já é da marca (INEZO, a casinha dentro do "O", azul-marinho + laranja) com traço mais limpo e moderno.
window.INEZO = {
  cores: { marinho: "#0E2A47", marinho2: "#081B30", azul: "#1F5C99", laranja: "#F28C28", laranja2: "#D9701A", gelo: "#EEF3F8", concreto: "#9AA7B4" },

  // Símbolo: "O" com a casa (telhado laranja) e a janelinha em 4 quadros
  simbolo(size = 200, tema = "cor") {
    const c = this.cores;
    const anel = tema === "branco" ? "#fff" : c.marinho;
    const tel = tema === "mono" ? anel : c.laranja;
    const jan = tema === "branco" ? "#fff" : c.azul;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${size}" height="${size}">
      <circle cx="100" cy="108" r="74" fill="none" stroke="${anel}" stroke-width="26"/>
      <path d="M34 92 100 34l66 58" fill="none" stroke="${tel}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="140" y="30" width="20" height="34" rx="3" fill="${tel}"/>
      <g fill="${jan}"><rect x="80" y="92" width="17" height="17" rx="2"/><rect x="103" y="92" width="17" height="17" rx="2"/><rect x="80" y="115" width="17" height="17" rx="2"/><rect x="103" y="115" width="17" height="17" rx="2"/></g>
    </svg>`;
  },

  // Assinatura: INEZ + símbolo no lugar do "O" + linha "REFORMAS E CONSTRUÇÕES"
  logo(width = 700, tema = "cor") {
    const c = this.cores;
    const tx = tema === "branco" ? "#fff" : c.marinho;
    const sub = tema === "branco" ? c.laranja : c.laranja2;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 300" width="${width}" height="${width * 300 / 860}">
      <text x="0" y="200" font-family="Mont" font-weight="900" font-size="230" letter-spacing="6" fill="${tx}">INEZ</text>
      <g transform="translate(612 4) scale(1.1)">${this.simbolo(200, tema).replace(/<svg[^>]*>|<\/svg>/g, "")}</g>
      <text x="8" y="282" font-family="Mont" font-weight="800" font-size="45" letter-spacing="7.5" fill="${sub}">REFORMAS E CONSTRUÇÕES</text>
    </svg>`;
  },
};
