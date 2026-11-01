// Itens da barra lateral e quem vê cada um. Editor: operação. Admin: tudo.
export interface ItemNav {
  href: string;
  rotulo: string;
  icone: string;
  nivel: "editor" | "admin";
  grupo: "Operação" | "Negócio" | "Sistema";
  badge?: "fila";
}

export const NAV: ItemNav[] = [
  { href: "/admin", rotulo: "Visão geral", icone: "geral", nivel: "editor", grupo: "Operação" },
  { href: "/admin/revisao", rotulo: "Revisão", icone: "revisao", nivel: "editor", grupo: "Operação", badge: "fila" },
  { href: "/admin/concursos", rotulo: "Concursos", icone: "concursos", nivel: "editor", grupo: "Operação" },
  { href: "/admin/documentos", rotulo: "Documentos", icone: "documentos", nivel: "editor", grupo: "Operação" },
  { href: "/admin/fontes", rotulo: "Fontes", icone: "fontes", nivel: "editor", grupo: "Operação" },
  { href: "/admin/materias", rotulo: "Matérias", icone: "materias", nivel: "editor", grupo: "Operação" },
  { href: "/admin/usuarios", rotulo: "Usuários", icone: "usuarios", nivel: "admin", grupo: "Negócio" },
  { href: "/admin/financeiro", rotulo: "Financeiro", icone: "financeiro", nivel: "admin", grupo: "Negócio" },
  { href: "/admin/avisos", rotulo: "Avisos", icone: "avisos", nivel: "admin", grupo: "Negócio" },
  { href: "/admin/leads", rotulo: "Leads", icone: "leads", nivel: "admin", grupo: "Negócio" },
  { href: "/admin/config", rotulo: "Configurações", icone: "config", nivel: "admin", grupo: "Sistema" },
  { href: "/admin/auditoria", rotulo: "Auditoria", icone: "auditoria", nivel: "admin", grupo: "Sistema" },
];

export function navPara(role: string): ItemNav[] {
  return NAV.filter((i) => i.nivel === "editor" || role === "admin");
}
