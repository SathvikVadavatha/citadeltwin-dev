import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_blueprint_uploads",
  title: "List blueprint uploads",
  description:
    "List blueprint files the signed-in user has uploaded, optionally filtered to a single project.",
  inputSchema: {
    project_id: z
      .string()
      .optional()
      .describe("Optional project id to filter uploads by."),
    limit: z
      .number()
      .int()
      .optional()
      .describe("Maximum number of uploads to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ project_id, limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };

    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("blueprint_uploads")
      .select(
        "id, filename, original_filename, file_type, file_size, upload_status, project_id, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 25, 1), 100));

    if (project_id) query = query.eq("project_id", project_id);

    const { data, error } = await query;
    if (error)
      return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { uploads: data ?? [] },
    };
  },
});
