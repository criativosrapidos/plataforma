// Paleta dos gráficos do painel (módulo comum: importável por Server e Client Components).
// Categóricas na ordem fixa azul → laranja → teal → violeta (validada para daltonismo nos pares
// adjacentes, em superfície branca). Status (bom/atenção/crítico) sempre acompanhados de rótulo.
export const COR = {
  s1: "#1F3FD1",
  s2: "#C2410C",
  s3: "#0A9396",
  s4: "#7A3FD1",
  bom: "#0E8A45",
  atencao: "#E0A100",
  critico: "#D93A40",
  neutro: "#8A90A2",
  grade: "#ECEDF1",
  eixo: "#C9CCD6",
} as const;
