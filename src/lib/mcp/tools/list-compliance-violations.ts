import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_compliance_violations",
  title: "List compliance violations",
  description:
    "List building-code compliance violations visible to the signed-in user, newest first.",
  inputSchema: {
    upload_id: z
      .string()
      .optional()
      .describe("Optional blueprint upload id to filter violations by."),
    severity: z
      .enum(["low", "medium", "high", "critical"])
      .optional()
      .describe("Optional severity filter."),
    limit: z
      .number()
      .int()
      .optional()
      .describe("Maximum number of violations to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ upload_id, severity, limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };

    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("compliance_violations")
      .select(
        "id, violation_type, severity, status, description, remediation_suggestions, upload_id, detected_at",
      )
      .order("detected_at", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 25, 1), 100));

    if (upload_id) query = query.eq("upload_id", upload_id);
    if (severity) query = query.eq("severity", severity);

    const { data, error } = await query;
    if (error)
      return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { violations: data ?? [] },
    };
  },
});
