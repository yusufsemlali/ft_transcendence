import { Suspense } from "react";
import { DiscoveryList } from "./discovery-list";

export default function TournamentsPage() {
  return (
    <Suspense
      fallback={
        <div className="page" style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
          Loading…
        </div>
      }
    >
      <DiscoveryList />
    </Suspense>
  );
}
