import type { ReactElement } from "react";
import { Document } from "@react-pdf/renderer";
import { ActionPlanPageV4 } from "@/lib/pdf/v4/pages/ActionPlanPage";
import { AdditionalRisksPageV4 } from "@/lib/pdf/v4/pages/AdditionalRisksPage";
import { ExecutiveOverviewPageV4 } from "@/lib/pdf/v4/pages/ExecutiveOverviewPage";
import { TechnicalPageV4 } from "@/lib/pdf/v4/pages/TechnicalPage";
import { ThreatInfraPageV4 } from "@/lib/pdf/v4/pages/ThreatInfraPage";
import { TopRisksPageV4 } from "@/lib/pdf/v4/pages/TopRisksPage";
import { TrustPageV4 } from "@/lib/pdf/v4/pages/TrustPage";
import type { PdfReportDataV4 } from "@/lib/pdf/v4/mapV4";
import type { LocaleV4 } from "@/lib/pdf/v4/components";

export function PdfDocumentV4({
  data,
  locale,
  qrDataUrl,
}: {
  data: PdfReportDataV4;
  locale: LocaleV4;
  qrDataUrl: string | null;
}): ReactElement {
  const pages: ReactElement[] = [];

  pages.push(<ExecutiveOverviewPageV4 key="exec" data={data} locale={locale} />);
  pages.push(<TopRisksPageV4 key="risks" data={data} locale={locale} />);

  data.additionalRiskPages.forEach((chunk, i) => {
    pages.push(<AdditionalRisksPageV4 key={`more-risks-${i}`} chunk={chunk} locale={locale} pageIndex={i} />);
  });

  pages.push(<TechnicalPageV4 key="technical" data={data} locale={locale} />);

  if (data.actionPlanPages.length === 0) {
    pages.push(<ActionPlanPageV4 key="actions-0" chunk={[]} locale={locale} pageIndex={0} empty />);
  } else {
    data.actionPlanPages.forEach((chunk, i) => {
      pages.push(<ActionPlanPageV4 key={`actions-${i}`} chunk={chunk} locale={locale} pageIndex={i} />);
    });
  }

  pages.push(<ThreatInfraPageV4 key="intel" data={data} locale={locale} />);
  pages.push(<TrustPageV4 key="trust" data={data} locale={locale} qrDataUrl={qrDataUrl} />);

  return <Document>{pages}</Document>;
}
