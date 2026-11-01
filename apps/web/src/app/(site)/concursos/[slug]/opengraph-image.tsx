import { ImageResponse } from "next/og";
import { CONTEST_STATUS_LABEL, brl, dataBR, numeroBR } from "@aviso/shared";
import { concursoDetalhe } from "@/lib/repo/concursos";
import { MolduraOG, fontesOG } from "@/components/site/og";
import { mostrarExemplos } from "@/components/site/concursos/util";

export const alt = "Concurso no Aviso Concurso: vagas, salário e datas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function ImagemConcurso({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await concursoDetalhe(decodeURIComponent(slug), null);
  const fonts = await fontesOG();
  if (!c || (c.exemplo && !mostrarExemplos())) {
    return new ImageResponse(
      (
        <MolduraOG>
          <div style={{ display: "flex", fontFamily: "Barlow", fontWeight: 800, fontSize: 100 }}>CONCURSOS PÚBLICOS</div>
        </MolduraOG>
      ),
      { ...size, fonts },
    );
  }
  const inscricao = c.datas.find((d) => d.tipo === "inscricao");
  const fatos: [string, string][] = [
    ["VAGAS", c.vagas_total ? numeroBR(c.vagas_total) + (c.cadastro_reserva ? " + CR" : "") : "A definir"],
    ["SALÁRIO ATÉ", c.salario_max_centavos ? brl(c.salario_max_centavos) : "A definir"],
    ["INSCRIÇÕES", inscricao?.fim ? `até ${dataBR(inscricao.fim)}` : "A definir"],
  ];
  return new ImageResponse(
    (
      <MolduraOG rodape="Receba o aviso no celular · 3 dias grátis">
        <div style={{ display: "flex", gap: 12 }}>
          <div
            style={{
              display: "flex",
              background: c.status === "edital_aberto" ? "#0B7A3D" : "#3D5AF0",
              color: "#FFFFFF",
              fontSize: 22,
              fontWeight: 700,
              padding: "6px 16px",
              borderRadius: 999,
              letterSpacing: 1,
            }}
          >
            {CONTEST_STATUS_LABEL[c.status].toUpperCase()}
          </div>
          {c.banca ? (
            <div style={{ display: "flex", border: "2px solid rgba(255,255,255,0.4)", fontSize: 22, fontWeight: 700, padding: "4px 16px", borderRadius: 999 }}>
              {c.banca.toUpperCase()}
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", marginTop: 20, fontFamily: "Barlow", fontWeight: 800, fontSize: c.titulo.length > 38 ? 76 : 92, lineHeight: 0.95 }}>
          {c.titulo.toUpperCase()}
        </div>
        <div style={{ display: "flex", gap: 56, marginTop: 30 }}>
          {fatos.map(([k, v]) => (
            <div key={k} style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 20, color: "#FFE14D", fontWeight: 700, letterSpacing: 2 }}>{k}</span>
              <span style={{ fontSize: 40, fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>
      </MolduraOG>
    ),
    { ...size, fonts },
  );
}
