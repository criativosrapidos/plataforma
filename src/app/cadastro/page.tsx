import { Suspense } from "react";
import { Cadastro } from "./Cadastro";

export default function Page() {
  return (
    <Suspense>
      <Cadastro />
    </Suspense>
  );
}
