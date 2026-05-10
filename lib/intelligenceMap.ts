import {
  remediationMap,
  type LocalizedText,
  type RemediationFindingId,
  type RemediationSeverity,
} from "@/lib/remediation";

export type IntelligenceSeverity = RemediationSeverity;

export type IntelligenceEntry = {
  id: string;
  technical: LocalizedText;
  impact: LocalizedText;
  remediation: LocalizedText;
  severity: IntelligenceSeverity;
  estimatedFixTime: LocalizedText;
};

function buildIntelligenceMap(): Record<RemediationFindingId, IntelligenceEntry> {
  const entries = {} as Record<RemediationFindingId, IntelligenceEntry>;

  (Object.keys(remediationMap) as RemediationFindingId[]).forEach((id) => {
    const remediation = remediationMap[id];

    entries[id] = {
      id: remediation.id,
      technical: remediation.title,
      impact: remediation.businessImpact,
      remediation: remediation.recommendation,
      severity: remediation.severity,
      estimatedFixTime: remediation.estimatedFixTime,
    };
  });

  return entries;
}

export const intelligenceMap = buildIntelligenceMap();

export type IntelligenceFindingId = keyof typeof intelligenceMap;
