import { StrictMode, Suspense, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import Acesso from "@/app/acesso/page";
import Agencia from "@/app/agencia/page";
import BriefingPublico from "@/app/briefing/page";
import BriefingCliente from "@/app/cliente/briefing/page";
import Calendario from "@/app/cliente/calendario/page";
import EntregaPage from "@/app/cliente/entregas/[id]/page";
import { Entregas } from "@/app/cliente/entregas/Entregas";
import { Marca } from "@/app/cliente/marca/Marca";
import Inicio from "@/app/cliente/page";
import Home from "@/app/page";
import { Pedido } from "@/app/pedido/Pedido";
import { ClienteShell } from "@/components/ClienteShell";
import { ClienteProvider } from "@/lib/cliente-store";
import { RouterProvider, useRouterDemo } from "./router";
import "./demo.css";

// Site de venda + área do cliente + painel da agência. A plataforma com IA (src/app/app) fica de fora.
function Rotas() {
  const { caminho: completo } = useRouterDemo();
  const caminho = completo.split("?")[0];
  const s = (n: ReactNode) => <Suspense key={completo}>{n}</Suspense>;

  if (caminho.startsWith("/cliente")) {
    const tela =
      caminho === "/cliente/entregas" ? s(<Entregas />) :
      caminho.startsWith("/cliente/entregas/") ? <EntregaPage key={caminho} /> :
      caminho === "/cliente/calendario" ? <Calendario /> :
      caminho === "/cliente/marca" ? s(<Marca />) :
      caminho === "/cliente/briefing" ? <BriefingCliente /> : <Inicio />;
    return <ClienteShell>{tela}</ClienteShell>;
  }
  if (caminho === "/pedido") return s(<Pedido />);
  if (caminho === "/acesso") return <Acesso />;
  if (caminho === "/briefing") return <BriefingPublico key={completo} />;
  if (caminho === "/agencia") return <Agencia />;
  return <Home />;
}

// Atalhos pelo link: #cliente abre a área do cliente, #agencia o painel da equipe.
const atalhos: Record<string, string> = { "#cliente": "/cliente", "#agencia": "/agencia", "#briefing": "/briefing" };
const inicial = atalhos[location.hash] ?? "/";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider inicial={inicial}>
      <ClienteProvider>
        <Rotas />
      </ClienteProvider>
    </RouterProvider>
  </StrictMode>,
);
