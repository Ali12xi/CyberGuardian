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
  typo,
} from "@/lib/pdf/v6/constants";

export type LocaleV6 = "en" | "ar";

export function bf(locale: LocaleV6): Style {
  return { fontFamily: getPdfBodyFont(locale) };
}

const footerStyles = StyleSheet.create({
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
      lineHeight: 1.48,
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

export function LocaleText({
  locale,
  children,
  style,
  wrap: wrapProp,
}: {
  locale: LocaleV6;
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

export function LtrText({ value, style }: { value: string; style?: Style | Style[] }) {
  const merged: Style[] = [{ direction: "ltr" }];
  if (Array.isArray(style)) {
    merged.push(...style);
  } else if (style !== undefined) {
    merged.push(style);
  }
  return (
    <View style={{ direction: "ltr" }} wrap={false}>
      <Text style={merged} wrap={false}>
        {value}
      </Text>
    </View>
  );
}

export function FixedPageFooterV6({ locale }: { locale: LocaleV6 }) {
  const line = locale === "ar" ? BRAND_FOOTER_AR : BRAND_FOOTER_EN;
  return (
    <View style={footerStyles.footerBar} fixed>
      <LtrText
        value={line}
        style={[
          footerStyles.footerLeft,
          { fontSize: typo.footer, color: colors.muted, fontFamily: getPdfBodyFont("en") },
        ]}
      />
      <Text
        style={[footerStyles.footerRight, bf(locale)]}
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
