/**
 * Relast palette: Moss / Tea greens on a Beige canvas, with Indigo Velvet as the confident primary
 * and Midnight Violet for text. Semantic names are kept so every screen restyles from here.
 */
export const Palette = {
  // Brand swatches
  moss: "#82D173",
  paleGreen: "#F4FAD2",
  lightGreen: "#ABFAA9",
  steel: "#fabe8c",
  indigo: "#bc7833",
  violet: "#916507",
  charcoal: "#e7a15b",
  grey: "#bf8130",
  olive: "#899d69",
  tea: "#c7e7a7",
  beige: "#F2FBE0",

  // Semantic tokens
  cream: "#F4F7F3",
  card: "#FFFFFF",
  mint: "#d8efe0",
  mintDeep: "#C9DEE5",
  leaf: "#68a182",
  forest: "#3e724e",
  forestDark: "#245647",
  deepPine: "#1C2D23",
  ink: "#263a2e",
  muted: "#64747A",
  border: "#D8E3E2",
  sand: "#E9ECE4",
  clay: "#bd8e68",
  danger: "#b36a2f",
  dangerBg: "#FBE9E5",
  white: "#FFFFFF",
  disabled: "#8ac194",
} as const;

export const Radius = { card: 28, pill: 999, input: 20 } as const;

/** Soft, violet-tinted elevation shared by cards and floating controls. */
export const Shadow = {
  card: {
    shadowColor: "#a7815d",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
} as const;
