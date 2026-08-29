import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { avatarGradient, colors } from "@/theme/tokens";

const SIZES = { sm: 24, md: 34, lg: 48, xl: 72 } as const;
export type AvatarSize = keyof typeof SIZES;

interface AvatarProps {
  name: string;
  /** Index into the deterministic gradient set, so a person looks consistent. */
  seed: number;
  size?: AvatarSize;
  /** Ring used when avatars overlap in a stack, to separate them. */
  ringed?: boolean;
}

/**
 * A person, drawn as their initial over a deterministic gradient.
 *
 * Same eight gradients as the web `.avatar-N` classes. Real photos replace
 * this once media upload exists; until then nobody is shown a stock face.
 */
export function Avatar({ name, seed, size = "md", ringed = false }: AvatarProps) {
  const dimension = SIZES[size];
  const [from, to] = avatarGradient(seed);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <LinearGradient
      colors={[from, to]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.base,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          borderWidth: ringed ? 2 : 0,
        },
      ]}
      accessibilityRole="image"
      accessibilityLabel={name}
    >
      <Text style={[styles.initial, { fontSize: dimension * 0.42 }]}>{initial}</Text>
    </LinearGradient>
  );
}

interface AvatarStackProps {
  people: { name: string; seed: number }[];
  size?: AvatarSize;
  max?: number;
}

/** Overlapping faces — the social proof that makes an event feel real. */
export function AvatarStack({ people, size = "md", max = 4 }: AvatarStackProps) {
  const shown = people.slice(0, max);
  const overlap = SIZES[size] * 0.3;

  return (
    <View
      style={styles.stack}
      accessibilityRole="image"
      accessibilityLabel={
        people.length
          ? `${people.length} going, including ${shown.map((p) => p.name).join(", ")}`
          : "Nobody going yet"
      }
    >
      {shown.map((person, index) => (
        <View key={`${person.name}-${index}`} style={index > 0 ? { marginLeft: -overlap } : null}>
          <Avatar name={person.name} seed={person.seed} size={size} ringed />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderColor: colors.background,
  },
  initial: {
    color: colors.primaryForeground,
    fontWeight: "800",
  },
  stack: { flexDirection: "row", alignItems: "center" },
});
