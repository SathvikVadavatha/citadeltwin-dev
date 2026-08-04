import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProjectsTool from "./tools/list-projects";
import createProjectTool from "./tools/create-project";
import listBlueprintUploadsTool from "./tools/list-blueprint-uploads";
import listComplianceViolationsTool from "./tools/list-compliance-violations";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "citadeltwin",
  title: "citadeltwin",
  version: "0.1.0",
  instructions:
    "Tools for CitadelTwin, a civil-engineering digital twin platform. Use `list_projects` and `create_project` to work with the signed-in engineer's projects, `list_blueprint_uploads` to inspect uploaded blueprint files, and `list_compliance_violations` to review detected building-code issues.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listProjectsTool,
    createProjectTool,
    listBlueprintUploadsTool,
    listComplianceViolationsTool,
  ],
});
