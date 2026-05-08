import "server-only";

import { getOptionalServerEnv } from "@/lib/env";
import type { ReputationResult } from "@/lib/types";

const VIRUSTOTAL_DOMAIN_ENDPOINT = "https://www.virustotal.com/api/v3/domains";
const REPUTATION_TIMEOUT_MS = 5_000;

type VirusTotalDomainResponse = {
  data?: {
    attributes?: {
      last_analysis_stats?: {
        malicious?: number;
        suspicious?: number;
        harmless?: number;
        undetected?: number;
      };
      reputation?: number;
    };
  };
};

function getVerdict({
  malicious,
  suspicious,
  harmless,
}: Pick<ReputationResult, "malicious" | "suspicious" | "harmless">): ReputationResult["verdict"] {
  if (malicious >= 3) {
    return "malicious";
  }

  if (malicious >= 1 || suspicious >= 3) {
    return "suspicious";
  }

  if (harmless > 0) {
    return "clean";
  }

  return "unknown";
}

export async function checkDomainReputation(
  domain: string,
): Promise<ReputationResult | null> {
  const apiKey = getOptionalServerEnv("VIRUSTOTAL_API_KEY");
  const normalizedDomain = domain.trim().toLowerCase();

  if (!apiKey || !normalizedDomain) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REPUTATION_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${VIRUSTOTAL_DOMAIN_ENDPOINT}/${encodeURIComponent(normalizedDomain)}`,
      {
        method: "GET",
        headers: {
          "x-apikey": apiKey,
        },
        cache: "no-store",
        signal: controller.signal,
      },
    );

    if (!response.ok || response.status === 204 || response.status === 429) {
      return null;
    }

    const payload = (await response.json()) as VirusTotalDomainResponse;
    const stats = payload.data?.attributes?.last_analysis_stats;

    if (!stats) {
      return null;
    }

    const malicious = Number(stats.malicious ?? 0);
    const suspicious = Number(stats.suspicious ?? 0);
    const harmless = Number(stats.harmless ?? 0);
    const undetected = Number(stats.undetected ?? 0);
    const reputation = Number(payload.data?.attributes?.reputation ?? 0);
    const totalVendors = malicious + suspicious + harmless + undetected;

    return {
      malicious,
      suspicious,
      harmless,
      undetected,
      reputation,
      totalVendors,
      verdict: getVerdict({ malicious, suspicious, harmless }),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
