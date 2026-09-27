"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route — report now lives on `/today`. */
export default function ReportAlias() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/today");
  }, [router]);
  return (
    <p className="muted" style={{ padding: 24 }}>
      正在去报告…
    </p>
  );
}
