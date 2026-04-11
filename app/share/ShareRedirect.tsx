"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ShareRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  const artifactId = params.get("artifact");

  useEffect(() => {
    router.replace(artifactId ? `/explore?artifact=${artifactId}` : "/explore");
  }, [router, artifactId]);

  return null;
}
