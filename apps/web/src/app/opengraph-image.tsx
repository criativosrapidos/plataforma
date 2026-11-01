import { ImageResponse } from "next/og";
import { MolduraOG, fontesOG } from "@/components/site/og";

export const alt = "Aviso Concurso: você já perdeu concurso. E nem viu.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ImagemCompartilhamento() {
  return new ImageResponse(
    (
      <MolduraOG rodape="Edital, prazo e prova no seu celular · 3 dias grátis">
        <div style={{ display: "flex", flexDirection: "column", fontFamily: "Barlow", fontWeight: 800, fontSize: 112, lineHeight: 0.92, letterSpacing: -1 }}>
          <span>VOCÊ JÁ PERDEU CONCURSO.</span>
          <div style={{ display: "flex", marginTop: 8 }}>
            <span style={{ background: "#FFE14D", color: "#0F1530", padding: "0 14px" }}>E NEM VIU.</span>
          </div>
        </div>
      </MolduraOG>
    ),
    { ...size, fonts: await fontesOG() },
  );
}
