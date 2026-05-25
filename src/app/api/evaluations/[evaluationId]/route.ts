import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEvaluationStatus } from "@/lib/evaluation/queries";

type RouteContext = {
  params: Promise<{ evaluationId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { evaluationId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getEvaluationStatus(evaluationId);

  if (!status) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: status.id,
    status: status.status,
    errorMessage: status.errorMessage,
    sermonId: status.sermonId,
    overallScore: status.overallScore,
    scoreBand: status.scoreBand,
  });
}
