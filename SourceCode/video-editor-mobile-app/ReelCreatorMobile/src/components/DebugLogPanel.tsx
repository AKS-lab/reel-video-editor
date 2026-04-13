import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DebugLogEntry, DebugLogger } from "../services/perf/DebugLogger";

export function DebugLogPanel() {
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    return DebugLogger.subscribe((items) => setLogs(items.slice(0, 40)));
  }, []);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Debug Logs ({logs.length})</Text>
        <View style={styles.row}>
          <Pressable onPress={() => setOpen((v) => !v)} style={styles.btn}>
            <Text style={styles.btnText}>{open ? "Hide" : "Show"}</Text>
          </Pressable>
          <Pressable
            onPress={() => DebugLogger.clear()}
            style={[styles.btn, { backgroundColor: "#3f2a2a", borderColor: "#754545" }]}
          >
            <Text style={styles.btnText}>Clear</Text>
          </Pressable>
        </View>
      </View>
      {open &&
        logs.map((log) => (
          <Text key={log.id} style={styles.logLine}>
            [{new Date(log.ts).toLocaleTimeString()}] {log.level.toUpperCase()} {log.source}: {log.message}
          </Text>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: "#3b4f7a",
    borderRadius: 10,
    backgroundColor: "#0f1728",
    padding: 10,
    marginTop: 8
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  title: { color: "#dbe8ff", fontWeight: "700" },
  row: { flexDirection: "row", gap: 8 },
  btn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#46608f",
    backgroundColor: "#203252",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  btnText: { color: "#d9e8ff", fontSize: 12 },
  logLine: { color: "#9db2d9", fontSize: 11, marginTop: 5 }
});
