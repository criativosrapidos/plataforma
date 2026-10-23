#!/usr/bin/env python3
"""Gera o contrato de prestação de serviços (Plano Autoridade) da Criativos Rápidos em DOCX e PDF."""
import subprocess
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ROOT = Path(__file__).resolve().parent
NOME = "contrato_criativos_rapidos_autoridade"
L = "_" * 48

doc = Document()
for s in doc.sections:
    s.top_margin = s.bottom_margin = s.left_margin = s.right_margin = Cm(2.5)
st = doc.styles["Normal"]
st.font.name = "Arial"
st.font.size = Pt(11)
st.element.rPr.rFonts.set(qn("w:eastAsia"), "Arial")
st.paragraph_format.space_after = Pt(6)
st.paragraph_format.line_spacing = 1.15


def par(texto="", bold=False, align=WD_ALIGN_PARAGRAPH.JUSTIFY, size=None, after=None):
    p = doc.add_paragraph()
    p.alignment = align
    partes = texto.split("**")
    for i, t in enumerate(partes):
        r = p.add_run(t)
        r.bold = bold or i % 2 == 1
        if size:
            r.font.size = Pt(size)
    if after is not None:
        p.paragraph_format.space_after = Pt(after)
    return p


def clausula(titulo):
    p = par(titulo, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, after=4)
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.keep_with_next = True


def sombra(cel, cor):
    tc = cel._tc.get_or_add_tcPr()
    sh = OxmlElement("w:shd")
    sh.set(qn("w:val"), "clear"); sh.set(qn("w:color"), "auto"); sh.set(qn("w:fill"), cor)
    tc.append(sh)


par("CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE SOCIAL MEDIA E GESTÃO DE TRÁFEGO PAGO", bold=True,
    align=WD_ALIGN_PARAGRAPH.CENTER, size=13, after=2)
par("Plano AUTORIDADE · Mensal, sem fidelidade", align=WD_ALIGN_PARAGRAPH.CENTER, size=10, after=14)

clausula("DAS PARTES")
E = WD_ALIGN_PARAGRAPH.LEFT
par("**CONTRATADA:** ANA CLÁUDIA MENDES SILVA, microempreendedora individual (MEI)", align=E, after=0)
par("Nome empresarial: 67.844.754 ANA CLÁUDIA MENDES SILVA · Nome fantasia: **Criativos Rápidos**", align=E, after=0)
par("CNPJ nº 67.844.754/________-___", align=E, after=0)
par("Endereço: ____________________________________________________________", align=E, after=10)
par("**CONTRATANTE:** ____________________________________________ (nome / razão social)", align=E, after=0)
par("CPF/CNPJ nº ______________________________", align=E, after=0)
par("Endereço: ____________________________________________________________", align=E, after=0)
par("E-mail: ______________________________  Telefone: (___) _______________", align=E, after=0)
par("Representante legal (se pessoa jurídica): ______________________________", align=E, after=10)
par("As partes acima identificadas têm entre si justo e acertado o presente Contrato de Prestação de Serviços, "
    "que se regerá pelas cláusulas e condições a seguir.")

clausula("CLÁUSULA PRIMEIRA – DO OBJETO")
par("1.1. O presente contrato tem por objeto a prestação, pela CONTRATADA, de serviços de **social media** "
    "(planejamento, criação, programação e postagem de conteúdos no perfil do Instagram da CONTRATANTE) e de "
    "**gestão de tráfego pago** (criação, configuração e acompanhamento de campanhas de anúncios), conforme o "
    "**Plano AUTORIDADE**, descrito abaixo.")
par("1.2. O Plano AUTORIDADE contempla, a cada ciclo mensal:", after=4)

itens = [("Stories", "30"), ("Posts", "15"), ("Carrosséis", "12"), ("Reels", "9"), ("Anúncios", "4"),
         ("Total de conteúdos no mês", "70")]
