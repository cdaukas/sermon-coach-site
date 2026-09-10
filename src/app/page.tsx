import type { Metadata } from "next";
import { HomeV2AiAndPreaching } from "@/components/home-v2/HomeV2AiAndPreaching";
import { HomeV2FeedbackVacuum } from "@/components/home-v2/HomeV2FeedbackVacuum";
import { HomeV2Footer } from "@/components/home-v2/HomeV2Footer";
import { HomeV2Framework } from "@/components/home-v2/HomeV2Framework";
import { HomeV2DevelopOthers } from "@/components/home-v2/HomeV2DevelopOthers";
import { HomeV2Header } from "@/components/home-v2/HomeV2Header";
import { HomeV2Hero } from "@/components/home-v2/HomeV2Hero";
import { HomeV2Proof } from "@/components/home-v2/HomeV2Proof";
import { HomeV2SampleSermon } from "@/components/home-v2/HomeV2SampleSermon";
import { HomeV2StartFree } from "@/components/home-v2/HomeV2StartFree";
import { HomeV2Tagline } from "@/components/home-v2/HomeV2Tagline";
import { HomeV2Velasquez } from "@/components/home-v2/HomeV2Velasquez";
import "@/components/home-v2/home-v2.css";

/** Shared by the Open Graph and Twitter cards. Carries the tagline the page
 *  itself leads with, so a link preview and the page say the same thing. */
const OG_DESCRIPTION =
  "Not a sermon-writing tool. A system that turns weekly feedback into long-term development. Your first evaluation is free, no card.";

/** The card title carries the claim on its own: `siteName` already renders
 *  "The Sermon Coach" beside it, so repeating the brand would double it. */
const OG_TITLE = "Walk into Sunday knowing your sermon is ready.";

export const metadata: Metadata = {
  // `absolute` so the layout's "%s · The Sermon Coach" template does not
  // append a second brand name to a title that already carries one.
  title: {
    absolute: "The Sermon Coach · Walk into Sunday knowing your sermon is ready.",
  },
  description:
    "The Sermon Coach reads the sermons you actually write and shows you what is working, what needs attention, and where to focus before Sunday.",
  alternates: { canonical: "/" },
  openGraph: {
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    url: "https://sermoncoach.com",
    siteName: "The Sermon Coach",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: ["/og-image.png"],
  },
};

/**
 * Homepage. Narrative order is deliberate:
 * problem → sample → standard → voice → mentoring → objection → proof → offer.
 * The standard follows the sample rather than preceding it: it reads as the
 * methodology underneath a product the visitor has already seen, not as the
 * product itself. The objection is answered before the proof so the page ends
 * on people rather than on a caveat: testimonials, then the preacher who built
 * it, then one call to action and nothing after it.
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
      <HomeV2Velasquez />
      <HomeV2DevelopOthers />
      <HomeV2AiAndPreaching />
      <HomeV2Proof />
      <HomeV2StartFree />
      <HomeV2Footer />
    </div>
  );
}
