import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import Home from "@/app/page";
import { Pedido } from "@/app/pedido/Pedido";
import { RouterProvider, useRouterDemo } from "./router";
import "./demo.css";

// Demonstração do site de venda dos pacotes. A plataforma (src/app/app) fica guardada pra depois.
function Rotas() {
  const { caminho } = useRouterDemo();
  if (caminho.startsWith("/pedido")) {
    return (
      <Suspense>
        <Pedido key={caminho} />
      </Suspense>
    );
  }
  return <Home />;
}

const inicial = location.hash === "#pedido" ? "/pedido" : "/";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider inicial={inicial}>
      <Rotas />
    </RouterProvider>
  </StrictMode>,
);
