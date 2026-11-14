// Chat de IA do site: a mesma atendente do WhatsApp tira dúvidas, pega o contato e marca a reunião.
// Precisa do core.js antes. A conversa fica guardada só nesta aba (sessionStorage).
(function () {
  if (!window.CR || document.getElementById("crchat")) return;
  var KEY = "cr-chat", hist = [];
  try { hist = JSON.parse(sessionStorage.getItem(KEY)) || []; } catch (e) {}
  function guarda() { try { sessionStorage.setItem(KEY, JSON.stringify(hist.slice(-30))); } catch (e) {} }

  var css = document.createElement("style");
  css.textContent = [
    "#crchat{position:fixed;right:16px;bottom:16px;z-index:70;font-family:Inter,system-ui,sans-serif}",
    "#crchat .bt{width:60px;height:60px;border-radius:50%;border:0;background:#FFD400;color:#101216;box-shadow:0 10px 30px rgba(16,18,22,.25);cursor:pointer;display:grid;place-items:center}",
    "#crchat .bt svg{width:28px;height:28px}",
    "#crchat .pn{position:absolute;right:0;bottom:74px;width:min(360px,calc(100vw - 32px));height:min(520px,calc(100vh - 120px));background:#fff;color:#15171B;border-radius:20px;box-shadow:0 20px 60px rgba(16,18,22,.3);display:flex;flex-direction:column;overflow:hidden}",
    "#crchat .pn[hidden]{display:none}",
    "#crchat .hd{background:#101216;color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px}",
    "#crchat .hd b{display:block;font-size:15px}#crchat .hd span{font-size:12px;color:#C9CAD0}",
    "#crchat .hd button{margin-left:auto;background:none;border:0;color:#fff;font-size:22px;cursor:pointer;line-height:1}",
    "#crchat .ms{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;background:#F4F3EE}",
    "#crchat .m{max-width:85%;padding:9px 12px;border-radius:14px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}",
    "#crchat .m.ia{background:#fff;border:1px solid #E4E2D9;align-self:flex-start}",
    "#crchat .m.eu{background:#FFD400;align-self:flex-end}",
    "#crchat form{display:flex;gap:8px;padding:10px;border-top:1px solid #E4E2D9;background:#fff}",
    "#crchat input{flex:1;min-width:0;border:1.5px solid #E4E2D9;border-radius:12px;padding:10px 12px;font:inherit;font-size:15px}",
    "#crchat form button{border:0;border-radius:12px;background:#101216;color:#fff;font-weight:700;padding:0 14px;cursor:pointer}",
    "#crchat .wa{display:block;text-align:center;font-size:12px;padding:0 0 10px;color:#62656D}"
  ].join("");
  document.head.appendChild(css);

  var raiz = document.createElement("div"); raiz.id = "crchat";
  raiz.innerHTML = '<div class="pn" hidden role="dialog" aria-label="Chat com a Criativos Rápidos">' +
    '<div class="hd"><div><b>Criativos Rápidos</b><span>Assistente virtual · responde na hora</span></div><button type="button" aria-label="Fechar chat">×</button></div>' +
    '<div class="ms" aria-live="polite"></div>' +
    '<form><input type="text" maxlength="1000" placeholder="Escreva sua mensagem" aria-label="Sua mensagem"><button type="submit">Enviar</button></form><a class="wa" target="_blank" rel="noopener" hidden>Prefere WhatsApp? Toque aqui</a></div>' +
    '<button class="bt" type="button" aria-label="Abrir chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg></button>';
  document.body.appendChild(raiz);
  var pn = raiz.querySelector(".pn"), ms = raiz.querySelector(".ms"), inp = raiz.querySelector("input"), wa = raiz.querySelector(".wa");
  if (CR.whats) { var w = CR.whats("Olá! Vim pelo site."); if (w) { wa.href = w; wa.hidden = false; } }

  function bolha(de, texto) { var d = document.createElement("div"); d.className = "m " + (de === "ia" ? "ia" : "eu"); d.textContent = texto; ms.appendChild(d); ms.scrollTop = ms.scrollHeight; return d; }
  function mostra() {
    ms.textContent = "";
    if (!hist.length) bolha("ia", "Oi! 👋 Sou a assistente da Criativos Rápidos. Me conta: qual é o seu negócio?");
    hist.forEach(function (m) { bolha(m.de, m.texto); });
  }
  raiz.querySelector(".bt").addEventListener("click", function () { pn.hidden = !pn.hidden; if (!pn.hidden) { mostra(); inp.focus(); } });
  raiz.querySelector(".hd button").addEventListener("click", function () { pn.hidden = true; });
  raiz.querySelector("form").addEventListener("submit", async function (ev) {
    ev.preventDefault();
    var t = inp.value.trim(); if (!t) return;
    inp.value = ""; hist.push({ de: "visitante", texto: t }); guarda(); bolha("visitante", t);
    var esp = bolha("ia", "digitando…"), btn = this.querySelector("button"); btn.disabled = true;
    try {
      var r = await CR.api.chatSite(hist, location.pathname);
      esp.textContent = r.resposta; hist.push({ de: "ia", texto: r.resposta }); guarda();
    } catch (e) { esp.textContent = e.message || "Não consegui responder agora. Chama a gente no WhatsApp!"; }
    btn.disabled = false; inp.focus();
  });
})();