tb = doc.add_table(rows=1, cols=2)
tb.style = "Table Grid"
tb.alignment = WD_TABLE_ALIGNMENT.CENTER
h = tb.rows[0].cells
for c, t in zip(h, ("Entregável", "Quantidade / mês")):
    c.text = ""
    r = c.paragraphs[0].add_run(t); r.bold = True; r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    sombra(c, "111111")
for i, (a, b) in enumerate(itens):
    row = tb.add_row().cells
    row[0].text, row[1].text = a, b
    row[1].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    if i == len(itens) - 1:
        for c in row:
            for r in c.paragraphs[0].runs:
                r.bold = True
            sombra(c, "FFE100")
for row in tb.rows:
    row.cells[0].width, row.cells[1].width = Cm(9), Cm(5)
par("", after=2)
par("1.3. Estão incluídos ainda no Plano AUTORIDADE: (a) programação e postagem dos conteúdos pela CONTRATADA, "
    "com **postagem diária**; (b) **relatório mensal** de desempenho; (c) **bônus**: calendário de conteúdo "
    "humanizado e sequência de stories voltada a vendas; (d) até **3 (três) ajustes no mês**, nos termos da "
    "Cláusula Terceira.")
par("1.4. Serviços não previstos nesta cláusula (como produção de fotos/vídeos presenciais, gestão de outras redes "
    "sociais ou ajustes além do limite mensal) poderão ser orçados à parte, mediante acordo prévio entre as partes.")

clausula("CLÁUSULA SEGUNDA – DO BRIEFING E DOS PRAZOS DE ENTREGA")
par("2.1. Os prazos deste contrato começam a contar somente após (i) a confirmação do pagamento e (ii) o envio do "
    "**briefing completo** respondido pela CONTRATANTE, o que ocorrer por último.")
par("2.2. Cumpridas as condições do item 2.1, a CONTRATADA entregará os conteúdos do ciclo para aprovação em até "
    "**24 (vinte e quatro) horas**.")
par("2.3. Aprovados os conteúdos, a CONTRATADA terá até **24 (vinte e quatro) horas** para realizar o agendamento "
    "e iniciar as postagens no perfil da CONTRATANTE.")
par("2.4. A CONTRATANTE deverá aprovar ou solicitar ajustes de forma clara e por escrito (WhatsApp ou e-mail). "
    "Atrasos na aprovação, no envio do briefing, de materiais ou de acessos prorrogam automaticamente os prazos da "
    "CONTRATADA pelo mesmo período, sem qualquer penalidade a ela.")

clausula("CLÁUSULA TERCEIRA – DOS AJUSTES")
par("3.1. A CONTRATANTE terá direito a até **3 (três) ajustes por ciclo mensal**, entendendo-se por ajuste cada "
    "solicitação de alteração (por exemplo, troca de tema, texto ou abordagem de uma ou mais peças).")
par("3.2. Cada ajuste será atendido pela CONTRATADA em até **24 (vinte e quatro) horas** a partir da solicitação. "
    "Após a aprovação, aplica-se o prazo do item 2.3.")
par("3.3. Ajustes que excedam o limite mensal poderão ser orçados à parte. Ajustes não utilizados não são "
    "cumulativos para os meses seguintes.")

clausula("CLÁUSULA QUARTA – DO VALOR E DA FORMA DE PAGAMENTO")
par("4.1. Pelos serviços objeto deste contrato, a CONTRATANTE pagará à CONTRATADA o valor de **R$ 997,00 "
    "(novecentos e noventa e sete reais) mensais**.")
par("4.2. O pagamento deverá ser efetuado **no ato da assinatura** deste contrato e, em caso de renovação, no início "
    "de cada novo ciclo mensal, por uma das formas abaixo:")
