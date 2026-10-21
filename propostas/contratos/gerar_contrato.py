"""Gera o contrato de prestação de serviços (Plano Autoridade) em DOCX e PDF.

Uso: python3 gerar_contrato.py   (precisa do python-docx e do LibreOffice para o PDF)
Campos com "________" são preenchidos pelo contratante ou antes do envio.
"""
import os, subprocess
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, RGBColor, Cm

AQUI = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(AQUI, '..', 'proposta-generica', 'assets', 'logo-completo.png')
PRETO = RGBColor(0x10, 0x12, 0x16)
CINZA = RGBColor(0x5A, 0x5D, 0x66)
LINHA = '____________________________________________'

doc = Document()
for s in doc.sections:
    s.top_margin = Cm(2.2); s.bottom_margin = Cm(2.2); s.left_margin = Cm(2.4); s.right_margin = Cm(2.4)
st = doc.styles['Normal']; st.font.name = 'Arial'; st.font.size = Pt(10.5); st.font.color.rgb = PRETO
st.element.rPr.rFonts.set(qn('w:eastAsia'), 'Arial')
st.paragraph_format.space_after = Pt(6); st.paragraph_format.line_spacing = 1.25


def faixa(par, cor='FFD400'):
    pPr = par._p.get_or_add_pPr(); shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear'); shd.set(qn('w:color'), 'auto'); shd.set(qn('w:fill'), cor); pPr.append(shd)


def p(texto='', bold=False, size=None, align=None, cor=None, after=None):
    par = doc.add_paragraph()
    if align: par.alignment = align
    if after is not None: par.paragraph_format.space_after = Pt(after)
    partes = texto.split('**')
    for i, t in enumerate(partes):
        r = par.add_run(t); r.bold = bold or (i % 2 == 1)
        if size: r.font.size = Pt(size)
        if cor: r.font.color.rgb = cor
    return par


def clausula(titulo):
    par = p(titulo, bold=True, size=11.5, after=4); par.paragraph_format.space_before = Pt(10)
    par.paragraph_format.keep_with_next = True; faixa(par)
    return par


def item(texto):
    par = p(texto); par.paragraph_format.left_indent = Cm(0.6)
    return par


# ---------------------------------------------------------------- cabeçalho
if os.path.exists(LOGO):
    doc.add_picture(LOGO, width=Cm(5))
p('CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MARKETING DIGITAL', bold=True, size=15, after=2)
p('Plano Autoridade · mensal · sem fidelidade', size=11, cor=CINZA, after=12)

p('Pelo presente instrumento particular, as partes abaixo identificadas celebram este contrato de prestação de serviços, que se regerá pelas cláusulas e condições a seguir.')

clausula('DAS PARTES')
p('**CONTRATADA:** ANA CLÁUDIA MENDES SILVA, microempreendedora individual (MEI), nome fantasia **CRIATIVOS RÁPIDOS**, inscrita no CNPJ sob o nº 67.844.754/____-__, com sede em ________________________________________, doravante denominada **CONTRATADA**.')
p('**CONTRATANTE:** ________________________________________ (nome completo ou razão social), inscrito(a) no CPF/CNPJ sob o nº ____________________, com endereço em ________________________________________, telefone/WhatsApp ____________________, e-mail ____________________, perfil no Instagram @____________________, doravante denominado(a) **CONTRATANTE**.')

clausula('CLÁUSULA 1 · DO OBJETO')
p('1.1. O presente contrato tem por objeto a prestação, pela CONTRATADA, de serviços de **social media** e **gestão de tráfego pago** para o perfil do CONTRATANTE, conforme o **Plano Autoridade**, que inclui, a cada período de 30 (trinta) dias:')
for t in ['30 (trinta) stories;', '15 (quinze) posts;', '12 (doze) carrosséis;', '9 (nove) reels;', '4 (quatro) anúncios;',
          'total de 70 (setenta) conteúdos no mês, com post todos os dias;',
          'legendas (copy) e organização completa do perfil;',
          'programação e postagem dos conteúdos pela CONTRATADA;',
          'gestão das campanhas de tráfego pago do CONTRATANTE;',
          'relatório mensal de métricas;',
          'bônus: calendário de conteúdo humanizado e sequência de stories que vende;',
          'até 3 (três) ajustes no mês, conforme a Cláusula 3.']:
    item('• ' + t)
p('1.2. Não estão incluídos no objeto deste contrato: o valor investido nos anúncios (verba de mídia), que será pago pelo CONTRATANTE diretamente à plataforma de anúncios; o atendimento e a resposta de mensagens de clientes do CONTRATANTE; e quaisquer serviços não descritos no item 1.1.')

clausula('CLÁUSULA 2 · DO FUNCIONAMENTO E DOS PRAZOS')
p('2.1. O prazo de entrega começa a contar a partir do momento em que **o pagamento for recebido pela CONTRATADA e o briefing for enviado completo pelo CONTRATANTE**, o que ocorrer por último.')
p('2.2. A CONTRATADA enviará os conteúdos ao CONTRATANTE para aprovação em até **24 (vinte e quatro) horas** contadas na forma do item 2.1.')
p('2.3. Aprovados os conteúdos, a CONTRATADA terá até **24 (vinte e quatro) horas** para agendá-los e iniciar o trabalho no perfil do CONTRATANTE, com postagens todos os dias.')
p('2.4. Caso o CONTRATANTE solicite alteração, a CONTRATADA terá até **24 (vinte e quatro) horas** para entregar o conteúdo ajustado, observado o limite da Cláusula 3.')
p('2.5. Os prazos ficam suspensos enquanto houver pendência do CONTRATANTE, como falta de informações, materiais, acessos ou aprovação.')

