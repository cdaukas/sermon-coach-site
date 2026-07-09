"use client";

import { useEffect } from "react";
import { touchLastActive } from "@/lib/auth/touch-last-active";

export function LastActiveTracker() {
  useEffect(() => {
    void touchLastActive();
  }, []);

  return null;
}
