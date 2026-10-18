"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AboutSectionRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/home-page");
  }, [router]);
  return null;
}
