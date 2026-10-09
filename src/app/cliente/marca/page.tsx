import { Suspense } from "react";
import { Marca } from "./Marca";

export default function Page() {
  return (
    <Suspense>
      <Marca />
    </Suspense>
  );
}
