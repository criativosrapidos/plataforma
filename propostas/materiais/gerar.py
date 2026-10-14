"""Gera os 4 e-books bônus da Criativos Rápidos (HTML -> PDF A4).

Uso: python3 gerar.py   (precisa do Playwright/Chromium e do pdfunite)
"""
import base64, html, json, os, subprocess, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
ICONE = base64.b64encode(open(os.path.join(AQUI, '..', 'proposta-generica', 'assets', 'logo-icone.png'), 'rb').read()).decode()
e = html.escape

CSS = """
@page { size: A4; margin: 22mm 18mm 20mm; }
@page :first { margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; font-family: "Inter", sans-serif; color: #15171B; font-size: 10.5pt; line-height: 1.55; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
h1, h2, h3, .mont { font-family: "Montserrat", sans-serif; }
.cover { width: 210mm; height: 297mm; background: #101216; color: #fff; padding: 26mm 20mm 22mm; display: flex; flex-direction: column; break-after: page; position: relative; overflow: hidden; }
.cover .logo { display: flex; align-items: center; gap: 4mm; }
.cover .logo img { width: 14mm; height: 14mm; }
.cover .logo div { font-size: 13pt; line-height: 1.02; letter-spacing: -.02em; }
.cover .logo b { display: block; font-weight: 500; }
.cover .logo b + b { font-weight: 800; font-style: italic; }
.cover .tag { margin-top: auto; align-self: flex-start; background: #FFD400; color: #101216; font-weight: 800; font-size: 9pt; letter-spacing: .16em; text-transform: uppercase; padding: 2.4mm 4.5mm; border-radius: 99px; }
.cover h1 { font-weight: 900; font-size: 44pt; line-height: 1; letter-spacing: -.02em; margin: 7mm 0 6mm; }
.cover h1 em { font-style: italic; color: #FFD400; }
.cover p { font-size: 14pt; color: #C9CBD2; max-width: 150mm; margin: 0; line-height: 1.45; }
.cover .band { position: absolute; right: -30mm; top: 40mm; width: 120mm; height: 120mm; border-radius: 26mm; background: #FFD400; transform: rotate(14deg); }
.cover .band svg { position: absolute; left: 22mm; top: 30mm; width: 70mm; transform: rotate(-14deg); }
.cover .foot { margin-top: 14mm; padding-top: 6mm; border-top: 1px solid #2C3038; display: flex; justify-content: space-between; font-size: 9pt; color: #A2A4AC; }

.intro { background: #FFF7CC; border-radius: 4mm; padding: 6mm 7mm; margin-bottom: 8mm; font-size: 11pt; }
.intro b { font-weight: 800; }
h2 { font-weight: 900; font-size: 19pt; line-height: 1.1; letter-spacing: -.01em; margin: 10mm 0 4mm; display: flex; align-items: center; gap: 3.5mm; break-after: avoid; }
h2 .n { flex: none; width: 10mm; height: 10mm; border-radius: 2.6mm; background: #FFD400; color: #101216; display: grid; place-items: center; font-size: 12pt; }
h3 { font-weight: 800; font-size: 12.5pt; margin: 6mm 0 2mm; break-after: avoid; }
p { margin: 0 0 3mm; }
ul.list { margin: 0 0 4mm; padding-left: 0; list-style: none; }
ul.list li { padding-left: 6mm; position: relative; margin-bottom: 1.8mm; }
ul.list li::before { content: ""; position: absolute; left: 0; top: 2.1mm; width: 2.4mm; height: 2.4mm; border-radius: 50%; background: #FFD400; border: 1px solid #101216; }
ul.check { list-style: none; padding: 0; margin: 0 0 4mm; }
ul.check li { padding-left: 8mm; position: relative; margin-bottom: 2.4mm; }
ul.check li::before { content: ""; position: absolute; left: 0; top: .6mm; width: 4.6mm; height: 4.6mm; border-radius: 1.2mm; border: 1.6px solid #101216; }
.tip { border: 1.5px solid #101216; border-radius: 4mm; padding: 4.5mm 6mm; margin: 4mm 0 5mm; break-inside: avoid; }
.tip b.t { display: inline-block; background: #101216; color: #FFD400; font-size: 8pt; letter-spacing: .14em; text-transform: uppercase; padding: 1mm 2.6mm; border-radius: 99px; margin-bottom: 2mm; }
.ex { background: #F4F3EE; border-radius: 4mm; padding: 4.5mm 6mm; margin: 3mm 0 5mm; break-inside: avoid; }
.ex .lbl { font-size: 8pt; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: #64666E; margin-bottom: 1.5mm; }
.ex .txt { white-space: pre-line; }
table { width: 100%; border-collapse: collapse; margin: 3mm 0 6mm; font-size: 9.5pt; }
th { background: #101216; color: #fff; text-align: left; padding: 2.6mm 3mm; font-weight: 700; }
td { border-bottom: 1px solid #E4E2D9; padding: 2.6mm 3mm; vertical-align: top; }
tr { break-inside: avoid; }
td.d { font-family: "Montserrat"; font-weight: 900; width: 12mm; }
.msg { border: 1px solid #E4E2D9; border-radius: 4mm; margin: 0 0 4mm; break-inside: avoid; overflow: hidden; }
.msg .h { background: #101216; color: #fff; padding: 2.4mm 5mm; font-weight: 700; font-size: 9.5pt; display: flex; justify-content: space-between; }
.msg .h span { color: #FFD400; font-weight: 800; }
.msg .b { padding: 4mm 5mm; white-space: pre-line; background: #fff; }
.msg .b + .b { border-top: 1px dashed #E4E2D9; }
.story { display: grid; grid-template-columns: 16mm 1fr; gap: 4mm; border: 1px solid #E4E2D9; border-radius: 4mm; padding: 4mm; margin-bottom: 3mm; break-inside: avoid; }
.story .s { background: #101216; color: #FFD400; border-radius: 3mm; display: grid; place-items: center; font-family: "Montserrat"; font-weight: 900; font-size: 13pt; aspect-ratio: 9/16; }
.story b { font-weight: 800; }
.story .meta { font-size: 9pt; color: #64666E; margin-top: 1.4mm; }
.end { margin-top: 10mm; background: #101216; color: #fff; border-radius: 5mm; padding: 8mm; break-inside: avoid; }
.end h3 { color: #FFD400; margin-top: 0; font-size: 15pt; }
.page-break { break-before: page; }
.keep { break-inside: avoid; }
.end ul.check li::before { border-color: #FFD400; }
"""

