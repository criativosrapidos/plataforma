import { Suspense } from "react";
import { Entregas } from "./Entregas";

export default function Page() {
  return (
    <Suspense>
      <Entregas />
    </Suspense>
  );
}
