import { createFileRoute } from "@tanstack/react-router";
import EdeinaCalculator from "@/components/EdeinaCalculator";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EDEINA Bakery — Dough Calculator" },
      {
        name: "description",
        content:
          "Artisan bakery dough calculator with baker's percentages, batch scaling, toppings, pricing and shareable recipes.",
      },
      { property: "og:title", content: "EDEINA Bakery — Dough Calculator" },
      {
        property: "og:description",
        content:
          "Artisan bakery dough calculator with baker's percentages, batch scaling, toppings and shareable recipes.",
      },
    ],
  }),
  component: EdeinaCalculator,
});