PLAY = '<svg viewBox="0 0 100 74" fill="#101216"><rect x="14" y="15.6" width="19" height="7" rx="3.5"/><rect x="6.5" y="33.5" width="26.5" height="7" rx="3.5"/><rect x="19" y="51.3" width="14" height="7" rx="3.5"/><path d="M40.5 9.5c0-2.6 2.8-4.2 5-2.9l44.6 26.5c2.2 1.3 2.2 4.5 0 5.8L45.5 65.4c-2.2 1.3-5-.3-5-2.9z"/></svg>'


def cover(tag, titulo_html, sub):
    return f"""<section class="cover"><div class="band">{PLAY}</div>
<div class="logo"><img src="data:image/png;base64,{ICONE}" alt=""><div><b>criativos</b><b>rápidos</b></div></div>
<span class="tag">{e(tag)}</span><h1>{titulo_html}</h1><p>{e(sub)}</p>
<div class="foot"><span>Material exclusivo para clientes</span><span>criativos rápidos</span></div></section>"""


def doc(titulo, capa, corpo):
    if isinstance(corpo, list):
        out, i = [], 0
        while i < len(corpo):
            if corpo[i].startswith(('<h2', '<h3')) and i + 1 < len(corpo) and not corpo[i + 1].startswith('<table'):
                out.append('<div class="keep">' + corpo[i] + corpo[i + 1] + '</div>'); i += 2
            else:
                out.append(corpo[i]); i += 1
        corpo = ''.join(out)
    return f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>{e(titulo)}</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;1,800&display=swap" rel="stylesheet">
