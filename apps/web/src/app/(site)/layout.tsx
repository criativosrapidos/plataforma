import "@/components/ui/movimento.css";
import { Navegacao } from "@/components/site/Navegacao";
import { Rodape } from "@/components/site/Rodape";
import { Revelador } from "@/components/ui/Revelador";

export default function LayoutSite({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <Navegacao />
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      <Rodape />
      <Revelador />
    </div>
  );
}
