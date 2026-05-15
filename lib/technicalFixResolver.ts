import { getFindingQuickFix, type FindingFix, type QuickFixSnippet } from "@/lib/findingFixes";
import {
  getEffectiveSnippetsForFinding,
  type FixPlatform,
} from "@/lib/fixSnippets";
import { detectPlatforms } from "@/lib/platformDetect";
import type { RemediationEntry } from "@/lib/remediation";
import type { ScanResult } from "@/lib/types";

const PLACEMENT_FALLBACK_EN = "Your hosting control panel or app entrypoint";
const PLACEMENT_FALLBACK_AR = "لوحة الاستضافة أو نقطة دخول التطبيق";

export type ResolvedTechnicalFix = {
  findingFix: FindingFix | null;
  snippets: QuickFixSnippet[];
  detected: ReturnType<typeof detectPlatforms>;
};

function rankPlatform(p: FixPlatform, detected: ReturnType<typeof detectPlatforms>): number {
  if (p === detected.primary) {
    return -1000;
  }
  const i = detected.relevant.indexOf(p);
  return i === -1 ? 500 : i;
}

export function orderQuickSnippetsForDetected(
  list: QuickFixSnippet[],
  detected: ReturnType<typeof detectPlatforms>,
): QuickFixSnippet[] {
  const relevantSet = new Set(detected.relevant);
  const filtered = list.filter((s) => relevantSet.has(s.platform));
  const base = filtered.length > 0 ? filtered : list;

  return [...base].sort((a, b) => {
    const ra = rankPlatform(a.platform, detected);
    const rb = rankPlatform(b.platform, detected);
    if (ra !== rb) {
      return ra - rb;
    }
    return a.label.localeCompare(b.label);
  });
}

function baseSnippetsToQuick(
  snippets: { platform: FixPlatform; label: string; code: string }[],
): QuickFixSnippet[] {
  return snippets.map((s) => ({
    ...s,
    placement: PLACEMENT_FALLBACK_EN,
    placementAr: PLACEMENT_FALLBACK_AR,
  }));
}

function mapRemediationDifficulty(
  d: RemediationEntry["difficulty"] | undefined,
): FindingFix["difficulty"] {
  if (d === "easy") {
    return "easy";
  }
  if (d === "hard") {
    return "advanced";
  }
  return "medium";
}

export function resolveTechnicalFix(
  result: ScanResult,
  findingId: string | undefined,
  remediation: RemediationEntry | undefined,
): ResolvedTechnicalFix {
  const detected = detectPlatforms(result);
  const quick = findingId ? getFindingQuickFix(findingId) : undefined;

  if (quick) {
    return {
      findingFix: quick,
      snippets: orderQuickSnippetsForDetected(quick.snippets, detected),
      detected,
    };
  }

  const base = getEffectiveSnippetsForFinding(
    findingId,
    remediation?.codeExamples,
    result.technologies,
  );

  if (base.length === 0 && !remediation) {
    return { findingFix: null, snippets: [], detected };
  }

  const difficulty = remediation
    ? mapRemediationDifficulty(remediation.difficulty)
    : "medium";
  const findingFix: FindingFix = {
    difficulty,
    difficultyAr:
      difficulty === "easy" ? "سهل" : difficulty === "advanced" ? "متقدم" : "متوسط",
    risksReduced: remediation ? [remediation.businessImpact.en] : [],
    risksReducedAr: remediation ? [remediation.businessImpact.ar] : [],
    snippets: orderQuickSnippetsForDetected(baseSnippetsToQuick(base), detected),
  };

  return { findingFix, snippets: findingFix.snippets, detected };
}
