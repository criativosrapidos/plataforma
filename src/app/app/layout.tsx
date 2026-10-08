import { AppShell } from "@/components/AppShell";
import { StoreProvider } from "@/lib/store";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <AppShell>{children}</AppShell>
    </StoreProvider>
  );
}
