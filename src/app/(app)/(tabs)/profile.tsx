import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CarbonCard } from "@/components/relast/carbon-card";
import { Mascot } from "@/components/relast/mascot";
import { PrimaryButton } from "@/components/relast/primary-button";
import { Palette, Shadow } from "@/constants/palette";
import { CATEGORY_META, type Category } from "@/services/ai";
import { useApp } from "@/state/app-context";

type Filter = "all" | Category;

const FILTERS: { key: Filter; label: string; color: string }[] = [
  { key: "all", label: "All", color: Palette.mintDeep },
  { key: "sorter", label: "Sorter", color: Palette.moss },
  { key: "lifecycle", label: "Lifecycle", color: Palette.steel },
  { key: "food", label: "Food", color: Palette.olive },
];

const colorFor = (f: Filter) =>
  FILTERS.find((x) => x.key === f)?.color || Palette.border;

export default function ProfileScreen() {
  const { user, history, signOut } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const visible =
    filter === "all"
      ? history
      : history.filter((h) => h.response.category === filter);
  const scans = history.filter((h) => h.imageUri).length;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={visible}
        keyExtractor={(h) => h.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            <View style={styles.top}>
              <View style={styles.avatar}>
                <Mascot size={64} />
              </View>
              <Text style={styles.name}>{user?.name}</Text>
              {!!user?.email && <Text style={styles.email}>{user.email}</Text>}
            </View>

            <View style={styles.summary}>
              <Stat value={history.length} label="Questions" />
              <Stat value={scans} label="Photo scans" />
              <Stat value={history.length} label="Actions learned" />
            </View>
            <Text style={styles.sumText}>
              {history.length
                ? "Nice work — every question is a step toward wasting less."
                : "Ask your first question to start your sustainability journey."}
            </Text>
            <CarbonCard />
            <View style={styles.filterRow}>
              <Text style={styles.h2}>History</Text>
              <View style={styles.filters}>
                {FILTERS.map((f) => (
                <Pressable
                  key={f.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: filter === f.key }}
                  onPress={() => setFilter(f.key)}
                  style={[
                    styles.chip,
                    { backgroundColor: f.color },
                    filter !== f.key && styles.chipOff,
                  ]}
                >
                  <Text style={styles.chipText}>{f.label.toUpperCase()}</Text>
                </Pressable>
              ))}
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {history.length
              ? "Nothing here yet for this filter."
              : "No questions yet. Your answers will show up here."}
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: "/answer", params: { id: item.id } })
            }
            style={({ pressed }) => [
              styles.item,
              { borderColor: colorFor(item.response.category) },
              pressed && { opacity: 0.8 },
            ]}
          >
            {item.imageUri ? (
              <Image
                source={{ uri: item.imageUri }}
                style={styles.thumb}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.thumb, styles.thumbIcon]}>
                <Ionicons
                  name={
                    CATEGORY_META[item.response.category]?.icon ||
                    "document-text-outline"
                  }
                  size={24}
                  color={Palette.forest}
                />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {item.response.itemName}
              </Text>
              <Text style={styles.itemSub} numberOfLines={1}>
                {item.text || "Photo only"}
              </Text>
              <Text style={styles.itemMeta}>
                {CATEGORY_META[item.response.category]?.label || item.category}{" "}
                · {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Palette.muted} />
          </Pressable>
        )}
        ListFooterComponent={
          <PrimaryButton
            label="Log out"
            variant="solid"
            onPress={signOut}
            style={{ marginTop: 20, backgroundColor: Palette.danger }}
          />
        }
      />
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statNum}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.cream },
  list: { padding: 20, gap: 10 },
  top: { alignItems: "center", gap: 4 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Palette.tea,
    borderWidth: 4,
    borderColor: Palette.white,
    ...Shadow.card,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    color: Palette.forestDark,
    marginTop: 6,
  },
  email: { fontSize: 15, color: Palette.muted },
  summary: { flexDirection: "row", gap: 10 },
  stat: {
    flex: 1,
    backgroundColor: Palette.forest,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  statNum: { fontSize: 26, fontWeight: "800", color: Palette.tea },
  statLabel: {
    fontSize: 12,
    color: Palette.border,
    fontWeight: "600",
    textAlign: "center",
  },
  sumText: { color: Palette.muted, fontSize: 15, textAlign: "center" },
  h2: { fontSize: 35, fontWeight: "800", color: Palette.forestDark },
  filterRow: {flexDirection: 'column', gap: 10},
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  chipOff: { opacity: 0.45 },
  chipText: { fontSize: 12, fontWeight: "700", color: Palette.ink },
  empty: { color: Palette.muted, textAlign: "center", padding: 24 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Palette.card,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Palette.border,
    ...Shadow.card,
    padding: 12,
  },
  thumb: { width: 56, height: 56, borderRadius: 14 },
  thumbIcon: {
    backgroundColor: Palette.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitle: { fontSize: 16, fontWeight: "700", color: Palette.ink },
  itemSub: { fontSize: 14, color: Palette.muted },
  itemMeta: { fontSize: 12, color: Palette.muted, marginTop: 2 },
  filters: {flexDirection: 'row', flexWrap: 'wrap',gap: 8, marginTop:5, marginBottom: 10},
});
