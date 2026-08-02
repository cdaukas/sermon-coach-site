import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NewEvaluationButton } from "@/components/dashboard/NewEvaluationButton";
import { SketchReadClient } from "@/components/dashboard/SketchReadClient";
import { getReadinessReadForUser } from "@/lib/sketch/queries";
import { createClient } from "@/lib/supabase/server";

type SketchDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: SketchDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  void id;
  return { title: "Sketch" };
}

export default async function SketchDetailPage({
  params,
}: SketchDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const sketch = await getReadinessReadForUser(user.id, id);
  if (!sketch) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/dashboard/sketches"
          className="inline-block text-[13px] font-medium no-underline hover:underline"
          style={{ fontFamily: "var(--font-ui)", color: "var(--sc-accent)" }}
        >
          ← Your sketches
        </Link>
        <NewEvaluationButton />
      </div>
      <SketchReadClient sketch={sketch} />
    </div>
  );
}
