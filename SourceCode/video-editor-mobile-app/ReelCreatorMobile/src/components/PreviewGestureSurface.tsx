import React, { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PinchGestureHandler, State } from "react-native-gesture-handler";

type Props = {
  currentSec: number;
  isPlaying: boolean;
  zoomLevel: number;
  onSeek: (deltaSec: number) => void;
  onTogglePlay: () => void;
  onZoom: (nextZoom: number) => void;
};

export function PreviewGestureSurface({
  currentSec,
  isPlaying,
  zoomLevel,
  onSeek,
  onTogglePlay,
  onZoom
}: Props) {
  const leftLastTap = useRef(0);
  const rightLastTap = useRef(0);

  function onDoubleTap(side: "left" | "right") {
    const now = Date.now();
    const ref = side === "left" ? leftLastTap : rightLastTap;
    if (now - ref.current < 280) {
      onSeek(side === "left" ? -10 : 10);
    }
    ref.current = now;
  }

  return (
    <PinchGestureHandler
      onGestureEvent={(event) => {
        const scale = event.nativeEvent.scale;
        const next = Math.max(1, Math.min(6, Number((zoomLevel * scale).toFixed(2))));
        onZoom(next);
      }}
      onHandlerStateChange={(event) => {
        if (event.nativeEvent.state === State.END) {
          onZoom(Math.max(1, Math.min(6, zoomLevel)));
        }
      }}
    >
      <View style={styles.surface}>
        <Pressable style={styles.side} onPress={() => onDoubleTap("left")}>
          <Text style={styles.hint}>Double Tap{"\n"}-10s</Text>
        </Pressable>

        <Pressable style={styles.center} onPress={onTogglePlay}>
          <Text style={styles.centerText}>{isPlaying ? "Pause" : "Play"}</Text>
          <Text style={styles.meta}>
            {currentSec.toFixed(1)}s • zoom {zoomLevel.toFixed(1)}x
          </Text>
        </Pressable>

        <Pressable style={styles.side} onPress={() => onDoubleTap("right")}>
          <Text style={styles.hint}>Double Tap{"\n"}+10s</Text>
        </Pressable>
      </View>
    </PinchGestureHandler>
  );
}

const styles = StyleSheet.create({
  surface: {
    height: 180,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#32446e",
    backgroundColor: "#0d1426",
    flexDirection: "row",
    overflow: "hidden",
    marginTop: 10
  },
  side: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  center: {
    flex: 1.2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#172544"
  },
  centerText: {
    color: "#f0f5ff",
    fontWeight: "700",
    fontSize: 18
  },
  hint: {
    color: "#99afd8",
    textAlign: "center",
    fontSize: 12
  },
  meta: {
    color: "#8ba4d0",
    marginTop: 6,
    fontSize: 12
  }
});
