import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { ProjectModel } from "../types";

const RECENT_KEY = "recent_projects_v1";

export function useProjectStore() {
  const [project, setProject] = useState<ProjectModel>({
    id: `project_${Date.now()}`,
    name: "Untitled Project",
    createdAt: Date.now(),
    assets: [],
    processedClips: []
  });
  const [recentProjects, setRecentProjects] = useState<ProjectModel[]>([]);

  useEffect(() => {
    void loadRecent();
  }, []);

  async function loadRecent() {
    const raw = await AsyncStorage.getItem(RECENT_KEY);
    if (!raw) return;
    try {
      setRecentProjects(JSON.parse(raw) as ProjectModel[]);
    } catch {
      setRecentProjects([]);
    }
  }

  async function saveAsRecent(next: ProjectModel) {
    const merged = [next, ...recentProjects.filter((p) => p.id !== next.id)].slice(0, 10);
    setRecentProjects(merged);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(merged));
  }

  function createNewProject() {
    const next: ProjectModel = {
      id: `project_${Date.now()}`,
      name: `Project ${new Date().toLocaleTimeString()}`,
      createdAt: Date.now(),
      assets: [],
      processedClips: []
    };
    setProject(next);
    return next;
  }

  return {
    project,
    setProject,
    recentProjects,
    createNewProject,
    saveAsRecent
  };
}
