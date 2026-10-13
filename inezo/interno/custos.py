"""Custo x margem dos pacotes e planos Inezo (uso interno, não vai para o cliente)."""
H = {"video": 1.5, "ident": 3.0, "pagina": 4.0, "carrossel": 0.5, "post": 0.2, "story": 0.1, "anuncio": 0.4, "relatorio": 1.0}
VOZ = 3.0          # ElevenLabs por vídeo (~2 mil créditos com 4 takes no plano Creator)
IMP = 0.09         # Simples ~6% + taxa de recebimento ~3%
HORA = 50.0        # valor de referência da hora


def calc(nome, preco, itens, alinh, ferram, prog=False, extra=0.0):
    h = sum(H[k] * q for k, q in itens.items()) + alinh
    pecas = sum(q for k, q in itens.items() if k in ("carrossel", "post", "story", "video", "anuncio"))
    if prog:
        h += 0.05 * pecas
    caixa = VOZ * itens.get("video", 0) + ferram + extra + preco * IMP
    lucro = preco - caixa
    return dict(nome=nome, preco=preco, horas=round(h, 1), caixa=round(caixa, 2), lucro=round(lucro, 2),
                hora=round(lucro / h, 1), marg50=round(preco - caixa - h * HORA, 2), pct=round((preco - caixa - h * HORA) / preco * 100))


linhas = [
    calc("Pacote 97 · 1 vídeo", 97, {"video": 1}, 0.5, 10),
    calc("Pacote 297 · identidade + 1 vídeo", 297, {"ident": 1, "video": 1}, 0.5, 10),
    calc("Pacote 497 · identidade + 2 vídeos + página", 497, {"ident": 1, "video": 2, "pagina": 1}, 0.5, 10),
    calc("Plano 597 · 2 reels, 4 carr, 4 posts, 12 stories", 597, {"video": 2, "carrossel": 4, "post": 4, "story": 12}, 1.5, 60, True),
    calc("Plano 797 · 1 anúncio, 3 reels, 6 carr, 4 posts, 20 stories", 797, {"anuncio": 1, "video": 3, "carrossel": 6, "post": 4, "story": 20}, 1.5, 60, True),
    calc("Plano 997 · 2 anúncios, 4 reels, 8 carr, 4 posts, 30 stories, relatório", 997, {"anuncio": 2, "video": 4, "carrossel": 8, "post": 4, "story": 30, "relatorio": 1}, 1.5, 60, True),
]
print("| Item | Preço | Horas | Custo em dinheiro | Sobra (sem contar seu tempo) | R$/hora | Lucro c/ hora a R$50 | Margem |")
print("|---|---|---|---|---|---|---|---|")
for l in linhas:
    print(f"| {l['nome']} | R$ {l['preco']} | {l['horas']} h | R$ {l['caixa']:.0f} | R$ {l['lucro']:.0f} | R$ {l['hora']:.0f}/h | R$ {l['marg50']:.0f} | {l['pct']}% |")
