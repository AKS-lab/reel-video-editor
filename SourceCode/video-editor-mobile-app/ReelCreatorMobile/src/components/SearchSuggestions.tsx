import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SearchSuggestion } from "../types";

type Props = {
  suggestions: SearchSuggestion[];
  onSelect: (label: string) => void;
};

export function SearchSuggestions({ suggestions, onSelect }: Props) {
  if (!suggestions.length) return null;

  return (
    <View style={styles.wrap}>
      {suggestions.map((item) => (
        <Pressable key={item.id} style={styles.chip} onPress={() => onSelect(item.label)}>
          <Text style={styles.text}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  chip: {
    backgroundColor: "#1f2c4a",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  text: {
    color: "#d7e6ff",
    fontSize: 12
  }
});