par("a) **PIX** – Banco Caixa Econômica Federal, chave: **052-611-99182**, em favor de Ana Cláudia Mendes Silva;")
par("b) **Cartão de crédito** – por link de pagamento InfinitePay enviado pela CONTRATADA, com possibilidade de "
    "parcelamento em até **12 (doze) vezes**, sendo as taxas do parcelamento **repassadas à CONTRATANTE**.")
par("4.3. O valor previsto no item 4.1 **não inclui a verba de anúncios** (investimento pago diretamente às "
    "plataformas, como Meta/Instagram/Facebook e Google), que será definida em comum acordo e paga diretamente "
    "pela CONTRATANTE às plataformas, por meio de seu próprio cartão ou conta de anúncios.")

clausula("CLÁUSULA QUINTA – DA VIGÊNCIA, RENOVAÇÃO E ENCERRAMENTO")
par("5.1. Este contrato vigora pelo prazo de **30 (trinta) dias**, iniciando-se na data de sua assinatura, em "
    "**21/10/2026**, e encerrando-se em **21/11/2026**.")
par("5.2. O contrato **não possui fidelidade**. Ao final de cada ciclo, poderá ser renovado por iguais períodos "
    "mensais mediante o pagamento do novo ciclo, mantidas as mesmas condições, salvo acordo diverso por escrito.")
par("5.3. Qualquer das partes poderá encerrar a relação ao final do ciclo vigente, **sem multa**, mediante aviso por "
    "escrito com antecedência mínima de 5 (cinco) dias do término do ciclo.")
par("5.4. Iniciada a execução do ciclo (com o envio do briefing ou a entrega dos conteúdos), o valor do mês em curso "
    "não será reembolsado, considerando o trabalho já realizado pela CONTRATADA.")
par("5.5. O contrato poderá ser rescindido de imediato em caso de descumprimento de qualquer cláusula, mediante "
    "notificação por escrito à parte infratora.")

clausula("CLÁUSULA SEXTA – DAS OBRIGAÇÕES DA CONTRATADA")
par("6.1. São obrigações da CONTRATADA: (a) executar os serviços com qualidade, zelo e dentro dos prazos previstos; "
    "(b) seguir a identidade visual e as orientações aprovadas pela CONTRATANTE; (c) manter sigilo sobre as "
    "informações, senhas e dados da CONTRATANTE; (d) enviar o relatório mensal de desempenho; (e) comunicar à "
    "CONTRATANTE qualquer fato que possa afetar a execução dos serviços.")

clausula("CLÁUSULA SÉTIMA – DAS OBRIGAÇÕES DA CONTRATANTE")
par("7.1. São obrigações da CONTRATANTE: (a) efetuar o pagamento nas datas e condições acordadas; (b) responder o "
    "briefing de forma completa e verdadeira; (c) fornecer os acessos necessários às contas (Instagram, "
    "Gerenciador de Anúncios e afins), bem como logotipo, fotos, vídeos e demais materiais; (d) aprovar ou solicitar "
    "ajustes dentro dos prazos; (e) manter crédito/verba de anúncios disponível para as campanhas.")
par("7.2. A CONTRATANTE é a única responsável pela veracidade das informações, preços, ofertas e promessas sobre "
    "seus produtos e serviços divulgados, bem como pela titularidade ou autorização de uso dos materiais que "
    "fornecer à CONTRATADA.")

clausula("CLÁUSULA OITAVA – DOS RESULTADOS")
par("8.1. Os serviços de social media e de gestão de tráfego constituem **obrigação de meio**, e não de resultado. "
    "A CONTRATADA empregará as melhores práticas para alcançar bons resultados, mas não garante número específico de "
    "seguidores, alcance, leads ou vendas, que dependem também de fatores externos, como algoritmos e políticas das "
    "plataformas, verba investida, oferta e atendimento da CONTRATANTE.")
par("8.2. A CONTRATADA não se responsabiliza por bloqueios, reprovações de anúncios ou instabilidades decorrentes das "
    "políticas ou falhas das plataformas, comprometendo-se a auxiliar na regularização quando possível.")

