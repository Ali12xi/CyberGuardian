import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { A4, contentWidth, margin, pageCount, palette } from "@/lib/pdf/phaseA/constants";
import { LtrText } from "@/lib/pdf/phaseA/LtrText";

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: margin,
    left: margin,
    width: contentWidth,
    borderTopWidth: 1,
    borderTopColor: palette.separator,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  left: {
    fontSize: 8,
    color: palette.textMuted,
    maxWidth: contentWidth * 0.62,
  },
  right: {
    fontSize: 8,
    color: palette.textMuted,
  },
});

export function PageFooter({ pageIndex }: { pageIndex: number }) {
  const rightLabel = `Page ${pageIndex} of ${pageCount}`;

  return (
    <View style={styles.bar} fixed>
      <Text style={styles.left}>CyberGurdian AI — External Security Report</Text>
      <LtrText value={rightLabel} style={styles.right} />
    </View>
  );
}

/** Reserve space so body does not run under the fixed footer. */
export function footerReservePt(): number {
  return 36;
}
