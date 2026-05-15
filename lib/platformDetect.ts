import type { FixPlatform } from "@/lib/fixSnippets";
import type { ScanResult } from "@/lib/types";

export interface DetectedPlatform {
  primary: FixPlatform;
  relevant: FixPlatform[];
  label: string;
  detected: boolean;
}

function techIncludes(tech: string[], needle: string): boolean {
  const n = needle.toLowerCase();
  return tech.some((t) => t.toLowerCase().includes(n));
}

/** Uses `result.technologies` (same role as “detected technologies” from fingerprinting). */
export function detectPlatforms(result: ScanResult): DetectedPlatform {
  const tech = result.technologies ?? [];
  const cdn = (result.infrastructure?.cdn ?? "").toLowerCase();

  const hasNext = techIncludes(tech, "next.js") || techIncludes(tech, "nextjs");
  const hasVercelCdn = cdn.includes("vercel");

  if (hasNext && hasVercelCdn) {
    return {
      primary: "vercel",
      relevant: ["vercel", "nextjs"],
      label: "Vercel",
      detected: true,
    };
  }

  if (hasNext) {
    return {
      primary: "nextjs",
      relevant: ["nextjs", "vercel", "nginx"],
      label: "Next.js",
      detected: true,
    };
  }

  if (cdn.includes("cloudflare")) {
    return {
      primary: "cloudflare",
      relevant: ["cloudflare", "nginx"],
      label: "Cloudflare",
      detected: true,
    };
  }

  if (tech.some((t) => t.toLowerCase().includes("nginx"))) {
    return {
      primary: "nginx",
      relevant: ["nginx", "apache"],
      label: "Nginx",
      detected: true,
    };
  }

  if (tech.some((t) => t.toLowerCase().includes("express"))) {
    return {
      primary: "express",
      relevant: ["express", "nginx"],
      label: "Express",
      detected: true,
    };
  }

  return {
    primary: "nginx",
    relevant: ["nginx", "apache", "nextjs"],
    label: "",
    detected: false,
  };
}
