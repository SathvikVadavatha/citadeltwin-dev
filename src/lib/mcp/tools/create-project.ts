import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_project",
  title: "Create project",
  description:
    "Create a new CitadelTwin project owned by the signed-in user.",
  inputSchema: {
    name: z.string().trim().describe("Project name."),
    description: z
      .string()
      .trim()
      .optional()
      .describe("Optional project description."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ name, description }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    if (!name)
      return { content: [{ type: "text", text: "A project name is required." }], isError: true };

    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("projects")
      .insert({ name, description: description ?? null, owner_id: ctx.getUserId()! })
      .select("id, name, description, created_at")
      .single();

    if (error)
      return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { project: data },
    };
  },
});
