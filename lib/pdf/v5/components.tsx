import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { getPdfBodyFont } from "@/lib/pdf/phaseB/pdfFonts";
import {
  A4_W,
  BRAND_FOOTER_AR,
  BRAND_FOOTER_EN,
  colors,
  CONTENT_W,
  FOOTER_H,
  FOOTER_RESERVE,
  MARGIN,
  SEVERITY_STYLES,
  typo,
} from "@/lib/pdf/v5/constants";
import { normalizeArabicText } from "@/lib/pdf/v5/mapV5";

export type LocaleV5 = "en" | "ar";

export function bf(locale: LocaleV5): Style {
  return { fontFamily: getPdfBodyFont(locale) };
}

export function wrapLrmDigits(s: string): string {
  return s.replace(/\d+/g, (n) => `\u200e${n}\u200e`);
}

const s = StyleSheet.create({
  footerBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: A4_W,
    height: FOOTER_H,
    backgroundColor: colors.deepBg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: MARGIN,
  },
  footerLeft: { fontSize: typo.footer, color: colors.muted, maxWidth: CONTENT_W * 0.62 },
  footerRight: { fontSize: typo.footer, color: colors.muted },
});

/** English narrative — Inter, no letterSpacing (avoids broken Latin in PDF). */
export function EnText({
  children,
  style,
  wrap: wrapProp,
}: {
  children: ReactNode;
  style?: Style | Style[];
  wrap?: boolean;
}) {
  const merged: Style[] = [
    {
      fontFamily: getPdfBodyFont("en"),
      letterSpacing: 0,
      lineHeight: 1.45,
      color: colors.white,
    },
  ];
  if (Array.isArray(style)) {
    merged.push(...style);
  } else if (style !== undefined) {
    merged.push(style);
  }
  return (
    <Text style={merged} wrap={wrapProp}>
      {children}
    </Text>
  );
}

/** Arabic narrative — NotoSansArabic, letterSpacing 0, lineHeight ≤ 1.5. No direction on Text. */
export function ArText({
  children,
  style,
  wrap: wrapProp,
}: {
  children: ReactNode;
  style?: Style | Style[];
  wrap?: boolean;
}) {
  const merged: Style[] = [
    {
      fontFamily: getPdfBodyFont("ar"),
      letterSpacing: 0,
      lineHeight: 1.45,
      textAlign: "right",
      color: colors.white,
    },
  ];
  if (Array.isArray(style)) {
    merged.push(...style);
  } else if (style !== undefined) {
    merged.push(style);
  }
  return (
    <Text style={merged} wrap={wrapProp}>
      {children}
    </Text>
  );
}

/** Human-readable narrative only — never for IDs, URLs, code, or hashes. */
export function LocaleText({
  locale,
  children,
  style,
  wrap: wrapProp,
}: {
  locale: LocaleV5;
  children: ReactNode;
  style?: Style | Style[];
  wrap?: boolean;
}) {
  return locale === "ar" ? (
    <ArText style={style} wrap={wrapProp}>
      {children}
    </ArText>
  ) : (
    <EnText style={style} wrap={wrapProp}>
      {children}
    </EnText>
  );
}

/**
 * Section / page title — RTL on parent View only (react-pdf).
 * Sprint 3: wire FindingsPage / ActionPlanPage titles through this helper.
 */
export function SectionTitleV5({
  title,
  locale,
  style,
}: {
  title: string;
  locale: LocaleV5;
  style?: Style | Style[];
}) {
  const t = locale === "ar" ? normalizeArabicText(title) : title;
  const row: Style = {
    flexDirection: "row",
    justifyContent: locale === "ar" ? "flex-end" : "flex-start",
    width: "100%",
  };
  const titleStyles: Style[] = [{ fontSize: typo.section, fontWeight: 500, color: colors.white }];
  if (style !== undefined) {
    if (Array.isArray(style)) {
      titleStyles.push(...style);
    } else {
      titleStyles.push(style);
    }
  }
  if (locale === "ar") {
    return (
      <View style={row} wrap={false}>
        <View style={{ direction: "rtl", maxWidth: CONTENT_W }} wrap={false}>
          <LocaleText locale={locale} style={titleStyles} wrap>
            {t}
          </LocaleText>
        </View>
      </View>
    );
  }
  return (
    <View style={row} wrap={false}>
      <LocaleText locale={locale} style={titleStyles} wrap>
        {t}
      </LocaleText>
    </View>
  );
}

type SeverityTier = keyof typeof SEVERITY_STYLES;

function toSeverityTier(sev: string): SeverityTier {
  const u = sev.toLowerCase();
  if (u === "critical") {
    return "critical";
  }
  if (u === "high") {
    return "high";
  }
  if (u === "medium") {
    return "medium";
  }
  return "low";
}

/**
 * Severity hierarchy for finding cards — Sprint 3: apply in FindingsPage card root + title + badge.
 * Typography-only; does not change chunk sizes or page routing.
 */
export function severitySurfaceStyles(severity: string): {
  card: Style;
  badge: Style;
  badgeText: Style;
  title: Style;
  layerOpacity: number;
} {
  const t = SEVERITY_STYLES[toSeverityTier(severity)];
  return {
    card: {
      borderLeftWidth: t.cardBorderWidth,
      borderLeftColor: t.borderColor,
      paddingVertical: t.cardPaddingV,
      paddingHorizontal: t.cardPaddingH,
      opacity: t.layerOpacity,
    },
    badge: {
      backgroundColor: t.badgeBg,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 4,
      alignSelf: "flex-start",
    },
    badgeText: {
      fontSize: t.badgeFontSize,
      fontWeight: 700,
      color: t.badgeColor,
    },
    title: {
      fontSize: t.titleSize,
      fontWeight: t.titleWeight,
      color: colors.white,
    },
    layerOpacity: t.layerOpacity,
  };
}

/** LTR wrapper for URLs, tokens, timestamps, snippets, grades — unchanged authority for technical data. */
export function LtrText({ value, style }: { value: string; style?: Style | Style[] }) {
  const base: Style = { direction: "ltr" };
  const merged: Style[] = [base];
  if (Array.isArray(style)) {
    merged.push(...style);
  } else if (style !== undefined) {
    merged.push(style);
  }
  return (
    <View style={{ direction: "ltr" }}>
      <Text style={merged} wrap>
        {value}
      </Text>
    </View>
  );
}

export function FixedPageFooterV5({ locale }: { locale: LocaleV5 }) {
  const footerLine = locale === "ar" ? BRAND_FOOTER_AR : BRAND_FOOTER_EN;
  return (
    <View style={s.footerBar} fixed>
      <LtrText
        value={footerLine}
        style={[
          s.footerLeft,
          { fontSize: typo.footer, color: colors.muted, fontFamily: getPdfBodyFont("en") },
        ]}
      />
      <Text
        style={[s.footerRight, bf(locale)]}
        render={({ pageNumber, totalPages }) =>
          locale === "ar"
            ? `\u200eصفحة \u200e${pageNumber}\u200e من \u200e${totalPages}\u200e`
            : `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  );
}

export function footerReservePt(): number {
  return FOOTER_RESERVE;
}
