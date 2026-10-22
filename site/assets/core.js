// Camada de dados da plataforma: Supabase quando configurado, senão modo demonstração (localStorage).
(function () {
  var C = window.CR_CONFIG || {};
  var DEMO = !(C.SUPABASE_URL && C.SUPABASE_ANON_KEY);
  var BUCKET = "entregas";

  var TIPOS = { stories: "Stories", post: "Post", carrossel: "Carrossel", reels: "Reels", anuncio: "Anúncio", video: "Vídeo", outro: "Outro" };
  var STATUS = { aguardando: "Para aprovar", aprovado: "Aprovado", ajuste: "Em ajuste" };
  var PLANOS = [
    { nome: "Sem plano", ajustes: 0 },
    { nome: "Largada", ajustes: 1 }, { nome: "Acelera", ajustes: 2 }, { nome: "Turbo", ajustes: 3 },
    { nome: "Presença", ajustes: 1 }, { nome: "Crescimento", ajustes: 2 }, { nome: "Autoridade", ajustes: 3 },
    { nome: "Vídeo motion", ajustes: 1 }
  ];

  // ---------------------------------------------------------------- utilidades
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "class") n.className = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
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

  // Google Drive: transforma o link de compartilhar em prévia e em download direto
  function driveId(url) {
    var m = String(url || "").match(/\/d\/([\w-]{10,})/) || String(url || "").match(/[?&]id=([\w-]{10,})/);
    return m ? m[1] : null;
  }
  function linkPrevia(url) { var id = driveId(url); return id ? "https://drive.google.com/file/d/" + id + "/preview" : url; }
  function linkDownload(url) { var id = driveId(url); return id ? "https://drive.google.com/uc?export=download&id=" + id : url; }
  function tipoArquivo(nome) {
    var n = String(nome || "").toLowerCase();
    if (/\.(mp4|mov|webm|m4v)$/.test(n)) return "video";
    if (/\.(png|jpe?g|webp|gif)$/.test(n)) return "imagem";
    if (/\.pdf$/.test(n)) return "pdf";
    return "arquivo";
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
      async criarEntrega(campos, arquivo, aoProgredir) {
        if (arquivo) {
          var path = campos.cliente_id + "/" + Date.now() + "-" + arquivo.name.normalize("NFD").replace(/[^\w.-]+/g, "_");
          if (aoProgredir) aoProgredir("Enviando " + arquivo.name + "…");
          ok(await sb.storage.from(BUCKET).upload(path, arquivo, { contentType: arquivo.type, upsert: false }));
          campos.arquivo_path = path; campos.arquivo_nome = arquivo.name;
        }
        return ok(await sb.from("entregas").insert(campos).select().single());
      },
      async trocarArquivo(entrega, arquivo) {
        var path = entrega.cliente_id + "/" + Date.now() + "-" + arquivo.name.normalize("NFD").replace(/[^\w.-]+/g, "_");
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
      async apagarBriefing(id) { ok(await sb.from("briefings").delete().eq("id", id)); }
    };
  }

  // ---------------------------------------------------------------- modo demonstração
  function apiDemo() {
    var KEY = "cr-demo-v1";
    function hoje(dias) { var d = new Date(); d.setDate(d.getDate() + (dias || 0)); return d.toISOString().slice(0, 10); }
    function semente() {
      var cli = "demo-cliente", adm = "demo-admin";
      return {
        sessao: null,
        perfis: [
          { id: adm, email: "agencia@demo", nome: "Ana Cláudia", empresa: "Criativos Rápidos", whatsapp: "", plano: "Sem plano", ajustes_mes: 0, papel: "admin", criado_em: hoje(-30) },
          { id: cli, email: "cliente@demo", nome: "Cliente Exemplo", empresa: "Academia Exemplo", whatsapp: "(61) 90000-0000", plano: "Crescimento", ajustes_mes: 2, papel: "cliente", criado_em: hoje(-2) }
        ],
        entregas: [
          { id: "e1", cliente_id: cli, titulo: "Reels de apresentação", tipo: "reels", legenda: "Conheça quem faz seu treino render. Agende sua aula experimental pelo link da bio.", data_postagem: hoje(1), demo_url: "assets/videos/reels-ze-conhece.mp4", arquivo_nome: "reels-apresentacao.mp4", status: "aguardando", criado_em: hoje(0) },
          { id: "e2", cliente_id: cli, titulo: "Vídeo motion da promoção", tipo: "video", legenda: "Matrícula com 20% de desconto até sexta. Chama no WhatsApp!", data_postagem: hoje(2), demo_url: "assets/videos/reels-motion-loja.mp4", arquivo_nome: "motion-promocao.mp4", status: "aguardando", criado_em: hoje(0) },
          { id: "e3", cliente_id: cli, titulo: "Anúncio planos e valores", tipo: "anuncio", legenda: "Planos a partir de R$ 89 por mês. Sem taxa de matrícula.", data_postagem: hoje(-1), demo_url: "assets/videos/reels-valores.mp4", arquivo_nome: "anuncio-valores.mp4", status: "aprovado", criado_em: hoje(-1) }
        ],
        ajustes: [],
        briefings: []
      };
    }
    function ler() { try { return JSON.parse(localStorage.getItem(KEY)) || semente(); } catch (e) { return semente(); } }
    function gravar(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
    var db = ler();
    var mem = {}; // arquivos enviados nesta aba (não ficam salvos no modo demonstração)
    function salvar() { gravar(db); }
    function uid() { return "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
    function espera() { return new Promise(function (r) { setTimeout(r, 120); }); }
    var ouvintes = [];
    return {
      demo: true,
      async usuario() { return db.sessao ? { id: db.sessao, email: (db.perfis.find(function (p) { return p.id === db.sessao; }) || {}).email } : null; },
      async entrar(email) {
        await espera();
        var p = db.perfis.find(function (x) { return x.email === String(email).trim().toLowerCase(); });
        if (!p) throw new Error("No modo demonstração use cliente@demo ou agencia@demo (qualquer senha).");
        db.sessao = p.id; salvar(); ouvintes.forEach(function (f) { f("SIGNED_IN"); });
      },
      async criarConta(email, senha, meta) {
        await espera();
        email = String(email).trim().toLowerCase();
        if (db.perfis.some(function (p) { return p.email === email; })) throw new Error("Esse e-mail já tem conta. Use Entrar.");
        var p = { id: uid(), email: email, nome: meta.nome, empresa: meta.empresa, whatsapp: meta.whatsapp, plano: "Sem plano", ajustes_mes: 0, papel: "cliente", criado_em: hoje(0) };
        db.perfis.push(p); db.sessao = p.id; salvar();
        return { confirmar: false };
      },
      async esqueci() { await espera(); },
      async novaSenha() { await espera(); },
      aoMudarSessao(fn) { ouvintes.push(fn); },
      async sair() { db.sessao = null; salvar(); },
      async perfil() { return db.perfis.find(function (p) { return p.id === db.sessao; }) || null; },
      async salvarPerfil(id, campos) { var p = db.perfis.find(function (x) { return x.id === id; }); Object.assign(p, campos); salvar(); },
      async clientes() { return db.perfis.slice().reverse(); },
      async entregas(clienteId) {
        return db.entregas.filter(function (e) { return !clienteId || e.cliente_id === clienteId; })
          .sort(function (a, b) { return a.criado_em < b.criado_em ? 1 : -1; });
      },
      async aprovar(id) { var e = db.entregas.find(function (x) { return x.id === id; }); e.status = "aprovado"; e.comentario = null; salvar(); },
      async pedirAjuste(entrega, comentario) {
        db.ajustes.push({ id: uid(), entrega_id: entrega.id, cliente_id: entrega.cliente_id, comentario: comentario, criado_em: new Date().toISOString() });
        var e = db.entregas.find(function (x) { return x.id === entrega.id; }); e.status = "ajuste"; e.comentario = comentario; salvar();
      },
      async ajustesNoMes(clienteId) { var i = inicioDoMes(); return db.ajustes.filter(function (a) { return a.cliente_id === clienteId && a.criado_em >= i; }).length; },
      async criarEntrega(campos, arquivo) {
        await espera();
        var e = Object.assign({ id: uid(), status: "aguardando", criado_em: new Date().toISOString() }, campos);
        if (arquivo) { mem[e.id] = URL.createObjectURL(arquivo); e.arquivo_nome = arquivo.name; e.demo_tipo = arquivo.type; }
        db.entregas.push(e); salvar(); return e;
      },
      async trocarArquivo(entrega, arquivo) {
        var e = db.entregas.find(function (x) { return x.id === entrega.id; });
        mem[e.id] = URL.createObjectURL(arquivo); e.arquivo_nome = arquivo.name; e.demo_url = null; e.status = "aguardando"; salvar();
      },
      async editarEntrega(id, campos) { Object.assign(db.entregas.find(function (x) { return x.id === id; }), campos); salvar(); },
      async apagarEntrega(entrega) { db.entregas = db.entregas.filter(function (x) { return x.id !== entrega.id; }); salvar(); },
      async urlArquivo(entrega, baixar) {
        if (mem[entrega.id]) return mem[entrega.id];
        if (entrega.demo_url) return entrega.demo_url;
        if (entrega.link_externo) return baixar ? linkDownload(entrega.link_externo) : linkPrevia(entrega.link_externo);
        return "";
      },
      async enviarBriefing(b) { await espera(); b.id = uid(); b.status = "novo"; b.criado_em = new Date().toISOString(); if (db.sessao) b.cliente_id = db.sessao; db.briefings.push(b); salvar(); },
      async briefings() { return db.briefings.slice().reverse(); },
      async statusBriefing(id, status) { db.briefings.find(function (b) { return b.id === id; }).status = status; salvar(); },
      async apagarBriefing(id) { db.briefings = db.briefings.filter(function (b) { return b.id !== id; }); salvar(); },
      resetar() { db = semente(); mem = {}; salvar(); }
    };
  }

  var api = DEMO ? apiDemo() : apiSupabase();

  // faixa de aviso no modo demonstração
  function avisoDemo() {
    if (!DEMO || document.getElementById("demo-bar")) return;
    var b = el("div", { id: "demo-bar" }, [
      el("span", {}, [el("b", { text: "Modo demonstração. " }), "Os dados ficam só neste navegador. Entre como cliente@demo ou agencia@demo, com qualquer senha."]),
      el("button", { type: "button", text: "Recomeçar demonstração", onclick: function () { api.resetar(); location.reload(); } })
    ]);
    document.body.insertBefore(b, document.body.firstChild);
  }

  window.CR = {
    api: api, demo: DEMO, config: C, el: el, data: data, toast: toast, whats: whats,
    TIPOS: TIPOS, STATUS: STATUS, PLANOS: PLANOS, tipoArquivo: tipoArquivo, linkPrevia: linkPrevia, avisoDemo: avisoDemo,
    // manda para /entrar se não estiver logado; devolve o perfil
    async exigirLogin(papel) {
      var p = null;
      try { p = await api.perfil(); } catch (e) { p = null; }
      if (!p) { location.replace("entrar.html?volta=" + encodeURIComponent(location.pathname.split("/").pop() || "app.html")); return null; }
      if (papel === "admin" && p.papel !== "admin") { location.replace("app.html"); return null; }
      return p;
    }
  };
})();
