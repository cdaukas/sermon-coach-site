import type { Metadata } from "next";
import { HomeV2ClosingCta } from "@/components/home-v2/HomeV2ClosingCta";
import { HomeV2DevelopmentLoop } from "@/components/home-v2/HomeV2DevelopmentLoop";
import { HomeV2ExpositoryStandard } from "@/components/home-v2/HomeV2ExpositoryStandard";
import { HomeV2Footer } from "@/components/home-v2/HomeV2Footer";
import { HomeV2GrowthProfile } from "@/components/home-v2/HomeV2GrowthProfile";
import { HomeV2Header } from "@/components/home-v2/HomeV2Header";
import { HomeV2Hero } from "@/components/home-v2/HomeV2Hero";
import { HomeV2PreachingWeek } from "@/components/home-v2/HomeV2PreachingWeek";
import { HomeV2Tagline } from "@/components/home-v2/HomeV2Tagline";
import { HomeV2Testimonial } from "@/components/home-v2/HomeV2Testimonial";
import { HomeV2WhatCoachDoes } from "@/components/home-v2/HomeV2WhatCoachDoes";

export const metadata: Metadata = {
  title: "Homepage draft v2",
  description:
    "Visual draft of a Sermon Coach homepage. Not indexed.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function HomeV2Page() {
  return (
    <main>
      <HomeV2Header />
      <HomeV2Hero />
      <HomeV2Tagline />
      <HomeV2DevelopmentLoop />
      <HomeV2GrowthProfile />
      <HomeV2WhatCoachDoes />
      <HomeV2ExpositoryStandard />
      <HomeV2Testimonial />
      <HomeV2PreachingWeek />
      <HomeV2ClosingCta />
      <HomeV2Footer />
    </main>
  );
}
