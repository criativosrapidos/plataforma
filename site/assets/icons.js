// Ícones de traço (24x24) usados no app e no painel. CR.ic("nome") devolve o <svg>.
(function () {
  var P = {
    home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
    grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
    cal: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
    users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7.5M22 21a7 7 0 0 0-5-6.7",
    check: "M5 12l5 5 9-10",
    down: "M12 4v11M7 10l5 5 5-5M5 20h14",
    up: "M12 20V9M7 14l5-5 5 5M5 4h14",
    copy: "M9 9h11v11H9zM5 15H4V4h11v1",
    edit: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
    x: "M6 6l12 12M18 6 6 18",
    left: "M15 6l-6 6 6 6",
    right: "M9 6l6 6-6 6",
    chat: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z",
    out: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
    phone: "M8 3h8v18H8zM11 18h2",
    info: "M12 8v5M12 16h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
    file: "M6 3h8l4 4v14H6zM14 3v4h4",
    inbox: "M4 4h16v12H4zM4 13h5l1 3h4l1-3h5",
    target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
    chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
    send: "M4 12 20 4l-6 16-3-7z",
    trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
    ext: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"
  };
  function ic(nome, cls) {
    var ns = "http://www.w3.org/2000/svg", s = document.createElementNS(ns, "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("class", "i" + (cls ? " " + cls : "")); s.setAttribute("aria-hidden", "true");
    var p = document.createElementNS(ns, "path"); p.setAttribute("d", P[nome] || P.info); s.appendChild(p);
    return s;
  }
  function play() {
    var d = document.createElement("span"); d.className = "play";
    d.innerHTML = '<span><svg viewBox="0 0 24 24"><path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z"/></svg></span>';
    return d;
  }
  window.CR = window.CR || {};
  window.CR.ic = ic;
  window.CR.playIcon = play;
})();
