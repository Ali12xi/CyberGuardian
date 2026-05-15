import type { ReactElement } from "react";
import { Document } from "@react-pdf/renderer";
import { ActionPlanPageV5 } from "@/lib/pdf/v5/pages/ActionPlanPage";
import { FindingsPageV5 } from "@/lib/pdf/v5/pages/FindingsPage";
import { ScorecardPageV5 } from "@/lib/pdf/v5/pages/ScorecardPage";
import { TechnicalPageV5 } from "@/lib/pdf/v5/pages/TechnicalPage";
import { ThreatIntelPageV5 } from "@/lib/pdf/v5/pages/ThreatIntelPage";
import { TrustPageV5 } from "@/lib/pdf/v5/pages/TrustPage";
import { ACTIONS_PER_PAGE, FINDINGS_PER_PAGE } from "@/lib/pdf/v5/constants";
import { chunkArray, type PdfReportDataV5 } from "@/lib/pdf/v5/mapV5";

export function PdfDocumentV5({ data }: { data: PdfReportDataV5 }): ReactElement {
  const findingChunks = chunkArray(data.findings, FINDINGS_PER_PAGE);
  const actionChunks = chunkArray(data.actions, ACTIONS_PER_PAGE);

  const pages: ReactElement[] = [];

  pages.push(<ScorecardPageV5 key="score" data={data} />);

  findingChunks.forEach((c, i) => {
    pages.push(<FindingsPageV5 key={`find-${i}`} chunk={c} data={data} pageIndex={i} />);
  });

  let actionOffset = 0;
  actionChunks.forEach((c, i) => {
    pages.push(
      <ActionPlanPageV5
        key={`act-${i}`}
        chunk={c}
        data={data}
        pageIndex={i}
        globalStartIndex={actionOffset}
      />,
    );
    actionOffset += c.length;
  });

  pages.push(<TechnicalPageV5 key="tech" data={data} />);
  pages.push(<ThreatIntelPageV5 key="intel" data={data} />);
  pages.push(<TrustPageV5 key="trust" data={data} />);

  return <Document>{pages}</Document>;
}
