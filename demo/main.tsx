import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import AppLayout from "@/app/app/layout";
import Conta from "@/app/app/conta/page";
import Marcas from "@/app/app/marcas/page";
import Painel from "@/app/app/page";
import Peca from "@/app/app/peca/[id]/page";
import Plano from "@/app/app/plano/page";
import { Cadastro } from "@/app/cadastro/Cadastro";
import Entrar from "@/app/entrar/page";
import Onboarding from "@/app/onboarding/page";
import Perfil from "@/app/onboarding/perfil/page";
import Home from "@/app/page";
import { RouterProvider, useRouterDemo } from "./router";
import "./demo.css";

function Rotas() {
  const caminho = useRouterDemo().caminho.split("?")[0];
  if (caminho.startsWith("/app")) {
    const tela =
      caminho === "/app" ? <Painel /> :
      caminho.startsWith("/app/peca/") ? <Peca key={caminho} /> :
      caminho === "/app/marcas" ? <Marcas /> :
      caminho === "/app/plano" ? <Plano /> :
      caminho === "/app/conta" ? <Conta /> : <Painel />;
    return <AppLayout>{tela}</AppLayout>;
  }
  if (caminho === "/cadastro") return <Suspense><Cadastro key={useRouterDemo().caminho} /></Suspense>;
  if (caminho === "/entrar") return <Entrar />;
  if (caminho === "/onboarding") return <Onboarding />;
  if (caminho === "/onboarding/perfil") return <Perfil />;
  return <Home />;
}

// Link com #plataforma abre direto na área do cliente.
const inicial = location.hash === "#plataforma" ? "/app" : "/";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider inicial={inicial}>
      <Rotas />
    </RouterProvider>
  </StrictMode>,
);
