import { Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";

const wrap: Style = {
  direction: "ltr",
};

function flattenStyles(style?: Style | Style[]): Style[] {
  if (style === undefined) {
    return [];
  }
  return Array.isArray(style) ? style : [style];
}

/**
 * Values that must stay LTR inside RTL locale: URLs, IDs, tokens, timestamps, code, scores.
 * Does not force Helvetica when caller passes fontFamily (required for Arabic-capable fonts).
 */
export function LtrText({ value, style }: { value: string; style?: Style | Style[] }) {
  const parts = flattenStyles(style);
  const merged: Style = { direction: "ltr", ...Object.assign({}, ...parts) };
  if (merged.fontFamily === undefined) {
    merged.fontFamily = "Helvetica";
  }

  return (
    <View style={wrap}>
      <Text style={merged} wrap>
        {value}
      </Text>
    </View>
  );
}
