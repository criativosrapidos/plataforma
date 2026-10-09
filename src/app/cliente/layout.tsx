import { ClienteShell } from "@/components/ClienteShell";
import { ClienteProvider } from "@/lib/cliente-store";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ClienteProvider>
      <ClienteShell>{children}</ClienteShell>
    </ClienteProvider>
  );
}