clausula("CLÁUSULA NONA – DOS DIREITOS DE USO E DA CONFIDENCIALIDADE")
par("9.1. Após o pagamento, a CONTRATANTE poderá utilizar livremente as peças produzidas no âmbito deste contrato em "
    "seus canais de comunicação.")
par("9.2. A CONTRATADA poderá utilizar as peças produzidas em seu portfólio e em suas redes sociais, salvo oposição "
    "expressa e por escrito da CONTRATANTE.")
par("9.3. As partes comprometem-se a tratar os dados pessoais a que tiverem acesso em conformidade com a Lei Geral de "
    "Proteção de Dados (Lei nº 13.709/2018), utilizando-os exclusivamente para a execução deste contrato, e a manter "
    "sigilo sobre as informações confidenciais da outra parte, mesmo após o seu término.")

clausula("CLÁUSULA DÉCIMA – DAS DISPOSIÇÕES GERAIS")
par("10.1. Este contrato não gera vínculo empregatício, societário ou de exclusividade entre as partes.")
par("10.2. As comunicações entre as partes poderão ser feitas por WhatsApp ou e-mail, que serão considerados meios "
    "válidos de aprovação, solicitação de ajustes e notificação.")
par("10.3. Qualquer alteração deste contrato somente terá validade se feita por escrito e aceita por ambas as partes.")

clausula("CLÁUSULA DÉCIMA PRIMEIRA – DO FORO")
par("11.1. Fica eleito o foro da Circunscrição Judiciária de **Brasília/DF** para dirimir quaisquer dúvidas ou "
    "controvérsias oriundas deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.")
par("E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em 2 (duas) vias de igual "
    "teor e forma, ou eletronicamente, para que produza seus efeitos legais.")

par("Brasília/DF, 21 de outubro de 2026.", align=WD_ALIGN_PARAGRAPH.CENTER, after=30).paragraph_format.space_before = Pt(14)


def assinatura(nome, papel):
    p = par("_" * 50, align=WD_ALIGN_PARAGRAPH.CENTER, after=0)
    p.paragraph_format.space_before = Pt(20)
    p.paragraph_format.keep_with_next = True
    par(nome, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, after=0).paragraph_format.keep_with_next = True
    par(papel, align=WD_ALIGN_PARAGRAPH.CENTER, size=10, after=4)


assinatura("ANA CLÁUDIA MENDES SILVA – Criativos Rápidos", "CONTRATADA")
assinatura("______________________________________", "CONTRATANTE")
par("Testemunhas (opcional):", bold=True, align=WD_ALIGN_PARAGRAPH.LEFT).paragraph_format.space_before = Pt(18)
par("1. Assinatura: _______________________  Nome/CPF: _______________________", align=WD_ALIGN_PARAGRAPH.LEFT)
par("2. Assinatura: _______________________  Nome/CPF: _______________________", align=WD_ALIGN_PARAGRAPH.LEFT)

# rodapé com numeração de página
rod = doc.sections[0].footer.paragraphs[0]
rod.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = rod.add_run("Criativos Rápidos · Contrato de Prestação de Serviços – Plano Autoridade · pág. ")
r.font.size = Pt(8)
for tipo, txt in (("begin", None), (None, "PAGE"), ("end", None)):
    run = rod.add_run(); run.font.size = Pt(8)
    if tipo:
        fc = OxmlElement("w:fldChar"); fc.set(qn("w:fldCharType"), tipo); run._r.append(fc)
    else:
        it = OxmlElement("w:instrText"); it.set(qn("xml:space"), "preserve"); it.text = txt; run._r.append(it)

out = ROOT / f"{NOME}.docx"
doc.save(out)
subprocess.run(["soffice", "--headless", "--convert-to", "pdf", "--outdir", str(ROOT), str(out)], check=True,
               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print("ok:", out, ROOT / f"{NOME}.pdf")
