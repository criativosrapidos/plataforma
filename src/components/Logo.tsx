// Símbolo: play com três riscos de velocidade à esquerda.
// Trocar pelos arquivos oficiais de /marca quando forem adicionados ao repositório.

export function LogoSimbolo({ className = "h-8 w-8", cor = "#101216" }: { className?: string; cor?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="2" y="15" width="16" height="6" rx="3" fill={cor} />
      <rect x="0" y="29" width="18" height="6" rx="3" fill={cor} />
      <rect x="6" y="43" width="12" height="6" rx="3" fill={cor} />
      <path d="M24 10.5c0-3 3.3-4.9 5.9-3.3l29 19.7c2.4 1.6 2.4 5.1 0 6.7l-29 19.7c-2.6 1.6-5.9-.3-5.9-3.3z" fill={cor} />
    </svg>
  );
}

export function Logo({ escuro = false, className = "" }: { escuro?: boolean; className?: string }) {
  const texto = escuro ? "text-white" : "text-preto";
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-amarelo">
        <LogoSimbolo className="h-6 w-6" />
      </span>
      <span className={`leading-[0.9] ${texto}`}>
        <span className="block text-[15px] font-extrabold tracking-tight">criativos</span>
        <span className="block text-[15px] font-extrabold italic tracking-tight">rápidos</span>
      </span>
    </span>
  );
}
