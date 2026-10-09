import { Suspense } from "react";
import { Pedido } from "./Pedido";

export default function Page() {
  return (
    <Suspense>
      <Pedido />
    </Suspense>
  );
}
