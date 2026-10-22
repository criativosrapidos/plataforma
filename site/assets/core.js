// Camada de dados da plataforma: Supabase quando configurado, senão modo demonstração (localStorage).
// O modo demonstração também liga com ?demo=1 na URL (vale até fechar a aba), para mostrar o app a quem ainda não é cliente.
(function () {
  var C = window.CR_CONFIG || {};
  var SEM_CHAVES = !(C.SUPABASE_URL && C.SUPABASE_ANON_KEY);
  var DEMO_FORCADO = false;
  try {
    var q = new URLSearchParams(location.search).get("demo");
    if (q === "1") sessionStorage.setItem("cr-demo", "1");
    if (q === "0") sessionStorage.removeItem("cr-demo");
    DEMO_FORCADO = sessionStorage.getItem("cr-demo") === "1";
  } catch (e) {}
  var DEMO = SEM_CHAVES || DEMO_FORCADO;
  var BUCKET = "entregas";

  var TIPOS = { stories: "Stories", post: "Post", carrossel: "Carrossel", reels: "Reels", anuncio: "Anúncio", video: "Vídeo", outro: "Outro" };
  var STATUS = { aguardando: "Para aprovar", aprovado: "Aprovado", ajuste: "Em ajuste" };
  var CREDITOS = { stories: 1, post: 2, carrossel: 3, reels: 4, anuncio: 5 };

  // O que cada plano, pacote e vídeo inclui. É a mesma tabela da landing e dos contratos.
  var PLANOS = [
    { nome: "Sem plano", grupo: "", ajustes: 0 },
    { nome: "Presença", grupo: "plano", preco: "R$ 597/mês", ajustes: 1, papel: "Conteúdo pronto. Você posta.",
      qtd: { stories: 10, post: 9, carrossel: 6, reels: 3, anuncio: 2 }, posta: false, trafego: false,
      inclui: ["Legendas prontas", "Perfil completo", "Calendário de postagem pronto", "Você publica no seu tempo"] },
    { nome: "Crescimento", grupo: "plano", preco: "R$ 797/mês", ajustes: 2, papel: "Social media: a gente programa e posta.",
      qtd: { stories: 20, post: 12, carrossel: 9, reels: 6, anuncio: 3 }, posta: true, trafego: false,
      inclui: ["Legendas prontas", "Perfil completo", "A gente programa e posta"] },
    { nome: "Autoridade", grupo: "plano", preco: "R$ 997/mês", ajustes: 3, papel: "Social media + gestão de tráfego.",
      qtd: { stories: 30, post: 15, carrossel: 12, reels: 9, anuncio: 4 }, posta: true, trafego: true,
      inclui: ["Legendas prontas", "Perfil completo", "A gente programa e posta", "Gestão de tráfego pago", "Relatório mensal", "Bônus: calendário humanizado e sequência de stories que vende"] },
    { nome: "Largada", grupo: "pacote", preco: "R$ 97", ajustes: 1, qtd: { video: 2, anuncio: 1 }, papel: "3 anúncios: 2 vídeos e 1 arte.", inclui: ["2 vídeos pra anúncio", "1 arte pra anúncio"] },
    { nome: "Acelera", grupo: "pacote", preco: "R$ 297", ajustes: 2, qtd: { anuncio: 1 }, papel: "Identidade visual com 1 anúncio de brinde.", inclui: ["Identidade visual: logo, paleta, fontes, foto de perfil e destaques", "Brinde: 1 anúncio pronto"] },
    { nome: "Turbo", grupo: "pacote", preco: "R$ 497", ajustes: 3, papel: "Identidade visual completa, landing page e PDFs bônus.", inclui: ["Identidade visual completa", "Landing page completa", "PDFs bônus: boas práticas do Instagram e respostas prontas de vendas"] }
  ];
  function plano(nome) { return PLANOS.find(function (p) { return p.nome === nome; }) || PLANOS[0]; }

  // ---------------------------------------------------------------- utilidades
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "class") n.className = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) n.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    });
    [].concat(kids || []).forEach(function (k) { if (k != null) n.appendChild(typeof k === "string" ? document.createTextNode(k) : k); });
    return n;
  }
  function data(d) {
    if (!d) return "";
    var s = String(d).slice(0, 10).split("-");
    return s.length === 3 ? s[2] + "/" + s[1] + "/" + s[0] : d;
  }
  var SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function dataLonga(s) {
    if (!s) return "";
    var p = String(s).slice(0, 10).split("-"), d = new Date(+p[0], +p[1] - 1, +p[2]);
    var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    var dif = Math.round((d - hoje) / 864e5);
    if (dif === 0) return "hoje";
    if (dif === 1) return "amanhã";
    if (dif === -1) return "ontem";
    return SEMANA[d.getDay()] + ", " + d.getDate() + " de " + MESES[d.getMonth()];
  }
  function inicioDoMes() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString(); }
  function toast(msg, erro) {
    var t = document.getElementById("toast");
    if (!t) { t = el("div", { id: "toast", role: "status" }); document.body.appendChild(t); }
    t.textContent = msg; t.className = "show" + (erro ? " erro" : "");
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.className = ""; }, 3200);
  }
  function whats(texto) {
    return C.WHATSAPP ? "https://wa.me/" + C.WHATSAPP + (texto ? "?text=" + encodeURIComponent(texto) : "") : "";
  }
  function soDigitos(s) { return String(s || "").replace(/\D/g, ""); }
  function copiar(texto, ok) {
    try {
      navigator.clipboard.writeText(texto).then(function () { toast(ok || "Copiado"); }, function () { toast("Não deu pra copiar. Selecione o texto e copie.", true); });
    } catch (e) { toast("Não deu pra copiar. Selecione o texto e copie.", true); }
  }

  // Google Drive: transforma o link de compartilhar em prévia e em download direto
  function driveId(url) {
    var m = String(url || "").match(/\/d\/([\w-]{10,})/) || String(url || "").match(/[?&]id=([\w-]{10,})/);
    return m ? m[1] : null;
  }
  function linkPrevia(url) { var id = driveId(url); return id ? "https://drive.google.com/file/d/" + id + "/preview" : url; }
  function linkDownload(url) { var id = driveId(url); return id ? "https://drive.google.com/uc?export=download&id=" + id : url; }
  function tipoArquivo(nome) {
    var n = String(nome || "").toLowerCase().split("?")[0];
    if (/\.(mp4|mov|webm|m4v)$/.test(n)) return "video";
    if (/\.(png|jpe?g|webp|gif)$/.test(n)) return "imagem";
    if (/\.pdf$/.test(n)) return "pdf";
    return "arquivo";
  }
  function nomeArquivo(nome) { return nome.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w.-]+/g, "_"); }

  // a função do Instagram devolve { error: "mensagem" } no corpo
  async function erroFuncao(e) {
    try { var d = await e.context.json(); if (d && d.error) return d.error; } catch (x) {}
    return /Failed to send|fetch/i.test(e.message) ? "Não consegui falar com o servidor. A função do Instagram foi publicada no Supabase?" : e.message;
  }

  // ---------------------------------------------------------------- Supabase
  function apiSupabase() {
    var sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
    function ok(r) { if (r.error) throw new Error(traduz(r.error.message)); return r.data; }
    function traduz(m) {
      if (/Invalid login credentials/i.test(m)) return "E-mail ou senha incorretos.";
      if (/Email not confirmed/i.test(m)) return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
      if (/already registered/i.test(m)) return "Esse e-mail já tem conta. Use Entrar ou Esqueci minha senha.";
      if (/Password should be/i.test(m)) return "A senha precisa ter pelo menos 6 caracteres.";
      if (/Failed to fetch|NetworkError/i.test(m)) return "Sem conexão. Confira sua internet e tente de novo.";
      return m;
    }
    return {
      demo: false,
      async usuario() { var r = await sb.auth.getSession(); return r.data.session ? r.data.session.user : null; },
      async entrar(email, senha) { ok(await sb.auth.signInWithPassword({ email: email, password: senha })); },
      async criarConta(email, senha, meta) {
        var d = ok(await sb.auth.signUp({ email: email, password: senha, options: { data: meta, emailRedirectTo: location.origin + "/app" } }));
        return { confirmar: !d.session };
      },
      async esqueci(email) { ok(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + "/entrar?nova=1" })); },
      async novaSenha(senha) { ok(await sb.auth.updateUser({ password: senha })); },
      aoMudarSessao(fn) { sb.auth.onAuthStateChange(function (ev) { fn(ev); }); },
      async sair() { await sb.auth.signOut(); },
      async perfil() {
        var u = await this.usuario(); if (!u) return null;
        return ok(await sb.from("perfis").select("*").eq("id", u.id).single());
      },
      async salvarPerfil(id, campos) { ok(await sb.from("perfis").update(campos).eq("id", id)); },
      async clientes() { return ok(await sb.from("perfis").select("*").order("criado_em", { ascending: false })); },
      async entregas(clienteId) {
        var q = sb.from("entregas").select("*").order("criado_em", { ascending: false });
        if (clienteId) q = q.eq("cliente_id", clienteId);
        return ok(await q);
      },
      async aprovar(id) { ok(await sb.from("entregas").update({ status: "aprovado", comentario: null }).eq("id", id)); },
      async pedirAjuste(entrega, comentario) {
        var u = await this.usuario();
        ok(await sb.from("ajustes").insert({ entrega_id: entrega.id, cliente_id: u.id, comentario: comentario }));
        ok(await sb.from("entregas").update({ status: "ajuste", comentario: comentario }).eq("id", entrega.id));
      },
      async ajustesNoMes(clienteId) {
        var r = await sb.from("ajustes").select("id", { count: "exact", head: true }).eq("cliente_id", clienteId).gte("criado_em", inicioDoMes());
        if (r.error) throw new Error(r.error.message);
        return r.count || 0;
      },
      async criarEntrega(campos, arquivo, aoProgredir, extras) {
        async function sobe(f) {
          var path = campos.cliente_id + "/" + Date.now() + "-" + nomeArquivo(f.name);
          if (aoProgredir) aoProgredir("Enviando " + f.name + "…");
          ok(await sb.storage.from(BUCKET).upload(path, f, { contentType: f.type, upsert: false }));
          return path;
        }
        if (arquivo) { campos.arquivo_path = await sobe(arquivo); campos.arquivo_nome = arquivo.name; }
        if (extras && extras.length) { campos.extras = []; for (var i = 0; i < extras.length; i++) campos.extras.push(await sobe(extras[i])); }
        return ok(await sb.from("entregas").insert(campos).select().single());
      },
      async urlExtras(entrega) {
        var out = [];
        for (var i = 0; i < (entrega.extras || []).length; i++) out.push(ok(await sb.storage.from(BUCKET).createSignedUrl(entrega.extras[i], 3600)).signedUrl);
        return out;
      },
      async instagramLink() { var r = await sb.functions.invoke("instagram/link", { method: "POST" }); if (r.error) throw new Error(await erroFuncao(r.error)); return r.data.url; },
      async instagramDesconectar() { var r = await sb.functions.invoke("instagram/desconectar", { method: "POST" }); if (r.error) throw new Error(await erroFuncao(r.error)); },
      async publicarAgora(id) { var r = await sb.functions.invoke("instagram/publicar", { method: "POST", body: { entrega_id: id } }); if (r.error) throw new Error(await erroFuncao(r.error)); return r.data.resultado; },
      async trocarArquivo(entrega, arquivo) {
        var path = entrega.cliente_id + "/" + Date.now() + "-" + nomeArquivo(arquivo.name);
        ok(await sb.storage.from(BUCKET).upload(path, arquivo, { contentType: arquivo.type }));
        if (entrega.arquivo_path) await sb.storage.from(BUCKET).remove([entrega.arquivo_path]);
        ok(await sb.from("entregas").update({ arquivo_path: path, arquivo_nome: arquivo.name, status: "aguardando" }).eq("id", entrega.id));
      },
      async editarEntrega(id, campos) { ok(await sb.from("entregas").update(campos).eq("id", id)); },
      async apagarEntrega(entrega) {
        if (entrega.arquivo_path) await sb.storage.from(BUCKET).remove([entrega.arquivo_path]);
        ok(await sb.from("entregas").delete().eq("id", entrega.id));
      },
      // link temporário (1 hora) do arquivo em alta qualidade
      async urlArquivo(entrega, baixar) {
        if (entrega.arquivo_path) {
          var d = ok(await sb.storage.from(BUCKET).createSignedUrl(entrega.arquivo_path, 3600, baixar ? { download: entrega.arquivo_nome || true } : undefined));
          return d.signedUrl;
        }
        return baixar ? linkDownload(entrega.link_externo) : linkPrevia(entrega.link_externo);
      },
      async enviarBriefing(b) {
        var u = await this.usuario(); if (u) b.cliente_id = u.id;
        ok(await sb.from("briefings").insert(b));
      },
      async briefings() { return ok(await sb.from("briefings").select("*").order("criado_em", { ascending: false })); },
      async statusBriefing(id, status) { ok(await sb.from("briefings").update({ status: status }).eq("id", id)); },
      async apagarBriefing(id) { ok(await sb.from("briefings").delete().eq("id", id)); },
      async enviarLead(l) { ok(await sb.from("leads").insert(l)); },
      async leads() { return ok(await sb.from("leads").select("*").order("criado_em", { ascending: false })); },
      async statusLead(id, status) { ok(await sb.from("leads").update({ status: status }).eq("id", id)); },
      async apagarLead(id) { ok(await sb.from("leads").delete().eq("id", id)); }
    };
  }

  // ---------------------------------------------------------------- modo demonstração
  function apiDemo() {
    var KEY = "cr-demo-v5";
    function dia(n) { var d = new Date(); d.setDate(d.getDate() + n); return iso(d); }
    function semente() {
      var cli = "demo-cliente", adm = "demo-admin", cli2 = "demo-cliente-2";
      var D = "assets/demo/", V = "assets/videos/";
      return {
        sessao: null,
        perfis: [
          { id: adm, email: "agencia@demo", nome: "Ana Cláudia", empresa: "Criativos Rápidos", whatsapp: "", plano: "Sem plano", ajustes_mes: 0, papel: "admin", criado_em: dia(-40) },
          { id: cli, email: "cliente@demo", nome: "Marina Souza", empresa: "Brasa Burger", whatsapp: "(61) 90000-0000", plano: "Crescimento", ajustes_mes: 2, papel: "cliente", instagram: "brasaburger", criado_em: dia(-12) },
          { id: cli2, email: "lis@demo", nome: "Letícia Ramos", empresa: "Lis Moda", whatsapp: "(61) 90000-0001", plano: "Largada", ajustes_mes: 1, papel: "cliente", criado_em: dia(-3) }
        ],
        entregas: [
          { id: "e1", cliente_id: cli, titulo: "Reels do combo duplo", tipo: "reels", legenda: "Tá com fome? 🍔 Combo duplo por R$ 34,90 toda terça e quarta. Burger duplo + batata + refri. Peça pelo link da bio!", data_postagem: dia(1), demo_url: V + "exemplo-hamburgueria.mp4", demo_capa: V + "exemplo-hamburgueria.jpg", arquivo_nome: "reels-combo-duplo.mp4", status: "aguardando", criado_em: dia(0) + "T10:00" },
          { id: "e2", cliente_id: cli, titulo: "Post do combo duplo", tipo: "post", legenda: "Duas carnes, queijo derretendo e preço de amigo. Combo duplo R$ 34,90, só terça e quarta.", data_postagem: dia(2), demo_url: D + "brasa-post-combo.jpg", arquivo_nome: "post-combo-duplo.jpg", status: "aguardando", criado_em: dia(0) + "T09:00" },
          { id: "e3", cliente_id: cli, titulo: "Stories delivery até 23h", tipo: "stories", legenda: "", data_postagem: dia(0), demo_url: D + "brasa-stories.jpg", arquivo_nome: "stories-delivery.jpg", status: "aprovado", hora_postagem: "18:00", publicar: true, criado_em: dia(-1) + "T15:00" },
          { id: "e4", cliente_id: cli, titulo: "Carrossel 3 motivos", tipo: "carrossel", legenda: "Salva pra lembrar na hora da fome 😋 Arrasta pro lado e vê os 3 motivos.", data_postagem: dia(-2), demo_url: D + "brasa-carrossel.jpg", arquivo_nome: "carrossel-3-motivos.jpg", status: "aprovado", hora_postagem: "12:00", publicado_em: dia(-2) + "T12:00", publicado_link: "https://www.instagram.com/", criado_em: dia(-3) + "T11:00" },
          { id: "e5", cliente_id: cli, titulo: "Anúncio frete grátis", tipo: "anuncio", legenda: "Frete grátis nos pedidos acima de R$ 50. Peça agora!", data_postagem: dia(4), demo_url: D + "brasa-anuncio.jpg", arquivo_nome: "anuncio-frete-gratis.jpg", status: "ajuste", comentario: "Trocar para frete grátis acima de R$ 60.", criado_em: dia(-1) + "T18:00" },
          { id: "e6", cliente_id: cli2, titulo: "Vídeo nova coleção", tipo: "video", legenda: "Nova coleção primavera-verão. Vestidos a partir de R$ 89.", data_postagem: dia(3), demo_url: V + "exemplo-moda.mp4", demo_capa: V + "exemplo-moda.jpg", arquivo_nome: "video-nova-colecao.mp4", status: "aguardando", criado_em: dia(0) + "T08:00" }
        ],
        ajustes: [{ id: "a1", entrega_id: "e5", cliente_id: cli, comentario: "Trocar para frete grátis acima de R$ 60.", criado_em: new Date().toISOString() }],
        briefings: [
          { id: "b1", cliente_id: cli, nome: "Marina Souza", empresa: "Brasa Burger", whatsapp: "(61) 90000-0000", plano: "Crescimento", status: "pronto", criado_em: dia(-10) + "T09:00", texto: "*BRIEFING · CRIATIVOS RÁPIDOS*\n\n*Sobre*\n• Nome: Marina Souza\n• Empresa: Brasa Burger\n• Segmento: hamburgueria delivery\n\n*Negócio*\n• O que vende: hambúrgueres artesanais, combos e porções\n• Diferencial: carne moída na hora e entrega rápida\n\n*Cliente*\n• Quem é: jovens de 18 a 35 anos do bairro\n\n*Conteúdo*\n• Divulgar primeiro: combo duplo de terça e quarta" }
        ],
        leads: [
          { id: "l1", nome: "Rafael Lima", whatsapp: "(61) 98888-0000", empresa: "Barbearia do Rafa", interesse: "Crescimento", origem: "home", status: "novo", criado_em: dia(0) + "T11:30" },
          { id: "l2", nome: "Patrícia Alves", whatsapp: "(61) 97777-0000", empresa: "@doces.paty", interesse: "Largada", origem: "videos", status: "conversando", criado_em: dia(-1) + "T19:10" }
        ]
      };
    }
    function ler() { try { return JSON.parse(localStorage.getItem(KEY)) || semente(); } catch (e) { return semente(); } }
    function gravar(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
    var db = ler();
    if (!db.leads) db.leads = [];
    var mem = {}; // arquivos enviados nesta aba (não ficam salvos no modo demonstração)
    function salvar() { gravar(db); }
    function uid() { return "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
    function espera() { return new Promise(function (r) { setTimeout(r, 120); }); }
    function achar(lista, id) { return db[lista].find(function (x) { return x.id === id; }); }
    var ouvintes = [];
    return {
      demo: true,
      async usuario() { var p = db.sessao && achar("perfis", db.sessao); return p ? { id: p.id, email: p.email } : null; },
      async entrar(email) {
        await espera();
        var p = db.perfis.find(function (x) { return x.email === String(email).trim().toLowerCase(); });
        if (!p) throw new Error("Na demonstração use cliente@demo ou agencia@demo (qualquer senha).");
        db.sessao = p.id; salvar(); ouvintes.forEach(function (f) { f("SIGNED_IN"); });
      },
      async criarConta(email, senha, meta) {
        await espera();
        email = String(email).trim().toLowerCase();
        if (db.perfis.some(function (p) { return p.email === email; })) throw new Error("Esse e-mail já tem conta. Use Entrar.");
        var p = { id: uid(), email: email, nome: meta.nome, empresa: meta.empresa, whatsapp: meta.whatsapp, plano: "Sem plano", ajustes_mes: 0, papel: "cliente", criado_em: iso(new Date()) };
        db.perfis.push(p); db.sessao = p.id; salvar();
        return { confirmar: false };
      },
      async esqueci() { await espera(); },
      async novaSenha() { await espera(); },
      aoMudarSessao(fn) { ouvintes.push(fn); },
      async sair() { db.sessao = null; salvar(); },
      async perfil() { return (db.sessao && achar("perfis", db.sessao)) || null; },
      async salvarPerfil(id, campos) { Object.assign(achar("perfis", id), campos); salvar(); },
      async clientes() { return db.perfis.slice().reverse(); },
      async entregas(clienteId) {
        return db.entregas.filter(function (e) { return !clienteId || e.cliente_id === clienteId; })
          .sort(function (a, b) { return a.criado_em < b.criado_em ? 1 : -1; });
      },
      async aprovar(id) { var e = achar("entregas", id); e.status = "aprovado"; e.comentario = null; salvar(); },
      async pedirAjuste(entrega, comentario) {
        db.ajustes.push({ id: uid(), entrega_id: entrega.id, cliente_id: entrega.cliente_id, comentario: comentario, criado_em: new Date().toISOString() });
        var e = achar("entregas", entrega.id); e.status = "ajuste"; e.comentario = comentario; salvar();
      },
      async ajustesNoMes(clienteId) { var i = inicioDoMes(); return db.ajustes.filter(function (a) { return a.cliente_id === clienteId && a.criado_em >= i; }).length; },
      async criarEntrega(campos, arquivo, prog, extras) {
        await espera();
        var e = Object.assign({ id: uid(), status: "aguardando", publicar: true, criado_em: new Date().toISOString() }, campos);
        if (arquivo) { mem[e.id] = URL.createObjectURL(arquivo); e.arquivo_nome = arquivo.name; }
        if (extras && extras.length) { e.extras = extras.map(function (f, i) { mem[e.id + ":" + i] = URL.createObjectURL(f); return f.name; }); }
        db.entregas.push(e); salvar(); return e;
      },
      async urlExtras(entrega) { return (entrega.extras || []).map(function (x, i) { return mem[entrega.id + ":" + i] || (entrega.demo_extras || [])[i] || ""; }); },
      async instagramLink() {
        await espera();
        var p = achar("perfis", db.sessao); p.instagram = (p.empresa || "minhaempresa").toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, ""); salvar();
        return "app.html?ig=ok#conta";
      },
      async instagramDesconectar() { achar("perfis", db.sessao).instagram = null; salvar(); },
      async publicarAgora(id) {
        await espera();
        var e = achar("entregas", id), p = achar("perfis", e.cliente_id);
        if (!p.instagram) throw new Error("Esse cliente ainda não conectou o Instagram.");
        e.publicado_em = new Date().toISOString(); e.publicado_link = "https://www.instagram.com/" + p.instagram + "/"; e.publicacao_erro = null; salvar();
        return "publicado";
      },
      async trocarArquivo(entrega, arquivo) {
        var e = achar("entregas", entrega.id);
        mem[e.id] = URL.createObjectURL(arquivo); e.arquivo_nome = arquivo.name; e.demo_url = null; e.demo_capa = null; e.status = "aguardando"; salvar();
      },
      async editarEntrega(id, campos) { Object.assign(achar("entregas", id), campos); salvar(); },
      async apagarEntrega(entrega) { db.entregas = db.entregas.filter(function (x) { return x.id !== entrega.id; }); salvar(); },
      async urlArquivo(entrega, baixar) {
        if (mem[entrega.id]) return mem[entrega.id];
        if (entrega.demo_url) return entrega.demo_url;
        if (entrega.link_externo) return baixar ? linkDownload(entrega.link_externo) : linkPrevia(entrega.link_externo);
        return "";
      },
      async enviarBriefing(b) { await espera(); b.id = uid(); b.status = "novo"; b.criado_em = new Date().toISOString(); if (db.sessao) b.cliente_id = db.sessao; db.briefings.push(b); salvar(); },
      async briefings() { return db.briefings.slice().sort(function (a, b) { return a.criado_em < b.criado_em ? 1 : -1; }); },
      async statusBriefing(id, status) { achar("briefings", id).status = status; salvar(); },
      async apagarBriefing(id) { db.briefings = db.briefings.filter(function (b) { return b.id !== id; }); salvar(); },
      async enviarLead(l) { await espera(); l.id = uid(); l.status = "novo"; l.criado_em = new Date().toISOString(); db.leads.push(l); salvar(); },
      async leads() { return db.leads.slice().sort(function (a, b) { return a.criado_em < b.criado_em ? 1 : -1; }); },
      async statusLead(id, status) { achar("leads", id).status = status; salvar(); },
      async apagarLead(id) { db.leads = db.leads.filter(function (b) { return b.id !== id; }); salvar(); },
      resetar() { db = semente(); mem = {}; salvar(); }
    };
  }

  var api = DEMO ? apiDemo() : apiSupabase();

  // faixa de aviso no modo demonstração
  function avisoDemo() {
    if (!DEMO || document.getElementById("demo-bar")) return;
    var kids = DEMO_FORCADO && !SEM_CHAVES
      ? [el("span", {}, [el("b", { text: "Demonstração. " }), "Tudo aqui é exemplo, com marcas fictícias."]),
         el("button", { type: "button", text: "Sair da demonstração", onclick: function () { try { sessionStorage.removeItem("cr-demo"); } catch (e) {} location.href = "./"; } })]
      : [el("span", {}, [el("b", { text: "Demonstração. " }), "Entre como cliente@demo ou agencia@demo, com qualquer senha."]),
         el("button", { type: "button", text: "Recomeçar", onclick: function () { api.resetar(); location.reload(); } })];
    document.body.insertBefore(el("div", { id: "demo-bar" }, kids), document.body.firstChild);
  }

  // app instalável (PWA): registra o service worker e guarda o convite de instalação do Android/Chrome
  var convite = null;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); convite = e; document.dispatchEvent(new Event("cr-instalavel")); });
  function registrarApp() {
    try {
      if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost") && window.top === window.self)
        navigator.serviceWorker.register("/sw.js").catch(function () {});
    } catch (e) {}
  }
  function instalado() { try { return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; } catch (e) { return false; } }
  function ios() { return /iphone|ipad|ipod/i.test(navigator.userAgent); }

  window.CR = {
    api: api, demo: DEMO, demoForcado: DEMO_FORCADO && !SEM_CHAVES, config: C,
    el: el, data: data, dataLonga: dataLonga, iso: iso, MESES: MESES, SEMANA: SEMANA,
    toast: toast, whats: whats, copiar: copiar, soDigitos: soDigitos,
    TIPOS: TIPOS, STATUS: STATUS, CREDITOS: CREDITOS, PLANOS: PLANOS, plano: plano,
    tipoArquivo: tipoArquivo, linkPrevia: linkPrevia, avisoDemo: avisoDemo,
    registrarApp: registrarApp, instalado: instalado, ios: ios,
    podeInstalar: function () { return !!convite; },
    instalar: async function () { if (!convite) return false; convite.prompt(); var r = await convite.userChoice; convite = null; return r.outcome === "accepted"; },
    // manda para /entrar se não estiver logado; devolve o perfil. Na demonstração aberta pelo site, entra direto como cliente.
    async exigirLogin(papel) {
      var p = null;
      try { p = await api.perfil(); } catch (e) { p = null; }
      if (!p && DEMO_FORCADO) { await api.entrar(papel === "admin" ? "agencia@demo" : "cliente@demo"); p = await api.perfil(); }
      if (!p) { location.replace("entrar.html?volta=" + encodeURIComponent(location.pathname.split("/").pop() || "app.html")); return null; }
      if (papel === "admin" && p.papel !== "admin") { location.replace("app.html"); return null; }
      return p;
    }
  };
})();
