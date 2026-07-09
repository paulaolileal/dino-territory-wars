import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const ArkGame = lazy(() => import("@/components/game/ArkGame"));

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <Suspense fallback={<div className="ark-bg min-h-screen" />}>
      <ArkGame />
    </Suspense>
  );
}
