"use client";

import { track } from "@vercel/analytics";
import { useEffect } from "react";

export function MentoringPageView() {
  useEffect(() => {
    track("mentoring page viewed");
  }, []);

  return null;
}
