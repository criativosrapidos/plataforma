import type { SVGProps } from "react";

/** Ícones de traço (24×24, currentColor). Decorativos por padrão (aria-hidden). */
const caminhos = {
  sino: ["M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9", "M10.3 21a1.94 1.94 0 0 0 3.4 0"],
  calendario: ["M8 2v4", "M16 2v4", "M3 10h18", "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"],
  livro: ["M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z", "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"],
  checklist: ["m3 17 2 2 4-4", "m3 7 2 2 4-4", "M13 6h8", "M13 12h8", "M13 18h8"],
  check: ["M20 6 9 17l-5-5"],
  setaDireita: ["M5 12h14", "m12 5 7 7-7 7"],
  setaEsquerda: ["M19 12H5", "m12 19-7-7 7-7"],
  externo: ["M15 3h6v6", "M10 14 21 3", "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"],
  menu: ["M4 6h16", "M4 12h16", "M4 18h16"],
  fechar: ["M18 6 6 18", "m6 6 12 12"],
  mais: ["M5 12h14", "M12 5v14"],
  lixeira: ["M3 6h18", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"],
  lapis: ["M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"],
  escudo: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"],
  cadeado: ["M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z", "M7 11V7a5 5 0 0 1 10 0v4"],
  usuario: ["M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", "M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8z"],
  sair: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "m16 17 5-5-5-5", "M21 12H9"],
  baixar: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "m7 10 5 5 5-5", "M12 15V3"],
  celular: ["M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z", "M12 18h.01"],
  lupa: ["M11 3a8 8 0 1 1 0 16 8 8 0 0 1 0-16z", "m21 21-4.3-4.3"],
  filtro: ["M22 3H2l8 9.46V19l4 2v-8.54L22 3z"],
  casa: ["m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
  cartao: ["M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z", "M2 10h20"],
  pix: ["M12 2.5 21.5 12 12 21.5 2.5 12z", "M8.5 12 12 8.5l3.5 3.5-3.5 3.5z"],
  alerta: ["m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z", "M12 9v4", "M12 17h.01"],
  info: ["M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20z", "M12 16v-4", "M12 8h.01"],
  olho: ["M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z", "M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"],
  olhoFechado: [
    "M9.88 9.88a3 3 0 1 0 4.24 4.24",
    "M10.73 5.08A10.4 10.4 0 0 1 12 5c7 0 10 7 10 7a13 13 0 0 1-1.67 2.68",
    "M6.61 6.61A13.5 13.5 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.39-1.61",
    "m2 2 20 20",
  ],
  relogio: ["M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20z", "M12 6v6l4 2"],
  documento: ["M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", "M14 2v4a2 2 0 0 0 2 2h4", "M16 13H8", "M16 17H8", "M10 9H8"],
  mensagem: ["M7.9 20A9 9 0 1 0 4 16.1L2 22Z"],
  globo: ["M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20z", "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20", "M2 12h20"],
  radar: ["M12 2a10 10 0 1 0 10 10", "M12 6a6 6 0 1 0 6 6", "M12 12l7-7", "M12 11a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"],
  monitor: ["M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z", "M8 21h8", "M12 17v4"],
  email: ["M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"],
  chevronBaixo: ["m6 9 6 6 6-6"],
  chevronDireita: ["m9 18 6-6-6-6"],
  chevronEsquerda: ["m15 18-6-6 6-6"],
  raio: ["M13 2 3 14h9l-1 8 10-12h-9l1-8z"],
  pasta: ["M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"],
  estrela: ["M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"],
} as const;

export type NomeIcone = keyof typeof caminhos;

export function Icone({
  nome,
  tamanho = 20,
  rotulo,
  className,
  ...resto
}: { nome: NomeIcone; tamanho?: number; rotulo?: string } & Omit<SVGProps<SVGSVGElement>, "children">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={rotulo ? undefined : true}
      role={rotulo ? "img" : undefined}
      aria-label={rotulo}
      focusable="false"
      {...resto}
    >
      {caminhos[nome].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
