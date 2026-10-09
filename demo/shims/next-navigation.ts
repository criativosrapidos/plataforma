import { useRouterDemo } from "../router";

export function useRouter() {
  const { ir } = useRouterDemo();
  return { push: ir, replace: ir, back: () => ir("/") };
}

export function usePathname() {
  return useRouterDemo().caminho.split("?")[0];
}

export function useSearchParams() {
  return new URLSearchParams(useRouterDemo().caminho.split("?")[1] ?? "");
}

export function useParams<T>() {
  const m = usePathname().match(/^\/(?:app\/peca|cliente\/entregas)\/([^/]+)$/);
  return (m ? { id: m[1] } : {}) as T;
}
