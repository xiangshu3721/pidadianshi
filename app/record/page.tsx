"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route — chat now lives on `/`. Static hosts have no HTTP redirect. */
export default function RecordRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return (
    <p className="muted" style={{ padding: 24 }}>
      正在回到倒一倒…
    </p>
  );
}
