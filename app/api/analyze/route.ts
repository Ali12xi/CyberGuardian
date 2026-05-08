import { NextRequest, NextResponse } from "next/server";
import { scanUrl } from "@/lib/scanner";
import { validateUrl } from "@/lib/validator";
import { translations } from "@/lib/i18n";
import type { AnalyzeApiResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENERIC_ERROR = {
  en: translations.en.analyzeGenericError,
  ar: translations.ar.analyzeGenericError,
};

const INVALID_JSON_ERROR = {
  en: translations.en.invalidJson,
  ar: translations.ar.invalidJson,
};

const METHOD_NOT_ALLOWED_ERROR = {
  en: translations.en.analyzeMethodNotAllowed,
  ar: translations.ar.analyzeMethodNotAllowed,
};

type AnalyzeApiError = Extract<AnalyzeApiResponse, { ok: false }>["error"];

function errorResponse(
  error: AnalyzeApiError,
  status: number,
) {
  return NextResponse.json<AnalyzeApiResponse>({ ok: false, error }, { status });
}

export async function POST(request: NextRequest) {
  try {
    let body: { url?: unknown };

    try {
      body = (await request.json()) as { url?: unknown };
    } catch {
      return errorResponse(INVALID_JSON_ERROR, 400);
    }

    const url = typeof body.url === "string" ? body.url : "";

    if (!url.trim()) {
      return errorResponse(
        {
          en: translations.en.emptyUrl,
          ar: translations.ar.emptyUrl,
        },
        400,
      );
    }

    const validation = await validateUrl(url);

    if (!validation.valid) {
      return errorResponse(
        validation.error ?? {
          en: translations.en.unsafeUrl,
          ar: translations.ar.unsafeUrl,
        },
        400,
      );
    }

    const result = await scanUrl(validation.url);

    return NextResponse.json<AnalyzeApiResponse>({ ok: true, result });
  } catch {
    return errorResponse(GENERIC_ERROR, 500);
  }
}

export function GET() {
  return errorResponse(METHOD_NOT_ALLOWED_ERROR, 405);
}