<style>{CSS}</style></head><body>{capa}<main>{corpo}</main></body></html>"""


def h2(n, t):
    return f'<h2><span class="n">{n}</span>{e(t)}</h2>'


def lista(itens, cls='list'):
    return f'<ul class="{cls}">' + ''.join(f'<li>{i}</li>' for i in itens) + '</ul>'


def tip(t, txt):
    return f'<div class="tip"><b class="t">{e(t)}</b><div>{txt}</div></div>'


def ex(lbl, txt):
    return f'<div class="ex"><div class="lbl">{e(lbl)}</div><div class="txt">{e(txt)}</div></div>'


# ---------------------------------------------------------------- 1. Boas práticas
def ebook_boas_praticas():
    c = []
    c.append('<div class="intro">Seu Instagram é a vitrine do seu negócio. Quem chega no perfil decide em poucos segundos se confia em você e se vai chamar no WhatsApp. Este guia mostra, passo a passo, como deixar o perfil pronto para vender. <b>Use o checklist do final toda semana.</b></div>')
    c.append(h2(1, 'Nome e @: deixe fácil de achar'))
    c.append('<p>O campo <b>Nome</b> aparece na busca do Instagram. Coloque o nome da empresa e o que você faz. O <b>@</b> deve ser curto e fácil de digitar.</p>')
    c.append(ex('Exemplos de nome', 'Doce da Ana | Bolos em Brasília\nStudio Bela | Sobrancelha e Cílios\nCasa Forte | Reformas e Construção'))
    c.append(lista(['Evite números, pontos e underlines no @ quando puder.', 'Use o mesmo @ em todas as redes e no cartão de visita.', 'Não mude o @ toda hora: quem já te segue se perde.']))
    c.append(h2(2, 'Bio que vende em 4 linhas'))
    c.append('<p>Se a pessoa ler sua bio e não entender o que você vende, ela vai embora. Use esta fórmula:</p>')
    c.append(lista(['<b>Linha 1:</b> o que você faz e para quem.', '<b>Linha 2:</b> seu diferencial ou uma prova (anos de experiência, clientes atendidos).', '<b>Linha 3:</b> onde e como atende (cidade, delivery, online).', '<b>Linha 4:</b> chamada para ação apontando para o link.']))
    c.append(ex('Exemplo · confeitaria', 'Bolos de festa e doces finos para aniversários 🎂\n+ de 2.000 encomendas entregues\nBrasília · entrega em todo o DF\nEncomende pelo WhatsApp 👇'))
    c.append(ex('Exemplo · prestador de serviço', 'Reformas completas com engenheiro responsável\nProjeto, obra e acompanhamento do início ao fim\nAtendemos Brasília e entorno\nPeça seu orçamento grátis 👇'))
    c.append(h2(3, 'Foto de perfil'))
    c.append(lista(['Use o <b>logo</b> (se for empresa) ou o <b>seu rosto</b> (se você é a marca).', 'Teste em tamanho pequeno: se não dá para ler, simplifique.', 'Fundo de uma cor só, que contraste com o logo.', 'Mantenha a mesma foto no WhatsApp Business.']))
    c.append(h2(4, 'Destaques: o "site" do seu Instagram'))
    c.append('<p>Os destaques respondem as perguntas antes de o cliente chamar. Comece com estes cinco:</p>')
    c.append('<table><tr><th>Destaque</th><th>O que colocar</th></tr>'
             '<tr><td><b>Comece aqui</b></td><td>Quem você é, há quanto tempo atua e o que vende.</td></tr>'
             '<tr><td><b>Serviços / Cardápio</b></td><td>Cada produto ou serviço com foto e uma frase.</td></tr>'
             '<tr><td><b>Clientes</b></td><td>Prints de elogios, avaliações e fotos de clientes.</td></tr>'
             '<tr><td><b>Resultados</b></td><td>Antes e depois, entregas, bastidores do trabalho.</td></tr>'
             '<tr><td><b>Como comprar</b></td><td>Passo a passo, formas de pagamento, prazo e área de entrega.</td></tr></table>')
    c.append(tip('Dica', 'Use capas iguais em todos os destaques, com as cores da sua marca. O perfil fica organizado e com cara de empresa profissional.'))
    c.append(h2(5, 'Link e WhatsApp'))
    c.append('<p>Coloque no link da bio um atalho direto para o seu WhatsApp, já com uma mensagem pronta. Assim o cliente só aperta "enviar".</p>')
    c.append(ex('Modelo de link', 'https://wa.me/55DDDNUMERO?text=Oi!%20Vi%20seu%20Instagram%20e%20quero%20saber%20mais'))
    c.append(lista(['Ative o botão de contato (WhatsApp) nas configurações do perfil profissional.', 'Teste o link no seu celular antes de publicar.']))
    c.append(h2(6, 'Os 5 formatos e quando usar cada um'))
    c.append('<table><tr><th>Formato</th><th>Para que serve</th><th>Use para</th></tr>'
             '<tr><td><b>Stories</b></td><td>Relacionamento diário com quem já te segue</td><td>Bastidores, enquetes, ofertas do dia</td></tr>'
             '<tr><td><b>Post</b></td><td>Mensagem rápida e direta no feed</td><td>Lançamentos, avisos, frases, promoções</td></tr>'
             '<tr><td><b>Carrossel</b></td><td>Ensinar e ser salvo</td><td>Dicas, passo a passo, comparações</td></tr>'
             '<tr><td><b>Reels</b></td><td>Alcançar quem ainda não te conhece</td><td>Tendências, antes e depois, curiosidades</td></tr>'
             '<tr><td><b>Anúncio</b></td><td>Vender para um público escolhido</td><td>Ofertas, produto principal, captação de contatos</td></tr></table>')
    c.append(h2(7, 'Frequência: constância vence quantidade'))
    c.append(lista(['Poste <b>todo dia</b>, no feed ou nos stories. Um perfil parado passa a impressão de empresa fechada.', 'Stories todos os dias: é ali que o cliente lembra de você.', 'Prefira um ritmo que você consegue manter a um mês cheio seguido de um mês vazio.', 'Programe os posts da semana de uma vez para não depender da inspiração.']))
    c.append(h2(8, 'Legenda que faz o cliente chamar'))
    c.append('<p>Toda legenda boa tem três partes:</p>')
    c.append(lista(['<b>Gancho:</b> a primeira linha, que faz parar de rolar.', '<b>Conteúdo:</b> a informação, a história ou a oferta.', '<b>Chamada:</b> o que você quer que a pessoa faça agora.']))
    c.append(ex('Exemplo', 'Seu bolo de aniversário não precisa ser igual ao de todo mundo. 🎂\n\nAqui cada encomenda é feita do zero, com o tema e o sabor que você escolher. Entregamos em todo o DF, no dia e horário marcados.\n\nQuer garantir a data da sua festa? Chama no WhatsApp do link da bio.'))
    c.append('<h3>10 ganchos para começar uma legenda ou um vídeo</h3>')
    c.append(lista(['"Pare de cometer esse erro com…"', '"Ninguém te conta isso sobre…"', '"3 sinais de que você precisa de…"', '"O que acontece quando você…"', '"Antes e depois de…"', '"Se você mora em [cidade], precisa ver isso."', '"A pergunta que mais recebo é…"', '"Quanto custa, de verdade, fazer…?"', '"Eu não faria isso se fosse você."', '"Salva esse post para não esquecer."']))
    c.append(h2(9, 'Responda rápido'))
    c.append(lista(['Responda directs e comentários no mesmo dia, de preferência na primeira hora.', 'Quem pergunta o preço nos comentários está pronto para comprar: chame no direct.', 'Use mensagens prontas para não perder tempo (veja o material <b>Respostas prontas de vendas</b>).']))
    c.append(h2(10, 'Erros que afastam clientes'))
    c.append(lista(['Bio que não diz o que você vende.', 'Logo ilegível na foto de perfil.', 'Visual diferente em cada post.', 'Perfil sem postar há semanas.', 'Preço "só no direct" e depois demorar para responder.', 'Nenhum depoimento ou prova de clientes.', 'Link quebrado ou que leva para lugar nenhum.', 'Muita foto e nenhuma chamada para ação.']))
    c.append('<div class="end"><h3>Checklist semanal</h3>' + lista(['A bio diz o que eu vendo, para quem e como comprar.', 'O link da bio abre meu WhatsApp com mensagem pronta.', 'Postei todos os dias da semana (feed ou stories).', 'Publiquei pelo menos um carrossel ou reels.', 'Respondi todas as mensagens e comentários.', 'Adicionei um depoimento novo aos destaques.', 'Fiz pelo menos uma chamada clara para comprar.'], 'check') + '</div>')
    return doc('Boas práticas do Instagram', cover('Bônus · Pacote Turbo', 'Guia do perfil que <em>vende</em>', 'Boas práticas do Instagram para transformar seguidores em clientes no WhatsApp.'), c)


# ---------------------------------------------------------------- 2. Respostas prontas
def msg(titulo, quando, *textos):
    return f'<div class="msg"><div class="h">{e(titulo)}<span>{e(quando)}</span></div>' + ''.join(f'<div class="b">{e(t)}</div>' for t in textos) + '</div>'


def ebook_respostas():
    c = []
    c.append('<div class="intro">Copie, cole e ajuste. Troque o que está entre <b>[colchetes]</b> pelas suas informações. Cada situação tem duas versões: use a que combina mais com o seu jeito de falar. <b>Regra de ouro: responda rápido e sempre termine com uma pergunta.</b></div>')
    c.append(h2(1, 'Primeiro contato'))
    c.append(msg('Boas-vindas', 'cliente mandou "oi"', 'Oi, [nome]! Tudo bem? Aqui é [seu nome], da [empresa]. 😊\nMe conta: o que você está procurando hoje?', 'Olá, [nome]! Que bom te ver por aqui. Você quer saber sobre [produto/serviço] ou tem outra dúvida? Posso te ajudar!'))
    c.append(msg('Fora do horário', 'mensagem automática', 'Oi! Recebemos sua mensagem. 🙌\nNosso atendimento é de [dias], das [hora] às [hora]. Assim que voltarmos, a gente te responde. Se quiser, já me conta o que você precisa!', 'Olá! No momento estamos fora do horário, mas sua mensagem está guardada. Amanhã cedo eu te respondo. Até já!'))
    c.append(h2(2, 'Quando perguntam o preço'))
    c.append(msg('"Quanto custa?"', 'antes de passar o valor', 'Claro, [nome]! Pra eu te passar o valor certinho, me conta rapidinho: [pergunta 1, ex.: é para quantas pessoas?] e [pergunta 2, ex.: para qual data?]', 'Te passo agora! Só pra eu indicar a melhor opção: você precisa de [opção A] ou de [opção B]?'))
    c.append(msg('Apresentando o valor', 'mostre o que está incluso', 'Perfeito! Para o que você precisa, fica assim:\n✅ [item 1]\n✅ [item 2]\n✅ [item 3]\nInvestimento: R$ [valor], e dá para parcelar no cartão.\nQuer que eu já reserve para você?', 'Para [necessidade do cliente], o valor é R$ [valor]. Isso inclui [principal benefício] e [segundo benefício]. Posso separar a sua data?'))
    c.append(h2(3, 'Objeções'))
    c.append(msg('"Tá caro"', 'não baixe o preço de cara', 'Entendo, [nome]. Posso te explicar o que está incluso nesse valor? [Benefício 1] e [benefício 2] fazem muita diferença no resultado. E dá para parcelar no cartão para ficar mais leve.', 'Faz sentido você comparar. O que mais pesa pra você: o valor total ou a parcela? Se for a parcela, consigo dividir em até [número]x.'))
    c.append(msg('"Vou pensar"', 'descubra a dúvida real', 'Claro, fica à vontade! Só pra eu te ajudar melhor: ficou alguma dúvida sobre [produto/serviço], sobre o valor ou sobre o prazo?', 'Sem problema! Só te aviso que [a agenda / o estoque] dessa semana está acabando. Quer que eu segure até amanhã para você?'))
    c.append(msg('"Vou falar com meu sócio / marido / esposa"', 'facilite a conversa', 'Ótimo! Quer que eu te mande um resumo rapidinho com valor e o que está incluso, pra facilitar a conversa?', 'Perfeito. Se ajudar, posso fazer uma ligação rápida com vocês dois para tirar as dúvidas. Qual horário fica bom?'))
    c.append(msg('"Faz desconto?"', 'troque desconto por condição', 'O valor já está bem ajustado, mas consigo [condição: parcelar em mais vezes / incluir um bônus] se fecharmos hoje. Fica bom pra você?', 'Para pagamento à vista no Pix, consigo [X]% de desconto. No cartão, divido em até [número]x. Qual prefere?'))
    c.append(h2(4, 'Quando o cliente some'))
    c.append(msg('Lembrete 1', '24 horas depois', 'Oi, [nome]! Passando pra saber se ficou alguma dúvida sobre [produto/serviço]. Estou por aqui! 😊'))
    c.append(msg('Lembrete 2', '3 dias depois', '[Nome], separei aqui [um exemplo / um depoimento de cliente] parecido com o que você precisa. Dá uma olhada! Se quiser seguir, é só me falar.'))
    c.append(msg('Lembrete 3', '7 dias depois, encerramento', 'Oi, [nome]! Vou encerrar seu atendimento por aqui para não te incomodar. Quando quiser retomar, é só mandar um "oi" que eu te atendo na hora. Obrigado pelo contato! 🙏'))
    c.append(h2(5, 'Fechamento e pós-venda'))
    c.append(msg('Fechando a venda', 'cliente disse sim', 'Que ótimo, [nome]! 🎉 Para confirmar, me passa:\n• Nome completo\n• [endereço / data / outra informação]\nO pagamento pode ser no Pix ou no cartão em até [número]x. Qual prefere?'))
    c.append(msg('Confirmação', 'depois do pagamento', 'Pagamento confirmado! ✅ Seu pedido está garantido para [data]. Qualquer dúvida, é só me chamar por aqui. Obrigado pela confiança!'))
    c.append(msg('Pedindo avaliação', 'alguns dias depois da entrega', 'Oi, [nome]! Espero que tenha gostado de [produto/serviço]. Se puder, me conta o que achou? Sua opinião ajuda muito outras pessoas a conhecerem a gente. 💛'))
    c.append(msg('Pedindo indicação', 'cliente satisfeito', 'Fico muito feliz que você gostou! Se tiver algum amigo que também precise de [produto/serviço], pode me indicar. Quem vier por você ganha [benefício], e você também!'))
    c.append(msg('Reativando cliente antigo', 'cliente que comprou há meses', 'Oi, [nome]! Faz tempo, né? Lembrei de você porque chegou [novidade / promoção]. Quer que eu te mande os detalhes?'))
    c.append(h2(6, 'Comentários no Instagram'))
    c.append(msg('Pediram preço no comentário', 'responda em público e chame no direct', 'Oi, [nome]! Te mandei todas as informações no direct. 😊', 'Que bom que gostou! Acabei de te chamar no direct com os valores.'))
    c.append(tip('Lembre', 'Mensagem pronta é um ponto de partida. Leia o que o cliente escreveu e ajuste. Quem se sente atendido por uma pessoa de verdade compra mais.'))
    return doc('Respostas prontas de vendas', cover('Bônus · Pacote Turbo', 'Respostas <em>prontas</em> de vendas', 'Mensagens para copiar e colar no WhatsApp e no direct, do primeiro "oi" ao pós-venda.'), c)


# ---------------------------------------------------------------- 3. Calendário humanizado
DIAS = [
    ('Bastidores', 'Mostre o começo do seu dia de trabalho.', '"Bom dia! Olha como começa o dia aqui na [empresa]…"'),
    ('Ensine algo', 'Uma dica rápida da sua área em até 15 segundos.', '"Uma coisa que pouca gente sabe sobre [assunto]…"'),
    ('Cliente', 'Mostre um elogio ou uma entrega feita para um cliente.', '"Olha o que a [cliente] mandou pra gente hoje!"'),
    ('Pessoal', 'Conte por que você começou o seu negócio.', '"Muita gente me pergunta como tudo começou…"'),
    ('Produto', 'Apresente seu produto ou serviço principal.', '"Esse aqui é o queridinho dos clientes. Deixa eu te mostrar…"'),
    ('Rotina leve', 'Algo do seu sábado: café, equipe, preparação.', '"Sábado também é dia de [atividade] por aqui!"'),
    ('Pergunta', 'Abra a caixinha de perguntas.', '"Me pergunta qualquer coisa sobre [assunto]!"'),
    ('Bastidores', 'Mostre uma ferramenta ou material que você usa.', '"Sem isso aqui eu não trabalho…"'),
    ('Ensine algo', 'Responda uma pergunta da caixinha de ontem.', '"A [nome] perguntou… e a resposta é…"'),
    ('Cliente', 'Mostre um antes e depois.', '"Antes… e depois! O que você achou?"'),
    ('Pessoal', 'Um erro que você cometeu no começo e o que aprendeu.', '"No começo eu errava muito nisso…"'),
    ('Produto', 'Mostre como o produto é feito ou o serviço é entregue.', '"Quer ver como a gente prepara o seu pedido?"'),
    ('Rotina leve', 'Apresente alguém da equipe ou um parceiro.', '"Essa aqui é a [nome], que cuida de…"'),
    ('Pergunta', 'Faça uma enquete: qual opção eles preferem.', '"Me ajuda a escolher: A ou B?"'),
    ('Bastidores', 'Mostre a organização dos pedidos da semana.', '"Semana cheia por aqui! Olha quantos pedidos…"'),
    ('Ensine algo', 'Três dicas rápidas em sequência.', '"Três coisas que você precisa saber antes de…"'),
    ('Cliente', 'Grave o momento de uma entrega.', '"Entregando mais um pedido com muito carinho!"'),
    ('Pessoal', 'Fale de um valor do seu negócio (qualidade, pontualidade).', '"Aqui a gente não abre mão de…"'),
    ('Produto', 'Faça uma oferta com prazo: só hoje ou só esta semana.', '"Só até domingo: [oferta]. Chama no direct!"'),
    ('Rotina leve', 'Um momento descontraído do trabalho.', '"Nem tudo é correria por aqui… 😂"'),
    ('Pergunta', 'Teste: "quanto você acha que custa?"', '"Chuta: quanto custa esse [produto]?"'),
    ('Bastidores', 'Mostre um pedido especial ou difícil sendo feito.', '"Esse pedido foi um desafio! Olha só…"'),
    ('Ensine algo', 'Desfaça um mito da sua área.', '"Mito ou verdade: [afirmação]?"'),
    ('Cliente', 'Leia em voz alta uma avaliação de cliente.', '"Vou ler pra vocês o que recebi hoje…"'),
    ('Pessoal', 'Conte uma meta sua para o mês.', '"Minha meta para este mês é…"'),
    ('Produto', 'Compare duas opções do que você vende.', '"Qual é a diferença entre [A] e [B]? Te explico."'),
    ('Rotina leve', 'Mostre o fim de um dia produtivo.', '"Fim de expediente! Hoje foi assim…"'),
    ('Pergunta', 'Pergunte o que eles querem ver nos próximos stories.', '"O que vocês querem ver por aqui?"'),
    ('Bastidores', 'Resumo do mês: o que deu certo.', '"Esse mês a gente conquistou…"'),
    ('Produto', 'Chamada para o próximo mês: agenda aberta.', '"A agenda de [mês] está aberta. Garanta a sua!"'),
]


def ebook_calendario():
    c = []
    c.append('<div class="intro">As pessoas compram de pessoas. Quando você aparece nos stories, o cliente conhece quem está por trás da marca e passa a confiar. Este calendário traz <b>uma ideia por dia durante 30 dias</b>. Você só precisa pegar o celular e gravar.</div>')
    c.append(h2(1, 'Antes de gravar: 5 regras simples'))
    c.append(lista(['<b>Celular em pé</b> (vertical) e câmera na altura dos olhos.', '<b>Luz de frente:</b> fique de frente para a janela, nunca de costas.', '<b>Vídeos curtos:</b> até 15 segundos por story. Se precisar de mais, grave em partes.', '<b>Comece falando:</b> nada de "oi, gente, tudo bem?" longo. Vá direto ao assunto.', '<b>Termine com uma ação:</b> "me chama no direct", "responde a enquete", "clica no link".']))
    c.append(tip('Não gosta de aparecer?', 'Comece mostrando só as mãos, o produto ou o ambiente, com a sua voz. Com o tempo, fica natural aparecer.'))
    c.append(h2(2, 'O ritmo da semana'))
    c.append('<table><tr><th>Dia</th><th>Tema</th><th>Por que funciona</th></tr>'
             '<tr><td><b>Segunda</b></td><td>Bastidores</td><td>Mostra que existe trabalho de verdade por trás</td></tr>'
             '<tr><td><b>Terça</b></td><td>Ensine algo</td><td>Faz você ser visto como especialista</td></tr>'
             '<tr><td><b>Quarta</b></td><td>Cliente</td><td>Prova social: outros já compraram e gostaram</td></tr>'
             '<tr><td><b>Quinta</b></td><td>Pessoal</td><td>Cria conexão com a sua história</td></tr>'
             '<tr><td><b>Sexta</b></td><td>Produto</td><td>Hora de mostrar e vender</td></tr>'
             '<tr><td><b>Sábado</b></td><td>Rotina leve</td><td>Deixa a marca mais humana e próxima</td></tr>'
             '<tr><td><b>Domingo</b></td><td>Pergunta</td><td>Gera conversa e ideias para a semana</td></tr></table>')
    c.append('<div class="page-break"></div>')
    c.append(h2(3, 'Seus 30 dias de stories'))
    rows = ''.join(f'<tr><td class="d">{i+1}</td><td><b>{e(t)}</b></td><td>{e(o)}</td><td><i>{e(f)}</i></td></tr>' for i, (t, o, f) in enumerate(DIAS))
    c.append(f'<table><tr><th>Dia</th><th>Tema</th><th>O que gravar</th><th>Frase para começar</th></tr>{rows}</table>')
    c.append('<div class="end"><h3>Como usar este calendário</h3>' + lista(['Marque cada dia gravado. O importante é não parar.', 'Pulou um dia? Siga do próximo, sem culpa.', 'No fim do mês, veja quais temas tiveram mais respostas e repita.', 'Mande para a gente os vídeos que você gravou: usamos nos seus conteúdos.']) + '</div>')
    return doc('Calendário de conteúdo humanizado', cover('Bônus · Plano Autoridade', '30 dias de stories <em>humanizados</em>', 'Uma ideia por dia para você aparecer, mostrar bastidores e criar confiança com seus clientes.'), c)


# ---------------------------------------------------------------- 4. Sequência de stories
SEQS = [
    ('Venda direta', 'Para vender um produto ou serviço específico em um dia.', [
        ('Gancho', 'Você falando para a câmera.', '"Se você [problema do cliente], fica até o final desses stories."', 'Nenhuma: deixe a tela limpa.'),
        ('Problema', 'Mostre a dor que o cliente sente.', '"Sabe quando [situação ruim]? Eu sei como é chato."', 'Enquete "Já passou por isso? Sim / Muito"'),
        ('Virada', 'Conte como você resolve isso.', '"Foi por isso que eu criei [produto/serviço]."', 'Nenhuma'),
        ('Produto', 'Mostre o produto ou o serviço sendo feito.', '"Olha como funciona: [explicação rápida]."', 'Nenhuma'),
        ('Prova', 'Print de elogio ou antes e depois.', '"E não sou eu que estou dizendo. Olha o que a [cliente] falou."', 'Figurinha de reação'),
        ('Oferta', 'Valor e condição, com prazo.', '"Até [prazo], sai por R$ [valor], em até [número]x."', 'Contagem regressiva'),
        ('Chamada', 'Você apontando para o link.', '"Clica aqui e me chama no WhatsApp para garantir o seu."', 'Figurinha de link para o WhatsApp'),
    ]),
    ('Caixinha que vende', 'Para tirar dúvidas e quebrar objeções antes da compra.', [
        ('Convite', 'Abra a caixinha de perguntas.', '"Pergunta tudo o que você quiser sobre [produto/serviço]."', 'Caixinha de perguntas'),
        ('Resposta 1', 'Responda a dúvida mais comum.', '"A pergunta campeã foi… e a resposta é…"', 'Resposta da caixinha'),
        ('Resposta 2', 'Responda uma dúvida sobre preço ou prazo.', '"Muita gente perguntou do valor. Funciona assim…"', 'Resposta da caixinha'),
        ('Resposta 3', 'Responda uma objeção ("será que funciona pra mim?").', '"Funciona sim, olha esse caso…"', 'Resposta da caixinha'),
        ('Chamada', 'Convide para comprar.', '"Ficou alguma dúvida? Me chama no direct que eu te atendo agora."', 'Figurinha de link'),
    ]),
    ('Bastidores que geram desejo', 'Para mostrar o cuidado do seu trabalho e despertar vontade.', [
        ('Abertura', 'O começo do processo.', '"Hoje eu vou te mostrar como nasce um [produto]."', 'Enquete "Quer ver? Sim / Claro"'),
        ('Processo', 'Uma etapa importante.', '"Aqui está o segredo: [detalhe do processo]."', 'Nenhuma'),
        ('Detalhe', 'Um close no acabamento.', '"Repara nesse detalhe…"', 'Figurinha de emoji deslizante'),
        ('Resultado', 'O produto pronto.', '"E esse é o resultado final!"', 'Nenhuma'),
        ('Chamada', 'Convite para encomendar.', '"Quer um igual? A agenda desta semana está aberta."', 'Figurinha de link'),
    ]),
    ('Prova social', 'Para mostrar que outras pessoas já compraram e gostaram.', [
        ('Abertura', 'Você comentando os elogios da semana.', '"Essa semana eu recebi umas mensagens que me emocionaram…"', 'Nenhuma'),
        ('Depoimento 1', 'Print de mensagem de cliente.', '"Olha o que a [cliente] mandou."', 'Figurinha de coração'),
        ('Depoimento 2', 'Foto ou vídeo do cliente com o produto.', '"E esse aqui é o [cliente] usando [produto]."', 'Nenhuma'),
        ('Números', 'Quantos clientes, anos ou entregas.', '"Já são [número] clientes atendidos."', 'Nenhuma'),
        ('Chamada', 'Convide para ser o próximo.', '"Quer ser o próximo? Me chama."', 'Figurinha de link'),
    ]),
    ('Oferta relâmpago (24 horas)', 'Para gerar vendas rápidas em um dia mais fraco.', [
        ('Aviso', 'Tela com texto grande.', '"Atenção: oferta só até meia-noite!"', 'Contagem regressiva'),
        ('Produto', 'Mostre o que está em oferta.', '"Hoje o [produto] está com condição especial."', 'Nenhuma'),
        ('Condição', 'Valor de/por e parcelamento.', '"De R$ [valor] por R$ [valor], em até [número]x."', 'Nenhuma'),
        ('Prova', 'Um elogio de cliente sobre esse produto.', '"Quem comprou aprovou!"', 'Figurinha de reação'),
        ('Lembrete', 'Horas depois, lembre o prazo.', '"Faltam só [horas] horas!"', 'Contagem regressiva'),
        ('Última chamada', 'Antes de encerrar.', '"Última chance. Depois volta ao preço normal."', 'Figurinha de link'),
    ]),
]


def ebook_sequencias():
    c = []
    c.append('<div class="intro">Um story sozinho chama atenção. Uma <b>sequência</b> de stories leva o seguidor, passo a passo, até a compra. Aqui estão 5 sequências prontas: siga a ordem, adapte o texto e poste tudo no mesmo dia.</div>')
    c.append(h2('★', 'Como usar as sequências'))
    c.append(lista(['Poste os stories em sequência, no mesmo dia, com poucos minutos entre eles.', 'Use texto grande e curto: a pessoa lê em 2 ou 3 segundos.', 'Coloque uma figurinha de interação (enquete, caixinha, reação) no começo: quem interage vê o resto.', 'Termine sempre com o link para o WhatsApp.', 'Use uma sequência de venda por semana e alterne com o calendário humanizado.']))
    for i, (nome, quando, stories) in enumerate(SEQS, 1):
        c.append('<div class="page-break"></div>' if i > 1 else '')
        c.append(h2(i, f'Sequência {nome}'))
        c.append(f'<p><b>Quando usar:</b> {e(quando)}</p>')
        for j, (obj, mostra, texto, fig) in enumerate(stories, 1):
            c.append(f'<div class="story"><div class="s">{j}</div><div><b>{e(obj)}</b> · {e(mostra)}<div style="margin-top:1.4mm">{e(texto)}</div><div class="meta">Figurinha: {e(fig)}</div></div></div>')
    c.append('<div class="end"><h3>Dica final</h3><p style="margin:0">Salve as sequências que mais venderam nos destaques. Elas continuam vendendo para quem chega no seu perfil depois.</p></div>')
    return doc('Sequência de stories que vende', cover('Bônus · Plano Autoridade', 'Sequência de stories que <em>vende</em>', '5 roteiros prontos de stories em sequência para levar o seguidor até a compra.'), c)


EBOOKS = [
    ('guia-perfil-que-vende', ebook_boas_praticas, 'Guia do perfil que vende'),
    ('respostas-prontas-de-vendas', ebook_respostas, 'Respostas prontas de vendas'),
    ('calendario-stories-humanizados', ebook_calendario, 'Calendário humanizado'),
    ('sequencia-de-stories-que-vende', ebook_sequencias, 'Sequência de stories'),
]

RENDER = r"""
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const jobs = JSON.parse(process.argv[2]);
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const j of jobs) {
    await p.goto('file://' + j.html, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.pdf({ path: j.pdf + '.capa.pdf', format: 'A4', printBackground: true, pageRanges: '1', preferCSSPageSize: true });
    await p.evaluate(() => { document.querySelector('.cover').remove(); const st = document.createElement('style'); st.textContent = '@page :first { margin: 22mm 18mm 20mm; }'; document.head.appendChild(st); });
    const foot = `<div style="width:100%;font-family:Inter,Arial;font-size:8px;color:#8a8c93;padding:0 18mm;display:flex;justify-content:space-between"><span>criativos rápidos · ${j.title}</span><span><span class="pageNumber"></span></span></div>`;
    await p.pdf({ path: j.pdf, format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: foot, preferCSSPageSize: true });
  }
  await b.close();
})();
"""

if __name__ == '__main__':
    out = AQUI
    jobs = []
    for slug, fn, title in EBOOKS:
        path = os.path.join(out, slug + '.html')
        open(path, 'w').write(fn())
        jobs.append({'html': path, 'pdf': os.path.join(out, slug + '.pdf'), 'title': title})
    js = os.path.join(out, '.render.cjs')
    open(js, 'w').write(RENDER)
    subprocess.run(['node', js, json.dumps(jobs)], check=True)
    os.remove(js)
    for j in jobs:
        subprocess.run(['pdfunite', j['pdf'] + '.capa.pdf', j['pdf'], j['pdf'] + '.tmp'], check=True)
        os.replace(j['pdf'] + '.tmp', j['pdf']); os.remove(j['pdf'] + '.capa.pdf')
        print(j['pdf'])
