// Identidade visual Farah Tabacaria - logos em SVG reaproveitados no vídeo, no manual e nas peças.
// Cores e fontes vêm do vídeo: coral (letreiro da loja), mar, sol, areia e tinta.
window.FARAH = {
  cores: { coral: "#E8473B", coral2: "#C9322A", mar: "#0B6E99", mar2: "#084C6B", sol: "#FFC93C", areia: "#F7E6C4", tinta: "#0D1B2A" },

  // Selo redondo: TABACARIA em arco, FARAH no centro, ondas do mar na base.
  emblema(size = 600, tema = "escuro") {
    const c = this.cores;
    const fundo = tema === "escuro" ? c.tinta : tema === "coral" ? c.coral : c.areia;
    const texto = tema === "claro" ? c.tinta : c.areia;
    const nome = tema === "coral" ? "#fff" : tema === "claro" ? c.coral : c.areia;
    const anel = tema === "coral" ? c.sol : c.coral;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="${size}" height="${size}">
      <defs><path id="arcoTop" d="M 110 300 A 190 190 0 0 1 490 300"/><path id="arcoBase" d="M 128 318 A 172 172 0 0 0 472 318"/>
      <clipPath id="circ"><circle cx="300" cy="300" r="262"/></clipPath></defs>
      <circle cx="300" cy="300" r="296" fill="${anel}"/>
      <circle cx="300" cy="300" r="272" fill="${fundo}"/>
      <circle cx="300" cy="300" r="262" fill="none" stroke="${anel}" stroke-width="3" opacity=".7"/>
      <g clip-path="url(#circ)">
        <path d="M30 470 Q105 440 180 470 T330 470 T480 470 T630 470 V620 H30Z" fill="${c.mar}"/>
        <path d="M30 505 Q105 478 180 505 T330 505 T480 505 T630 505 V620 H30Z" fill="${c.mar2}"/>
        <circle cx="300" cy="455" r="46" fill="${c.sol}" opacity=".95"/>
              </g>
      <path d="M30 482 Q105 452 180 482 T330 482 T480 482 T630 482" fill="none" stroke="${c.areia}" stroke-width="5" clip-path="url(#circ)" opacity=".9"/>
      <text font-family="Mont" font-weight="800" font-size="40" letter-spacing="14" fill="${texto}"><textPath href="#arcoTop" startOffset="50%" text-anchor="middle">TABACARIA</textPath></text>
      <text x="300" y="352" text-anchor="middle" font-family="Cinzel" font-size="118" letter-spacing="4" fill="${nome}">FARAH</text>
      <text x="300" y="398" text-anchor="middle" font-family="Mont" font-weight="800" font-size="26" letter-spacing="10" fill="${c.sol}">UBATUBA · SP</text>
    </svg>`;
  },

  // Assinatura horizontal: FARAH | TABACARIA / UBATUBA · SP
  horizontal(width = 900, tema = "escuro") {
    const c = this.cores;
    const nome = tema === "claro" ? c.coral : tema === "coral" ? "#fff" : c.coral;
    const sub = tema === "claro" ? c.tinta : "#fff";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 220" width="${width}" height="${width * 220 / 900}">
      <text x="0" y="168" font-family="Cinzel" font-size="176" letter-spacing="4" fill="${nome}">FARAH</text>
      <rect x="590" y="40" width="6" height="150" rx="3" fill="${c.sol}"/>
      <text x="622" y="112" font-family="Anton" font-size="78" letter-spacing="2" fill="${sub}">TABACARIA</text>
      <text x="624" y="170" font-family="Mont" font-weight="800" font-size="30" letter-spacing="9" fill="${c.sol}">UBATUBA · SP</text>
    </svg>`;
  },

  // Slogan oficial
  slogan(width = 900, tema = "escuro") {
    const c = this.cores;
    const a = tema === "claro" ? c.mar2 : c.areia, b = tema === "claro" ? c.tinta : "#fff";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 260" width="${width}" height="${width * 260 / 900}">
      <text x="450" y="80" text-anchor="middle" font-family="Pacifico" font-size="66" fill="${a}">Falou em Ubatuba,</text>
      <text x="450" y="180" text-anchor="middle" font-family="Anton" font-size="96" letter-spacing="1" fill="${b}">FALOU EM TABACARIA</text>
      <text x="450" y="250" text-anchor="middle" font-family="Cinzel" font-size="70" letter-spacing="10" fill="${c.coral}">FARAH.</text>
    </svg>`;
  },
};
