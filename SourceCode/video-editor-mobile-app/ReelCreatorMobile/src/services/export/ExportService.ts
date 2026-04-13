import { ProjectModel } from "../../types";
import { RenderEngine } from "../render/RenderEngine";

export class ExportService {
  static async exportVerticalShort(project: ProjectModel, searchQuery = ""): Promise<string> {
    return RenderEngine.renderProject({ project, searchQuery });
  }
}