clausula('CLÁUSULA 3 · DOS AJUSTES')
p('3.1. O CONTRATANTE tem direito a até **3 (três) ajustes por mês**. Considera-se ajuste a solicitação de mudança nos conteúdos entregues, como a troca de um tema, de um texto ou de uma imagem.')
p('3.2. Ajustes não utilizados no mês não se acumulam para o mês seguinte. Pedidos além do limite poderão ser atendidos mediante orçamento à parte.')

clausula('CLÁUSULA 4 · DO VALOR E DA FORMA DE PAGAMENTO')
p('4.1. Pelos serviços, o CONTRATANTE pagará à CONTRATADA o valor de **R$ 997,00 (novecentos e noventa e sete reais)** por período de 30 (trinta) dias.')
p('4.2. O pagamento deverá ser feito **no ato da assinatura deste contrato**, por uma das formas abaixo:')
item('• **Pix:** chave 052.611.991-82, Caixa Econômica Federal, favorecida Ana Cláudia Mendes Silva;')
item('• **Cartão de crédito:** por link de pagamento da InfinitePay enviado pela CONTRATADA, com parcelamento em até 12 (doze) vezes, sendo as taxas do parcelamento repassadas ao CONTRATANTE.')
p('4.3. A verba de anúncios é de responsabilidade exclusiva do CONTRATANTE e não está incluída no valor do item 4.1.')

clausula('CLÁUSULA 5 · DA VIGÊNCIA E DO CANCELAMENTO')
p('5.1. Este contrato é **mensal e sem fidelidade**. Entra em vigor na data da assinatura, **21/10/2026**, e vigora por 30 (trinta) dias, até **21/11/2026**.')
p('5.2. Ao fim do período, o contrato poderá ser renovado por igual período mediante novo pagamento, mantidas as mesmas condições, salvo nova negociação entre as partes.')
p('5.3. Qualquer das partes pode encerrar o contrato a qualquer tempo, **sem multa**, mediante aviso por escrito (WhatsApp ou e-mail). O encerramento vale para o período seguinte; o período em andamento, já pago, será cumprido até o fim.')

clausula('CLÁUSULA 6 · DAS OBRIGAÇÕES DA CONTRATADA')
for t in ['a) executar os serviços com qualidade, dentro dos prazos da Cláusula 2;',
          'b) produzir os conteúdos de acordo com o briefing e a identidade da marca do CONTRATANTE;',
          'c) programar e publicar os conteúdos aprovados;',
          'd) gerir as campanhas de tráfego pago com a verba definida pelo CONTRATANTE;',
          'e) enviar o relatório mensal de métricas;',
          'f) manter sigilo sobre as informações do CONTRATANTE e usar os acessos recebidos apenas para a execução deste contrato.']:
    item(t)

clausula('CLÁUSULA 7 · DAS OBRIGAÇÕES DO CONTRATANTE')
for t in ['a) efetuar o pagamento na forma da Cláusula 4;',
          'b) preencher o briefing de forma completa e verdadeira;',
          'c) enviar fotos, vídeos, logo e demais materiais necessários;',
          'd) liberar os acessos necessários ao perfil e à conta de anúncios, sem necessidade de informar senhas pessoais;',
          'e) aprovar ou pedir ajustes nos conteúdos em tempo hábil;',
          'f) pagar a verba dos anúncios diretamente à plataforma;',
          'g) responder pela veracidade das informações, produtos, serviços, preços e promoções divulgados.']:
    item(t)

clausula('CLÁUSULA 8 · DOS RESULTADOS')
p('8.1. A CONTRATADA se compromete a aplicar as melhores práticas de conteúdo e tráfego pago. Como os resultados dependem de fatores fora do controle da CONTRATADA, como o mercado, a oferta, o preço e o atendimento do CONTRATANTE, **não há garantia de número de vendas, seguidores ou faturamento**.')

clausula('CLÁUSULA 9 · DOS DIREITOS SOBRE OS CONTEÚDOS')
p('9.1. Após o pagamento, os conteúdos produzidos para o CONTRATANTE podem ser usados livremente por ele.')
p('9.2. O CONTRATANTE (   ) autoriza  (   ) não autoriza a CONTRATADA a exibir os conteúdos produzidos e os resultados alcançados em seu portfólio e em suas redes sociais.')

clausula('CLÁUSULA 10 · DA PROTEÇÃO DE DADOS')
p('10.1. As partes se comprometem a tratar os dados pessoais envolvidos neste contrato de acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), usando-os apenas para a execução dos serviços.')

clausula('CLÁUSULA 11 · DO FORO')
p('11.1. Fica eleito o foro da comarca de ____________________ para resolver eventuais questões deste contrato.')

p('E, por estarem de acordo, as partes assinam este contrato, inclusive por meio eletrônico, para que produza seus efeitos.')
p('____________________, 21 de outubro de 2026.', after=28)

for nome, papel in [('ANA CLÁUDIA MENDES SILVA · CRIATIVOS RÁPIDOS', 'CONTRATADA'), ('Nome: ________________________________', 'CONTRATANTE')]:
    p(LINHA, align=WD_ALIGN_PARAGRAPH.CENTER, after=0)
    p(nome, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, after=0)
    p(papel, align=WD_ALIGN_PARAGRAPH.CENTER, cor=CINZA, after=24)

docx_path = os.path.join(AQUI, 'contrato-plano-autoridade.docx')
doc.save(docx_path)
subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', '--outdir', AQUI, docx_path], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print(docx_path)
