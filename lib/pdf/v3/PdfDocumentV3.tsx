import type { ReactElement } from "react";
import { Document } from "@react-pdf/renderer";
import { AnalyticsPageV3 } from "@/lib/pdf/v3/pages/AnalyticsPage";
import { CoverPageV3 } from "@/lib/pdf/v3/pages/CoverPage";
import { FindingsPageV3 } from "@/lib/pdf/v3/pages/FindingsPage";
import { InfraPageV3 } from "@/lib/pdf/v3/pages/InfraPage";
import { RecommendationsPageV3 } from "@/lib/pdf/v3/pages/RecommendationsPage";
import { ThreatIntelPageV3 } from "@/lib/pdf/v3/pages/ThreatIntelPage";
import { TrustPageV3 } from "@/lib/pdf/v3/pages/TrustPage";
import type { PdfReportDataV3 } from "@/lib/pdf/v3/mapV3";
import type { LocaleV3 } from "@/lib/pdf/v3/components";

function t(locale: LocaleV3, en: string, ar: string): string {
  return locale === "ar" ? ar : en;
}

export function PdfDocumentV3({
  data,
  locale,
  qrDataUrl,
}: {
  data: PdfReportDataV3;
  locale: LocaleV3;
  qrDataUrl: string | null;
}): ReactElement {
  const pages: ReactElement[] = [];

  pages.push(<CoverPageV3 key="cover" data={data} locale={locale} />);
  pages.push(<AnalyticsPageV3 key="analytics" data={data} locale={locale} />);

  data.findingPages.forEach((chunk, i) => {
    pages.push(
      <FindingsPageV3
        key={`find-${i}`}
        findings={chunk}
        locale={locale}
        sectionTitle={
          i === 0
            ? t(locale, "Critical Findings", "نتائج حرجة")
            : t(locale, "Critical Findings (continued)", "نتائج حرجة (تابع)")
        }
      />,
    );
  });

  pages.push(<ThreatIntelPageV3 key="intel" data={data} locale={locale} />);
  pages.push(<InfraPageV3 key="infra" data={data} locale={locale} />);

  data.recommendationPages.forEach((chunk, i) => {
    pages.push(
      <RecommendationsPageV3 key={`rec-${i}`} chunk={chunk} locale={locale} showIntro={i === 0} />,
    );
  });

  pages.push(<TrustPageV3 key="trust" data={data} locale={locale} qrDataUrl={qrDataUrl} />);

  return <Document>{pages}</Document>;
}
