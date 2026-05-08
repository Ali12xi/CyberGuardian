import { NextRequest, NextResponse } from "next/server";
import { generateSecurityExplanation } from "@/lib/claude";
import { translations } from "@/lib/i18n";
import type { ExplainApiResponse, ScanResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INVALID_REQUEST_ERROR = {
  en: translations.en.explainInvalidRequest,
  ar: translations.ar.explainInvalidRequest,
};

const METHOD_NOT_ALLOWED_ERROR = {
  en: translations.en.explainMethodNotAllowed,
  ar: translations.ar.explainMethodNotAllowed,
};

type ExplainApiError = Extract<ExplainApiResponse, { ok: false }>["error"];

function errorResponse(
  error: ExplainApiError,
  status: number,
) {
  return NextResponse.json<ExplainApiResponse>({ ok: false, error }, { status });
}

function isScanResult(value: unknown): value is ScanResult {
  const record = typeof value === "object" && value !== null ? value : null;

  if (!record) {
    return false;
  }

  const scan = record as Partial<ScanResult>;

  return (
    typeof scan.score === "number" &&
    typeof scan.grade === "string" &&
    typeof scan.ssl === "object" &&
    typeof scan.headers === "object" &&
    typeof scan.redirects === "object" &&
    typeof scan.meta === "object" &&
    Array.isArray(scan.findings)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { result?: unknown };

    if (!isScanResult(body.result)) {
      return errorResponse(INVALID_REQUEST_ERROR, 400);
    }

    const explanation = await generateSecurityExplanation(body.result);

    return NextResponse.json<ExplainApiResponse>({ ok: true, explanation });
  } catch {
    return errorResponse(INVALID_REQUEST_ERROR, 400);
  }
}

export function GET() {
  return errorResponse(METHOD_NOT_ALLOWED_ERROR, 405);
}
