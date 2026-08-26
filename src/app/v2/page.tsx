import type { Metadata } from "next";
import { HomeV2AiAndPreaching } from "@/components/home-v2/HomeV2AiAndPreaching";
import { HomeV2PreachingRhythm } from "@/components/home-v2/HomeV2PreachingRhythm";
import { HomeV2FeedbackVacuum } from "@/components/home-v2/HomeV2FeedbackVacuum";
import { HomeV2Footer } from "@/components/home-v2/HomeV2Footer";
import { HomeV2Framework } from "@/components/home-v2/HomeV2Framework";
import { HomeV2GrowthProfile } from "@/components/home-v2/HomeV2GrowthProfile";
import { HomeV2Header } from "@/components/home-v2/HomeV2Header";
import { HomeV2Hero } from "@/components/home-v2/HomeV2Hero";
import { HomeV2Institutions } from "@/components/home-v2/HomeV2Institutions";
import { HomeV2Mentoring } from "@/components/home-v2/HomeV2Mentoring";
import { HomeV2Newsletter } from "@/components/home-v2/HomeV2Newsletter";
import { HomeV2Proof } from "@/components/home-v2/HomeV2Proof";
import { HomeV2SampleSermon } from "@/components/home-v2/HomeV2SampleSermon";
import { HomeV2StartFree } from "@/components/home-v2/HomeV2StartFree";
import { HomeV2Tagline } from "@/components/home-v2/HomeV2Tagline";
import "@/components/home-v2/home-v2.css";

export const metadata: Metadata = {
  title: "Homepage draft v2",
  description:
    "Visual draft of a Sermon Coach homepage. Not indexed. The live homepage is public/index.html.",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Homepage draft. Narrative order is deliberate:
 * problem → standard → loop → growth → proof → mentoring → institutions →
 * objection → offer. Evaluation is presented as one step of the loop, never
 * as the product. Framework naming and criteria come from
 * `src/lib/evaluation/tool-schema.ts` and `public/how-its-scored.html`.
 */
export default function HomeV2Page() {
  return (
    <div className="home-v2">
      <HomeV2Header />
      <HomeV2Hero />
      <HomeV2Tagline />
      <HomeV2FeedbackVacuum />
      <HomeV2Framework />
      <HomeV2PreachingRhythm />
      <HomeV2SampleSermon />
      <HomeV2GrowthProfile />
      <HomeV2Proof />
      <HomeV2Mentoring />
      <HomeV2Institutions />
      <HomeV2AiAndPreaching />
      <HomeV2StartFree />
      <HomeV2Newsletter />
      <HomeV2Footer />
    </div>
  );
}
