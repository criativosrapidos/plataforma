// Pré-visualização das peças a partir de TEMPLATES com as cores e a logo da marca.
// No MVP real, o mesmo template vira imagem (posts/carrosséis) ou vídeo (Remotion).

import type { Marca, Peca } from "@/lib/mock";

function Ilustracao({ cores, className = "" }: { cores: string[]; className?: string }) {
  const [, destaque, apoio] = cores;
  return (
    <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
      <ellipse cx="60" cy="30" rx="48" ry="24" fill={apoio} />
      <circle cx="44" cy="20" r="2" fill="#fff" opacity=".8" />
      <circle cx="62" cy="15" r="2" fill="#fff" opacity=".8" />
      <circle cx="78" cy="22" r="2" fill="#fff" opacity=".8" />
      <path d="M10 44 Q30 52 50 44 T90 44 T112 44 L112 50 L10 50Z" fill="#7BC14E" />
      <rect x="10" y="48" width="102" height="8" rx="2" fill="#F7C531" />
      <rect x="8" y="55" width="106" height="13" rx="6" fill="#5A3020" />
      <rect x="12" y="66" width="98" height="18" rx="8" fill={apoio} />
      <rect x="26" y="40" width="10" height="5" rx="2" fill={destaque} />
      <rect x="84" y="40" width="10" height="5" rx="2" fill={destaque} />
    </svg>
  );
}

export function PecaPreview({
  peca,
  marca,
  tamanho = "full",
  slide = 0,
  marcaDagua = false,
}: {
  peca: Peca;
  marca: Marca;
  tamanho?: "mini" | "full";
  slide?: number;
  marcaDagua?: boolean;
}) {
  const [fundo, destaque, apoio, claro] = marca.cores;
  const mini = tamanho === "mini";
  const vertical = peca.formato === "9:16";
  const aspecto = vertical ? "aspect-[9/16]" : "aspect-[4/5]";
  const slides = peca.slides ?? [];
  const totalSlides = peca.tipo === "carrossel" ? slides.length + 1 : 1;
  const emCapa = peca.tipo !== "carrossel" || slide === 0;
  const textoSlide = !emCapa ? slides[slide - 1] : null;

  return (
    <div
      className={`@container relative w-full overflow-hidden ${aspecto} ${mini ? "rounded-md" : "rounded-2xl"}`}
      style={{ background: fundo, color: claro }}
    >
      {/* faixa de cor */}
      <div className="absolute -right-10 top-0 h-full w-1/2 -skew-x-[9deg] opacity-90" style={{ background: destaque }} />

      {emCapa ? (
        <div className={`relative flex h-full flex-col ${mini ? "p-1.5" : "p-[7cqw]"}`}>
          <div className="flex items-center justify-between">
            <span
              className={`grid place-items-center rounded-full font-extrabold ${mini ? "h-3 w-3 text-[4px]" : "h-9 w-9 text-xs"}`}
              style={{ background: claro, color: fundo }}
            >
              {marca.iniciais}
            </span>
            {peca.tipo === "anuncio" && !mini && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase" style={{ background: apoio, color: fundo }}>
                Oferta
              </span>
            )}
          </div>
          <div className="flex flex-1 items-center justify-center">
            <Ilustracao cores={marca.cores} className={mini ? "w-[80%]" : "w-[78%] drop-shadow-xl"} />
          </div>
          <div>
            <p
              className={`font-extrabold uppercase leading-[0.95] tracking-tight ${mini ? "text-[6px]" : vertical ? "text-[11cqw]" : "text-[9.5cqw]"}`}
            >
              {peca.titulo}
            </p>
            {!mini && <p className="mt-[2cqw] text-[max(11px,4.2cqw)] opacity-85">{peca.apoio}</p>}
            {!mini && peca.cta && (
              <span className="mt-4 inline-block rounded-full px-5 py-2 text-sm font-extrabold" style={{ background: apoio, color: fundo }}>
                {peca.cta} →
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className={`relative flex h-full flex-col justify-between ${mini ? "p-1.5" : "p-[7cqw]"}`}>
          <span className="text-[15cqw] font-extrabold" style={{ color: apoio }}>
            {String(slide).padStart(2, "0")}
          </span>
          <p className="text-[9.5cqw] font-extrabold uppercase leading-[0.95] tracking-tight">{textoSlide}</p>
          <p className="text-sm font-extrabold opacity-80">{marca.instagram}</p>
        </div>
      )}

      {/* indicadores por tipo */}
      {peca.tipo === "video" && (
        <div className="absolute inset-x-0 top-0 grid h-[62%] place-items-center">
          <span className={`grid place-items-center rounded-full bg-black/45 backdrop-blur ${mini ? "h-4 w-4" : "h-[18cqw] w-[18cqw]"}`}>
            <svg viewBox="0 0 24 24" className={mini ? "h-2 w-2" : "h-7 w-7"} fill="#fff">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          {!mini && (
            <span className="absolute right-4 top-4 rounded-full bg-black/55 px-2 py-0.5 text-xs font-extrabold text-white">
              0:{String(peca.duracao ?? 30).padStart(2, "0")}
            </span>
          )}
        </div>
      )}
      {peca.tipo === "carrossel" && !mini && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: claro, opacity: i === slide ? 1 : 0.35 }} />
          ))}
        </div>
      )}
      {marcaDagua && !mini && (
        <span className="absolute bottom-3 right-3 rounded bg-black/50 px-2 py-0.5 text-[10px] font-extrabold text-white">
          feito com criativos rápidos
        </span>
      )}
    </div>
  );
}
