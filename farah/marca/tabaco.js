// Ilustração de tabacaria (só na versão "com tabaco" do vídeo): cigarro, charuto, folha de fumo e fumaça.
// Sempre acompanhada da advertência sanitária e do aviso de +18.
window.TABACO = {
  cena(size = 900, t = 0) {
    const fum = (dx, fase) => {
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const y = -i * 14;
        const x = dx + Math.sin(i * 0.45 + t * 2.4 + fase) * (6 + i * 1.6);
        pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      return pts.join(" ");
    };
    const brilho = 0.75 + 0.25 * Math.sin(t * 6);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900" width="${size}" height="${size}">
      <defs>
        <radialGradient id="brasa" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE08A"/><stop offset=".45" stop-color="#FF7A1A"/><stop offset="1" stop-color="#C9322A"/></radialGradient>
        <linearGradient id="charuto" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9A5B2E"/><stop offset=".5" stop-color="#6E3A1A"/><stop offset="1" stop-color="#4A240F"/></linearGradient>
        <linearGradient id="folha" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7FA34A"/><stop offset="1" stop-color="#4E6E2A"/></linearGradient>
        <filter id="blur6"><feGaussianBlur stdDeviation="6"/></filter>
      </defs>
      <!-- folha de fumo -->
      <g transform="translate(470 520) rotate(-28)">
        <path d="M0 0 C 120 -160, 330 -170, 420 -40 C 330 80, 130 110, 0 0Z" fill="url(#folha)"/>
        <path d="M0 0 C 140 -40, 280 -50, 420 -40" stroke="#C9D99A" stroke-width="6" fill="none"/>
        ${[60, 130, 200, 270, 340].map(x => `<path d="M${x} ${-10 - x * .07} q 30 -50 70 -70 M${x} ${-10 - x * .07} q 40 30 70 40" stroke="#C9D99A" stroke-width="3" fill="none" opacity=".8"/>`).join("")}
      </g>
      <!-- charuto -->
      <g transform="translate(150 600) rotate(-14)">
        <rect x="0" y="0" width="560" height="78" rx="39" fill="url(#charuto)"/>
        ${[70, 150, 230, 310, 390, 470].map(x => `<path d="M${x} 6 q -12 33 0 66" stroke="#3B1C0B" stroke-width="3" fill="none" opacity=".5"/>`).join("")}
        <rect x="380" y="-4" width="74" height="86" rx="10" fill="#E8473B"/>
        <rect x="380" y="10" width="74" height="10" fill="#FFC93C"/><rect x="380" y="62" width="74" height="10" fill="#FFC93C"/>
        <text x="417" y="52" text-anchor="middle" font-family="Cinzel" font-size="34" fill="#F7E6C4">F</text>
        <ellipse cx="560" cy="39" rx="12" ry="37" fill="#3B1C0B"/>
      </g>
      <!-- cigarro -->
      <g transform="translate(120 400) rotate(-6)">
        <rect x="0" y="0" width="150" height="54" rx="8" fill="#E9A15A"/>
        ${[20, 50, 80, 110, 135].map((x, i) => `<circle cx="${x}" cy="${i % 2 ? 16 : 36}" r="4" fill="#B86E2C"/>`).join("")}
        <rect x="150" y="0" width="420" height="54" fill="#FBF7EF"/>
        <rect x="150" y="0" width="8" height="54" fill="#D9C9AE"/>
        <rect x="555" y="0" width="30" height="54" rx="4" fill="#5B5550"/>
        <ellipse cx="588" cy="27" rx="14" ry="27" fill="url(#brasa)" opacity="${brilho.toFixed(2)}"/>
        <ellipse cx="588" cy="27" rx="30" ry="40" fill="#FF7A1A" opacity="${(0.25 * brilho).toFixed(2)}" filter="url(#blur6)"/>
      </g>
      <!-- fumaça -->
      <g transform="translate(700 400)" fill="none" stroke-linecap="round" filter="url(#blur6)">
        <polyline points="${fum(0, 0)}" stroke="#E8E4DE" stroke-width="18" opacity=".55"/>
        <polyline points="${fum(30, 2)}" stroke="#F4F1EC" stroke-width="12" opacity=".45"/>
        <polyline points="${fum(-25, 4)}" stroke="#D8D3CC" stroke-width="10" opacity=".35"/>
      </g>
    </svg>`;
  },
  // Advertência sanitária (texto de alerta do Ministério da Saúde / Anvisa) + aviso de +18
  aviso(w = 960) {
    return `<div style="width:${w}px;margin:0 auto;background:#000;color:#fff;border:4px solid #fff;padding:18px 26px;text-align:center;font-family:Mont;font-weight:900;font-size:32px;line-height:1.25">
      ESTE PRODUTO CAUSA CÂNCER.<br><span style="font-weight:800;font-size:26px">PARE DE FUMAR · DISQUE SAÚDE 136 · VENDA PROIBIDA PARA MENORES DE 18 ANOS</span></div>`;
  },
};
