// Tutorial: conectar Instagram profissional + Facebook + Página e liberar acesso pra Criativos Rápidos.
// Tempos = palavras da locução (Scribe). Telas simplificadas, sem logos oficiais além de ícones genéricos.
window.DURATION = 99;
PUNCHES = [[0, 0.04], [7.0, 0.08], [9.8, 0.08], [11.54, 0.1], [31.16, 0.1], [46.38, 0.1], [59.28, 0.1], [73.06, 0.1], [89.18, 0.14]];
const CX = 540, CY = 990, PS = 0.98;

// ---------- telas ----------
const scr = {
  igProfile: (w, h, t) => { topBar('seu_negocio', { menu: true, big: true });
    ctx.fillStyle = '#D9D9D9'; ctx.beginPath(); ctx.arc(80, 190, 54, 0, 7); ctx.fill();
    [['12', 'posts'], ['340', 'seguidores'], ['180', 'seguindo']].forEach(([v, l], i) => { text(v, 200 + i * 90, 186, 26, C.K, { align: 'center' }); text(l, 200 + i * 90, 212, 15, '#777', { align: 'center', weight: 500 }); });
    text('Seu Negócio', 30, 280, 22, C.K); text('a bio do seu negócio aqui', 30, 308, 18, '#777', { weight: 500 });
    for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#E6E6EA' : '#D5D6DA'; ctx.fillRect((k % 3) * 147, 360 + Math.floor(k / 3) * 147, 145, 145); } },
  igMenu: (w, h, t) => { topBar('Menu', { back: true });
    ['Configurações e privacidade', 'Sua atividade', 'Arquivo', 'Salvos'].forEach((r, i) => row(r, 180 + i * 80, i === 0 ? hiAt(t, 20.0) : 0)); },
  igSettings: (w, h, t) => { topBar('Configurações e privacidade', { back: true });
    ['Central de Contas', 'Notificações', 'Tipo de conta e ferramentas', 'Privacidade da conta'].forEach((r, i) => row(r, 180 + i * 80, i === 2 ? hiAt(t, 22.0) : 0)); },
  igAccType: (w, h, t) => { topBar('Tipo de conta e ferramentas', { back: true });
    text('Ferramentas pra crescer o seu negócio', 30, 190, 20, '#5B5E66', { weight: 600 });
    button('Mudar para conta profissional', 300, FB, hiAt(t, 24.64)); },
  igCategory: (w, h, t) => { topBar('Qual a sua categoria?', { back: true });
    ['Beleza, cosméticos e cuidados', 'Loja de roupas', 'Restaurante', 'Serviços'].forEach((r, i) => row(r, 180 + i * 80, i === 0 ? hiAt(t, 27.3) : 0, { right: i === 0 ? '✓' : '' })); },
  igKind: (w, h, t) => { topBar('Você é...', { back: true });
    row('Empresa', 200, hiAt(t, 29.12), { right: '●', rightColor: FB }); row('Criador de conteúdo', 280, 0, { right: '○', rightColor: '#9A9CA3' });
    button('Concluir', 700, FB); },
  fbLogin: (w, h, t) => { ctx.fillStyle = C.WH; ctx.fillRect(0, 0, w, h); appIcon('fb', w / 2, 170, 0.9);
    field('Celular ou e-mail', '', 330, 0); field('Senha', '', 420, 0); button('Entrar', 520, FB);
    button('Criar nova conta', 720, '#2E9E5B', hiAt(t, 36.78)); },
  fbForm: (w, h, t) => { topBar('Criar conta', { back: true });
    field('Nome', 'Maria Souza', 200, prog(t, 38.9, 0.5)); field('Data de nascimento', '12/05/1990', 290, prog(t, 39.6, 0.7));
    field('Celular ou e-mail', 'maria@email.com', 380, prog(t, 40.86, 0.9)); field('Senha', '••••••••', 470, prog(t, 42.36, 0.5));
    button('Cadastrar', 620, FB, hiAt(t, 43.0)); },
  fbCode: (w, h, t) => { topBar('Confirme sua conta', { back: true });
    text('Digite o código que enviamos', 30, 190, 20, '#5B5E66', { weight: 600 });
    field('Código', '5 2 8 1 4', 280, prog(t, 43.9, 0.6)); button('Confirmar', 420, FB, hiAt(t, 44.7)); },
  fbHome: (w, h, t) => { topBar('facebook', { menu: true, big: true, color: FB });
    for (let i = 0; i < 3; i++) { ctx.fillStyle = '#F2F2F5'; roundRect(20, 140 + i * 210, w - 40, 190, 16); ctx.fill();
      ctx.fillStyle = '#D9D9D9'; ctx.beginPath(); ctx.arc(60, 180 + i * 210, 22, 0, 7); ctx.fill(); } },
  fbMenu: (w, h, t) => { topBar('Menu', { back: true });
    ['Grupos', 'Páginas', 'Marketplace', 'Configurações'].forEach((r, i) => row(r, 180 + i * 80, i === 1 ? hiAt(t, 51.9) : 0)); },
  fbPages: (w, h, t) => { topBar('Páginas', { back: true });
    text('Você ainda não tem Páginas', 30, 200, 20, '#5B5E66', { weight: 600 });
    button('+ Criar', 300, FB, hiAt(t, 53.3), 200); },
  fbPageForm: (w, h, t) => { topBar('Criar Página', { back: true });
    field('Nome da Página', 'Seu Negócio', 200, prog(t, 54.6, 0.8)); field('Categoria', 'Beleza e estética', 300, prog(t, 56.3, 0.6));
    button('Criar Página', 620, FB, hiAt(t, 57.78)); },
  fbPage: (w, h, t) => { topBar('Seu Negócio', { back: true });
    ctx.fillStyle = '#D5D6DA'; ctx.fillRect(0, 110, w, 150); ctx.fillStyle = '#9A9CA3'; ctx.beginPath(); ctx.arc(80, 260, 50, 0, 7); ctx.fill();
    text('Seu Negócio', 30, 350, 26, C.K); text('Beleza e estética', 30, 378, 18, '#777', { weight: 500 });
    button('⚙ Configurações', 470, '#5B5E66', hiAt(t, 64.0), 300); },
  fbSettings: (w, h, t) => { topBar('Configurações da Página', { back: true });
    ['Informações da Página', 'Contas vinculadas', 'Acesso à Página', 'Notificações'].forEach((r, i) => row(r, 180 + i * 80, i === 1 ? hiAt(t, 65.86) : 0)); },
  fbLinked: (w, h, t) => { topBar('Contas vinculadas', { back: true });
    row('Instagram', 190, hiAt(t, 67.82), { icon: (x, y) => appIcon('ig', x, y, 0.36), right: 'Conectar' });
    row('WhatsApp', 270, 0, { icon: (x, y) => { ctx.fillStyle = '#25D366'; ctx.beginPath(); ctx.arc(x, y, 18, 0, 7); ctx.fill(); }, right: 'Conectar' }); },
  igLogin: (w, h, t) => { ctx.fillStyle = C.WH; ctx.fillRect(0, 0, w, h); appIcon('ig', w / 2, 170, 0.9);
    field('Usuário', 'seu_negocio', 330, prog(t, 69.7, 0.4)); field('Senha', '••••••••', 420, prog(t, 70.0, 0.3));
    button('Entrar', 540, FB, hiAt(t, 70.4)); },
  linked: (w, h, t) => { ctx.fillStyle = C.WH; ctx.fillRect(0, 0, w, h);
    const p = easeOutBack(prog(t, 71.1, 0.4));
    appIcon('fb', w / 2 - 110, 300, 1.1 * clamp(p)); appIcon('ig', w / 2 + 110, 300, 1.1 * clamp(p));
    ctx.strokeStyle = '#2E9E5B'; ctx.lineWidth = 10; ctx.lineCap = 'round'; const l = easeOut(prog(t, 71.4, 0.4));
    ctx.beginPath(); ctx.moveTo(w / 2 - 45, 300); ctx.lineTo(w / 2 - 45 + 90 * l, 300); ctx.stroke();
    text('Tudo ligado!', w / 2, 470, 32, C.K, { align: 'center', alpha: l }); },
  bsHome: (w, h, t) => { topBar('Meta Business Suite', { big: false });
    appIcon('bs', 60, 180, 0.55); text('Seu Negócio', 110, 190, 24, C.K);
    ['Página inicial', 'Caixa de entrada', 'Conteúdo', 'Configurações'].forEach((r, i) => row(r, 290 + i * 80, i === 3 ? hiAt(t, 78.48) : 0)); },
  bsSettings: (w, h, t) => { topBar('Configurações', { back: true });
    ['Pessoas', 'Contas', 'Parceiros', 'Segurança'].forEach((r, i) => row(r, 180 + i * 80, i === 0 ? hiAt(t, 80.26) : 0)); },
  bsPeople: (w, h, t) => { topBar('Pessoas', { back: true });
    text('Quem pode gerenciar o seu negócio', 30, 190, 20, '#5B5E66', { weight: 600 });
    button('Adicionar pessoas', 300, FB, hiAt(t, 81.88), 300); },
  bsInvite: (w, h, t) => { topBar('Adicionar pessoas', { back: true });
    field('E-mail', 'e-mail da Criativos Rápidos', 200, prog(t, 84.0, 1.4));
    ctx.fillStyle = '#F2F2F5'; roundRect(30, 270, w - 60, 80, 14); ctx.fill();
    text('Acesso total', 50, 318, 24, C.K, { weight: 800 });
    const on = easeOut(prog(t, 86.6, 0.3));
    ctx.fillStyle = on > 0.5 ? '#2E9E5B' : '#C9CACE'; roundRect(w - 130, 290, 80, 42, 21); ctx.fill();
    ctx.fillStyle = C.WH; ctx.beginPath(); ctx.arc(w - 109 + 38 * on, 311, 16, 0, 7); ctx.fill();
    if (hiAt(t, 86.12) > 0) { ctx.strokeStyle = `rgba(255,212,0,${hiAt(t, 86.12)})`; ctx.lineWidth = 6; roundRect(26, 266, w - 52, 88, 16); ctx.stroke(); }
    button('Enviar convite', 640, FB, hiAt(t, 87.94)); },
};
function hiAt(t, at) { return clamp((t - at + 0.35) / 0.3) * (1 - clamp((t - at - 1.2) / 0.3)); }

// ---------- passos (telas, toques e legendas) ----------
const STEPS = [
  { n: 1, at: 11.4, end: 31.0, app: 'ig', title: 'Instagram profissional',
    screens: [[11.4, 'igProfile'], [18.5, 'igMenu'], [21.2, 'igSettings'], [24.0, 'igAccType'], [26.5, 'igCategory'], [28.7, 'igKind'], [30.2, 'ok:Conta profissional!']],
    taps: [[18.1, 397, 73], [20.6, 220, 180], [23.0, 220, 340], [25.6, 220, 300], [27.9, 220, 180], [29.7, 220, 200]],
    caps: [[11.6, 'Abra o Instagram › seu perfil'], [17.3, 'Toque nas 3 linhas ☰'], [19.6, 'Configurações e privacidade'], [21.4, 'Tipo de conta e ferramentas'], [24.1, 'Mudar para conta profissional'], [26.8, 'Escolha a categoria'], [28.8, 'Marque "Empresa"']] },
  { n: 2, at: 31.0, end: 46.2, app: 'fb', title: 'Conta no Facebook',
    screens: [[31.0, 'fbLogin'], [37.3, 'fbForm'], [43.4, 'fbCode'], [45.3, 'ok:Conta criada!']],
    taps: [[37.0, 220, 720], [43.2, 220, 620], [45.0, 220, 420]],
    caps: [[33.6, 'Não tem conta? Toque em "Criar nova conta"'], [38.4, 'Nome, data, celular ou e-mail e senha'], [43.4, 'Confirme o código']] },
  { n: 3, at: 46.2, end: 59.1, app: 'fb', title: 'Página do seu negócio',
    screens: [[46.2, 'fbHome'], [51.1, 'fbMenu'], [52.7, 'fbPages'], [53.9, 'fbPageForm'], [58.5, 'ok:Página criada!']],
    taps: [[50.8, 397, 73], [52.3, 220, 260], [53.6, 220, 300], [58.2, 220, 620]],
    caps: [[49.5, 'Abra o Menu ☰'], [51.4, 'Toque em "Páginas"'], [52.8, 'Toque em "Criar"'], [54.2, 'Nome + categoria › "Criar Página"']] },
  { n: 4, at: 59.1, end: 72.9, app: 'link', title: 'Conectar Instagram na Página',
    screens: [[59.1, 'fbPage'], [64.6, 'fbSettings'], [66.6, 'fbLinked'], [69.5, 'igLogin'], [71.0, 'linked']],
    taps: [[64.3, 220, 470], [66.4, 220, 260], [69.3, 380, 190], [70.6, 220, 540]],
    caps: [[62.6, 'Na Página › "Configurações"'], [65.3, '"Contas vinculadas"'], [67.4, 'Instagram › "Conectar"'], [70.0, 'Faça login no Instagram']] },
  { n: 5, at: 72.9, end: 89.0, app: 'bs', title: 'Liberar o acesso pra gente',
    screens: [[72.9, 'bsHome'], [79.2, 'bsSettings'], [81.0, 'bsPeople'], [83.4, 'bsInvite'], [88.5, 'ok:Convite enviado!']],
    taps: [[78.9, 220, 530], [80.7, 220, 180], [82.6, 220, 300], [86.7, 349, 311], [88.3, 220, 640]],
    caps: [[76.4, 'Abra o Meta Business Suite'], [78.2, '"Configurações" › "Pessoas"'], [81.2, '"Adicionar pessoas"'], [83.6, 'Coloque o e-mail que mandamos no WhatsApp'], [86.1, 'Ative "Acesso total" › "Enviar convite"']] },
];

function drawScreen(name, w, h, t, t0) {
  if (name.startsWith('ok:')) return success(name.slice(3), 'feito ✓', prog(t, t0, 0.8));
  scr[name](w, h, t);
}

function stepScene(S) {
  return (t) => {
    bg(C.OW); grid('#101216', 0.05);
    // cabeçalho
    pill('PASSO ' + S.n, 200, 320, 40, C.K, C.Y, t, S.at + 0.05, -0.04);
    const ic = easeOutBack(prog(t, S.at + 0.2, 0.35));
    if (ic > 0) { if (S.app === 'link') { appIcon('ig', 790, 320, 0.7 * ic); appIcon('fb', 880, 320, 0.7 * ic); } else appIcon(S.app, 860, 320, 0.8 * ic); }
    rise(S.title, 100, 450, 62, C.K, t, S.at + 0.3);
    // progresso dos 5 passos
    for (let i = 1; i <= 5; i++) { ctx.fillStyle = i <= S.n ? C.Y : '#D5D6DA'; roundRect(100 + (i - 1) * 170, 485, 150, 12, 6); ctx.fill(); }
    // celular com a tela atual (as telas deslizam como no app)
    let k = 0; S.screens.forEach((s, i) => { if (t >= s[0]) k = i; });
    const cur = S.screens[k], prev = S.screens[k - 1], sl = easeInOut3(prog(t, cur[0], 0.35));
    const ph = easeOut(prog(t, S.at, 0.45));
    phone(CX, CY + (1 - ph) * 500, PS, 0, (w, h) => {
      if (prev && sl < 1) { ctx.save(); ctx.translate(-w * sl, 0); drawScreen(prev[1], w, h, t, prev[0]); ctx.restore(); }
      ctx.save(); ctx.translate(k > 0 ? w * (1 - sl) : 0, 0); drawScreen(cur[1], w, h, t, cur[0]); ctx.restore();
    });
    S.taps.forEach(([at, x, y]) => tap(CX, CY, PS, x, y, t, at));
    // legenda da ação atual
    let c = null; S.caps.forEach((cp) => { if (t >= cp[0]) c = cp; });
    if (c) { const a = easeOutBack(prog(t, c[0], 0.3)); ctx.save(); ctx.translate(W / 2, 1470); ctx.scale(clamp(a, 0, 1.05), clamp(a, 0, 1.05));
      const fs = measure(c[1], 38) > 800 ? 32 : 38, wd = Math.min(880, measure(c[1], fs) + 70);
      ctx.fillStyle = C.K; roundRect(-wd / 2, -48, wd, 96, 30); ctx.fill();
      text(c[1], 0, fs * 0.36, fs, C.Y, { align: 'center' }); ctx.restore(); }
  };
}
const easeInOut3 = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

// ---------- abertura ----------
function intro(t) {
  bg(C.K); grid('#FFFFFF', 0.05); particles(t, C.Y, 40, 0.3);
  const lg = easeOutBack(prog(t, 0.05, 0.45));
  ctx.save(); ctx.translate(W / 2, 400); ctx.scale(clamp(lg, 0, 1.2), clamp(lg, 0, 1.2)); drawLogo(0, 0, 520, 1, C.WH); ctx.restore();
  text('Como conectar', W / 2, 620, 84, C.WH, { align: 'center' });
  text('suas contas', W / 2, 720, 84, C.Y, { align: 'center', skew: -9 });
  [['ig', 1.7], ['fb', 2.0], ['bs', 4.1]].forEach(([k, at], i) => { const p = easeOutBack(prog(t, at, 0.35)); if (p > 0) appIcon(k, 340 + i * 200, 900, 1.2 * clamp(p, 0, 1.1)); });
  // sem senha
  const s = easeOutBack(prog(t, 7.0, 0.35));
  if (s > 0) { ctx.save(); ctx.translate(W / 2, 1110); ctx.scale(s, s); ctx.rotate(-0.03);
    ctx.fillStyle = C.Y; roundRect(-400, -70, 800, 140, 40); ctx.fill();
    // cadeado riscado
    ctx.strokeStyle = C.K; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(-300, -12, 24, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = C.K; roundRect(-334, -12, 68, 52, 10); ctx.fill();
    ctx.strokeStyle = '#E0322C'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-350, 40); ctx.lineTo(-250, -50); ctx.stroke();
    text('Sem passar senha!', 40, 20, 56, C.K, { align: 'center' }); ctx.restore(); }
  // os 5 passos
  const L = ['Instagram profissional', 'Conta no Facebook', 'Página do negócio', 'Conectar Instagram', 'Liberar acesso'];
  L.forEach((l, i) => { const p = easeOut(prog(t, 9.9 + i * 0.22, 0.25)); if (p <= 0) return;
    text(`${i + 1}. ${l}`, 140, 1260 + i * 50, 36, C.WH, { weight: 700, alpha: p }); });
}

// ---------- fechamento ----------
function outro(t) {
  yellowBg();
  const c = easeOutBack(prog(t, 89.18, 0.4));
  ctx.save(); ctx.translate(W / 2, 520); ctx.scale(c, c);
  ctx.fillStyle = C.K; ctx.beginPath(); ctx.arc(0, 0, 150, 0, 7); ctx.fill();
  ctx.strokeStyle = C.Y; ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-64, 0); ctx.lineTo(-16, 50); ctx.lineTo(70, -46); ctx.stroke(); ctx.restore();
  burst(t, 89.3, W / 2, 520, C.K, 40, 520);
  pop('PRONTINHO!', W / 2, 800, 120, C.K, t, 89.3, { align: 'center' });
  rise('A gente aceita o convite', W / 2, 920, 50, C.K, t, 90.3, { align: 'center', weight: 700 });
  rise('e já começa a trabalhar.', W / 2, 985, 50, C.K, t, 91.0, { align: 'center', weight: 700 });
  ctaButton('DÚVIDAS? WHATSAPP', null, 1200, t, 93.3, 95.0);
  const lg = easeOut(prog(t, 95.8, 0.4));
  drawLogo(W / 2, 1420, 420, lg, C.K);
}

const SCENES = [{ at: 0, fn: intro }, ...STEPS.map((S) => ({ at: S.at, fn: stepScene(S), wipe: true })), { at: 89.0, fn: outro, zoom: true }];
