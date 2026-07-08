import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

const ArkGame = lazy(() => import("@/components/game/ArkGame"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ARK: Territory Wars — Batalha de tribos com dinossauros" },
      {
        name: "description",
        content:
          "Jogue Batalha Naval no universo ARK: posicione seus dinossauros e conquiste a base inimiga em partidas P2P.",
      },
      { property: "og:title", content: "ARK: Territory Wars" },
      {
        property: "og:description",
        content: "Batalha de tribos com dinossauros, multiplayer P2P direto no navegador.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="ark-bg flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">
          Carregando ARK: Territory Wars...
        </div>
      </div>
    );
  }
  return (
    <Suspense fallback={<div className="ark-bg min-h-screen" />}>
      <ArkGame />
    </Suspense>
  );
}
