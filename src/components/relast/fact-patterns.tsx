import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { Palette } from "@/constants/palette";

type IconName = keyof typeof Ionicons.glyphMap;

interface PatternProps {
  icons: IconName[];
}

const SCATTER_CONFIGS = [
  { top: "8%", left: "12%", rotate: "-18deg", size: 32 },
  { top: "15%", left: "70%", rotate: "24deg", size: 38 },
  { top: "32%", left: "35%", rotate: "42deg", size: 28 },
  { top: "22%", left: "88%", rotate: "-12deg", size: 34 },
  { top: "48%", left: "8%", rotate: "15deg", size: 36 },
  { top: "42%", left: "58%", rotate: "-35deg", size: 40 },
  { top: "65%", left: "75%", rotate: "20deg", size: 30 },
  { top: "78%", left: "22%", rotate: "-22deg", size: 35 },
  { top: "85%", left: "62%", rotate: "10deg", size: 32 },
  { top: "10%", left: "45%", rotate: "6deg", size: 26 },
  { top: "58%", left: "38%", rotate: "-18deg", size: 38 },
  { top: "82%", left: "5%", rotate: "25deg", size: 30 },
] as const;

export function FactPattern({ icons }: PatternProps) {
  return (
    <View style={styles.container} pointerEvents="none">
      {SCATTER_CONFIGS.map((config, index) => {
        const icon = icons[index % icons.length];
        return (
          <View
            key={index}
            style={[
              styles.iconWrapper,
              {
                top: config.top,
                left: config.left,
                transform: [{ rotate: config.rotate }],
              },
            ]}
          >
            {/* Using Palette.clay (#bd8e68) for a soft, warm brownish icon watermark */}
            <Ionicons name={icon} size={config.size} color={Palette.danger} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    opacity: 0.16, // Warm brownish icons at 0.16 opacity show clearly on light green
    overflow: "hidden",
  },
  iconWrapper: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
});
