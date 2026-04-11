import { Suspense } from "react";
import { ExploreCanvas } from "@/components/explore/ExploreCanvas";

export default function ExplorePage() {
  return (
    <div className="relative flex-1 w-full h-full overflow-hidden">
      <Suspense>
        <ExploreCanvas />
      </Suspense>
    </div>
  );
}
