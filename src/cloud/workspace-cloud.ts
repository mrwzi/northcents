import type { SupabaseClient } from "@supabase/supabase-js";
import { financialWorkspaceSchema } from "../v2/domain/schemas";
import type { FinancialWorkspace } from "../v2/domain/workspace";

export async function saveWorkspaceToCloud(
  client: SupabaseClient,
  userId: string,
  workspace: FinancialWorkspace,
): Promise<void> {
  const valid = financialWorkspaceSchema.parse(workspace);
  const { error } = await client.from("financial_workspaces").upsert(
    {
      workspace_id: valid.id,
      owner_id: userId,
      schema_version: valid.schemaVersion,
      workspace: valid,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "workspace_id" },
  );
  if (error) throw new Error("Cloud workspace could not be saved.");
}

export async function loadNewestCloudWorkspace(
  client: SupabaseClient,
): Promise<FinancialWorkspace | null> {
  const { data, error } = await client
    .from("financial_workspaces")
    .select("workspace")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Cloud workspace could not be loaded.");
  if (!data) return null;
  const result = financialWorkspaceSchema.safeParse(data.workspace);
  if (!result.success)
    throw new Error("The cloud workspace failed validation.");
  return result.data as unknown as FinancialWorkspace;
}

export async function deleteCloudWorkspaces(
  client: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await client
    .from("financial_workspaces")
    .delete()
    .eq("owner_id", userId);
  if (error) throw new Error("Cloud workspaces could not be deleted.");
}
