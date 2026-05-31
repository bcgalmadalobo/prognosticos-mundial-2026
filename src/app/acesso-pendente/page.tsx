"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AcessoPendentePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/ativar");
  }, [router]);

  return <main className="p-4">A redirecionar...</main>;
}
