import type { Metadata } from "next";
import { HomeV2AiAndPreaching } from "@/components/home-v2/HomeV2AiAndPreaching";
import { HomeV2FeedbackVacuum } from "@/components/home-v2/HomeV2FeedbackVacuum";
import { HomeV2Footer } from "@/components/home-v2/HomeV2Footer";
import { HomeV2Framework } from "@/components/home-v2/HomeV2Framework";
import { HomeV2DevelopOthers } from "@/components/home-v2/HomeV2DevelopOthers";
import { HomeV2Header } from "@/components/home-v2/HomeV2Header";
import { HomeV2Hero } from "@/components/home-v2/HomeV2Hero";
import { HomeV2Newsletter } from "@/components/home-v2/HomeV2Newsletter";
import { HomeV2Proof } from "@/components/home-v2/HomeV2Proof";
import { HomeV2SampleSermon } from "@/components/home-v2/HomeV2SampleSermon";
import { HomeV2StartFree } from "@/components/home-v2/HomeV2StartFree";
import { HomeV2Tagline } from "@/components/home-v2/HomeV2Tagline";
import "@/components/home-v2/home-v2.css";

const OG_DESCRIPTION =
  "Expositional feedback on your sermon, scored against an 11-criterion rubric covering textual fidelity, gospel clarity, and application. Your first evaluation is free.";

export const metadata: Metadata = {
  // `absolute` so the layout's "%s · The Sermon Coach" template does not
  // append a second brand name to a title that already carries one.
  title: {
    absolute: "The Sermon Coach · Walk into Sunday knowing your sermon is ready.",
  },
  description:
    "Expositional feedback on your sermon, scored against an eleven-criterion rubric. Your first evaluation is free, no card. Written for pastors who preach.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "The Sermon Coach",
    description: OG_DESCRIPTION,
    url: "https://sermoncoach.com",
    siteName: "The Sermon Coach",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Sermon Coach",
    description: OG_DESCRIPTION,
    images: ["/og-image.png"],
  },
};

/**
 * Homepage. Narrative order is deliberate:
 * problem → sample → standard → mentoring → proof → objection → offer.
 * The standard follows the sample rather than preceding it: it reads as the
 * methodology underneath a product the visitor has already seen, not as the
 * product itself.
 * Evaluation is presented as one step of the development system, never as
 * the product. Framework naming and criteria come from
 * `src/lib/evaluation/tool-schema.ts` and `public/how-its-scored.html`.
 */
export default function HomePage() {
  return (
    <div className="home-v2">
      <HomeV2Header />
      <HomeV2Hero />
      <HomeV2Tagline />
      <HomeV2FeedbackVacuum />
      <HomeV2SampleSermon />
      <HomeV2Framework />
      <HomeV2DevelopOthers />
      <HomeV2Proof />
      <HomeV2AiAndPreaching />
      <HomeV2StartFree />
      <HomeV2Newsletter />
      <HomeV2Footer />
    </div>
  );
}
