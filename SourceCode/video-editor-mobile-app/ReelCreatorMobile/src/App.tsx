import DocumentPicker from "react-native-document-picker";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PreviewGestureSurface } from "./components/PreviewGestureSurface";
import { SearchSuggestions } from "./components/SearchSuggestions";
import { DebugLogPanel } from "./components/DebugLogPanel";
import { TemplateEngineService } from "./services/template/TemplateEngineService";
import { pickVideoAssets } from "./services/upload/UploadService";
import { ExportService } from "./services/export/ExportService";
import { CaptionSyncService } from "./services/audio/CaptionSyncService";
import { PreviewService } from "./services/video/PreviewService";
import { VideoProcessingService } from "./services/video/VideoProcessingService";
import { useProjectStore } from "./state/useProjectStore";
import { RenderEngine } from "./services/render/RenderEngine";
import { IntegrationHealthService } from "./services/integration/IntegrationHealthService";

export default function App(): JSX.Element {
  const { project, setProject, recentProjects, createNewProject, saveAsRecent } = useProjectStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState("Ready");
  const [isBusy, setBusy] = useState(false);
  const [previewMode, setPreviewMode] = useState<"low" | "full">("low");
  const [previewUri, setPreviewUri] = useState("");
  const [currentSec, setCurrentSec] = useState(0);
  const [isPlaying, setPlaying] = useState(false);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [queueStats, setQueueStats] = useState({ queued: 0, running: 0, failed: 0, completed: 0 });

  const templates = useMemo(() => TemplateEngineService.getAll(), []);
  const suggestions = useMemo(() => TemplateEngineService.getSuggestions(searchQuery), [searchQuery]);

  useEffect(() => {
    const timer = setInterval(() => {
      const snapshot = RenderEngine.queueSnapshot();
      setQueueStats({
        queued: snapshot.filter((j) => j.status === "queued").length,
        running: snapshot.filter((j) => j.status === "running").length,
        failed: snapshot.filter((j) => j.status === "failed").length,
        completed: snapshot.filter((j) => j.status === "completed").length
      });
    }, 700);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    void (async () => {
      const health = await IntegrationHealthService.checkAndroidPipeline();
      setStatus((prev) => `${prev} | ${health.message}`);
    })();
  }, []);

  async function onNewProject() {
    const next = createNewProject();
    await saveAsRecent(next);
    setStatus(`New project created: ${next.name}`);
  }

  async function onUploadVideos() {
    setBusy(true);
    setStatus("Picking videos...");
    try {
      const assets = await pickVideoAssets();
      const next = { ...project, assets };
      setProject(next);
      await saveAsRecent(next);
      setStatus(`Uploaded ${assets.length} video files.`);
    } catch (error) {
      setStatus(`Upload failed: ${(error as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function onRunProcessing() {
    if (!project.assets.length) {
      Alert.alert("Upload required", "Please upload videos first.");
      return;
    }
    setBusy(true);
    setStatus("FFmpeg processing started...");
    try {
      const clips = await VideoProcessingService.processAssets(project.assets);
      const next = { ...project, processedClips: clips };
      setProject(next);
      await saveAsRecent(next);
      setStatus(`Processing complete: ${clips.length} clips retained.`);
    } catch (error) {
      setStatus(`Processing failed: ${(error as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  function onAutoTemplate() {
    const selected = TemplateEngineService.autoSelectTemplate(project, searchQuery);
    setProject({ ...project, selectedTemplateId: selected.id });
    setStatus(`Auto-selected template: ${selected.name}`);
  }

  async function onAttachVoiceOver() {
    try {
      const file = await DocumentPicker.pickSingle({ type: [DocumentPicker.types.audio] });
      const voiceOverUri = file.fileCopyUri ?? file.uri;
      const next = { ...project, voiceOverUri };
      setProject(next);
      setStatus("Voice-over attached.");
    } catch (error) {
      setStatus(`Voice-over attach skipped: ${(error as Error).message}`);
    }
  }

  function onGenerateCaptions() {
    const transcript =
      "This is a generated voice over script for short video demo captions and sync testing.";
    const track = project.voiceOverUri
      ? CaptionSyncService.createWordByWordSync(transcript, Math.max(10, totalDurationSec()))
      : CaptionSyncService.createFallbackSubtitles(transcript);
    setProject({ ...project, captions: track });
    setStatus(track.mode === "word_by_word" ? "Word-by-word captions generated." : "Fallback subtitles generated.");
  }

  async function onPreview(mode: "low" | "full") {
    if (!project.processedClips.length) {
      Alert.alert("Processing required", "Run video processing first.");
      return;
    }
    setBusy(true);
    setPreviewMode(mode);
    setStatus(mode === "low" ? "Building low-res preview..." : "Preparing full preview...");
    try {
      const uri =
        mode === "low"
          ? await PreviewService.buildLowResPreview(project.processedClips)
          : await PreviewService.buildFullPreview(project.processedClips);
      setPreviewUri(uri);
      setStatus(`Preview ready (${mode === "low" ? "real-time low-res" : "full mode"}).`);
    } catch (error) {
      setStatus(`Preview failed: ${(error as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function onExport916() {
    setBusy(true);
    setStatus("Exporting 9:16 output for Instagram/Shorts...");
    try {
      const output = await ExportService.exportVerticalShort(project, searchQuery);
      setStatus(`Export complete: ${output}`);
    } catch (error) {
      setStatus(`Export failed: ${(error as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  function totalDurationSec() {
    return project.processedClips.reduce((sum, clip) => sum + clip.durationSec, 0);
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.h1}>Video Editor Android Core</Text>
          <Text style={styles.status}>{status}</Text>
          <Text style={styles.meta}>
            Queue - queued:{queueStats.queued} running:{queueStats.running} failed:{queueStats.failed} done:
            {queueStats.completed}
          </Text>

          <View style={styles.card}>
            <Text style={styles.h2}>MODULE 1 - Home/UI</Text>
            <View style={styles.row}>
              <ActionBtn label="New Project" onPress={onNewProject} disabled={isBusy} />
              <ActionBtn label="Upload Videos" onPress={onUploadVideos} disabled={isBusy} primary />
            </View>
            <Text style={styles.label}>Recent projects</Text>
            {recentProjects.slice(0, 3).map((recent) => (
              <Text key={recent.id} style={styles.meta}>
                • {recent.name} ({recent.processedClips.length} clips)
              </Text>
            ))}

            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search templates..."
              placeholderTextColor="#86a2d5"
              style={styles.input}
            />
            <SearchSuggestions
              suggestions={suggestions}
              onSelect={(label) => {
                setSearchQuery(label);
              }}
            />
            <View style={styles.row}>
              <ActionBtn label="Auto Select Template" onPress={onAutoTemplate} disabled={isBusy} />
            </View>

            <FlatList
              data={templates}
              horizontal
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.templateCard, project.selectedTemplateId === item.id && styles.templateCardActive]}
                  onPress={() => setProject({ ...project, selectedTemplateId: item.id })}
                >
                  <Text style={styles.templateTitle}>{item.name}</Text>
                  <Text style={styles.templateMeta}>
                    {item.textStyle} • {item.motionStyle} • {item.backgroundGameplay}
                  </Text>
                </Pressable>
              )}
              showsHorizontalScrollIndicator={false}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.h2}>MODULE 2 - Processing + Storage</Text>
            <Text style={styles.meta}>
              FFmpeg pipeline: auto-trim low activity, split {">"}2 min into 40 sec clips, discard {"<"}10 sec.
            </Text>
            <Text style={styles.meta}>Storage cap: 2GB with LRU deletion policy.</Text>
            <ActionBtn label="Run Processing" onPress={onRunProcessing} disabled={isBusy} primary />
          </View>

          <View style={styles.card}>
            <Text style={styles.h2}>MODULE 4 - Audio + Captions</Text>
            <Text style={styles.meta}>Voice-over is required before export.</Text>
            <View style={styles.row}>
              <ActionBtn label="Attach Voice-over" onPress={onAttachVoiceOver} disabled={isBusy} />
              <ActionBtn label="Generate Captions" onPress={onGenerateCaptions} disabled={isBusy} />
            </View>
            <Text style={styles.meta}>
              Caption mode: {project.captions?.mode ?? "none"} {project.voiceOverUri ? "(voice-over available)" : "(fallback mode only)"}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.h2}>MODULE 5 - Preview</Text>
            <View style={styles.row}>
              <ActionBtn label="Low-res Preview" onPress={() => onPreview("low")} disabled={isBusy} primary={previewMode === "low"} />
              <ActionBtn label="Full Preview" onPress={() => onPreview("full")} disabled={isBusy} primary={previewMode === "full"} />
            </View>
            <Text style={styles.meta}>Preview URI: {previewUri || "not generated"}</Text>
            <PreviewGestureSurface
              currentSec={currentSec}
              isPlaying={isPlaying}
              zoomLevel={timelineZoom}
              onSeek={(delta) => setCurrentSec((prev) => Math.max(0, prev + delta))}
              onTogglePlay={() => setPlaying((prev) => !prev)}
              onZoom={(next) => setTimelineZoom(next)}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.h2}>MODULE 6 - Export</Text>
            <Text style={styles.meta}>Export profile: 1080x1920 (9:16), Instagram Reels / YouTube Shorts ready.</Text>
            <ActionBtn label="Export 9:16" onPress={onExport916} disabled={isBusy} primary />
          </View>

          <View style={styles.card}>
            <Text style={styles.h2}>Debug Logging Panel</Text>
            <DebugLogPanel />
          </View>
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

function ActionBtn({
  label,
  onPress,
  disabled,
  primary
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.btn, primary && styles.btnPrimary, disabled && styles.btnDisabled]}>
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0d1426" },
  scroll: { padding: 14, gap: 10 },
  h1: { color: "#edf3ff", fontSize: 24, fontWeight: "700" },
  h2: { color: "#e2edff", fontSize: 16, fontWeight: "700", marginBottom: 8 },
  status: { color: "#98b0da", marginTop: 4, marginBottom: 6 },
  card: {
    backgroundColor: "#151f37",
    borderColor: "#2c3f6c",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8
  },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  btn: {
    borderRadius: 10,
    backgroundColor: "#25365e",
    paddingVertical: 9,
    paddingHorizontal: 12
  },
  btnPrimary: { backgroundColor: "#3c7dff" },
  btnDisabled: { opacity: 0.55 },
  btnText: { color: "#f0f5ff", fontWeight: "600" },
  label: { color: "#d9e8ff", fontWeight: "600", marginTop: 4 },
  meta: { color: "#9bb2da", fontSize: 12 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#314775",
    paddingHorizontal: 10,
    color: "#f0f5ff",
    backgroundColor: "#111a30"
  },
  templateCard: {
    width: 180,
    borderRadius: 10,
    backgroundColor: "#101a30",
    borderWidth: 1,
    borderColor: "#2c3f6c",
    padding: 10,
    marginRight: 8
  },
  templateCardActive: {
    borderColor: "#4f8cff"
  },
  templateTitle: { color: "#ebf2ff", fontWeight: "700" },
  templateMeta: { color: "#9db5e0", marginTop: 4, fontSize: 12 }
});
