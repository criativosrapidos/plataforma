// Diff legível de contest_versions.diff_json ([{campo, antes, depois}]). Sem hooks: serve no servidor.
import { brl, dataBR, DATE_TIPO_LABEL, type DateTipo } from "@aviso/shared";
import { ROTULO_CAMPO } from "@/lib/admin/concurso-form";

const ISO = /^\d{4}-\d{2}-\d{2}/;

function rotulo(campo: string) {
  return DATE_TIPO_LABEL[campo as DateTipo] ?? ROTULO_CAMPO[campo] ?? campo.replace(/_/g, " ");
}

function valor(campo: string, v: unknown): string {
  if (v == null || v === "") return "—";
  if (typeof v === "number" && /centavos/.test(campo)) return brl(v);
  if (typeof v === "string" && ISO.test(v)) return dataBR(v.slice(0, 10));
  if (typeof v === "boolean") return v ? "sim" : "não";
  if (Array.isArray(v)) {
    if (v.every((x) => x && typeof x === "object" && "tipo" in x)) {
      return v
        .map((x) => {
          const d = x as { tipo: string; inicio?: string | null; fim?: string | null };
          const quando = d.inicio && d.fim && d.inicio !== d.fim ? `${dataBR(d.inicio)} a ${dataBR(d.fim)}` : dataBR(d.fim ?? d.inicio ?? null);
          return `${rotulo(d.tipo)} ${quando}`;
        })
        .join(" · ");
    }
    if (v.every((x) => x && typeof x === "object" && "nome" in x)) {
      return v
        .map((x) => {
          const c = x as { nome: string; vagas?: number | null; salario_centavos?: number | null };
          return [c.nome, c.vagas != null ? `${c.vagas} vagas` : null, c.salario_centavos != null ? brl(c.salario_centavos) : null].filter(Boolean).join(", ");
        })
        .join(" · ");
    }
    return v.map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x))).join(", ");
  }
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export function DiffVersao({ diff }: { diff: unknown }) {
  const linhas = Array.isArray(diff) ? (diff as { campo?: string; antes?: unknown; depois?: unknown }[]) : [];
  if (!linhas.length) return <p className="text-[12.5px] text-tx2">Sem detalhes do que mudou.</p>;
  return (
    <ul className="space-y-1.5">
      {linhas.map((l, i) => {
        const campo = String(l.campo ?? "?");
        return (
          <li key={i} className="text-[12.5px] leading-snug">
            <span className="font-semibold">{rotulo(campo)}</span>
            <span className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5">
              <del className="font-mono text-[11.5px] text-verm decoration-verm/50">{valor(campo, l.antes)}</del>
              <span aria-hidden className="text-tx2">→</span>
              <ins className="font-mono text-[11.5px] font-bold text-verde no-underline">{valor(campo, l.depois)}</ins>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
