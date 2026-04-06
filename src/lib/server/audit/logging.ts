import type { PortalSession } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/server/supabase/admin";

export async function writeAuditLog(params: {
  actor: PortalSession;
  entityType: string;
  entityId: string;
  action: string;
  beforeJson?: unknown;
  afterJson?: unknown;
}) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: params.actor.userId,
    actor_role: params.actor.role,
    entity_type: params.entityType,
    entity_id: params.entityId,
    action: params.action,
    before_json: params.beforeJson ?? null,
    after_json: params.afterJson ?? null
  });

  if (error) throw error;
}
