/**
 * Per-owner n8n webhook resolution.
 *
 * With one set of save/update/recheck flows per person, each flow has its own
 * webhook URL. We resolve the right URL for the logged-in owner.
 *
 * Preferred config: `N8N_WEBHOOKS` as a JSON object keyed by owner id, e.g.
 *   {
 *     "maykel": { "save": "https://.../webhook/geos-save-to-sf",
 *                 "update": "https://.../webhook/geos-update-sf",
 *                 "recheck": "https://.../webhook/geos-lead-recheck" },
 *     "user2":  { "save": "...", "update": "...", "recheck": "..." }
 *   }
 *
 * Fallback (single-tenant / backwards compatible): the flat env vars
 * `N8N_SAVE_WEBHOOK_URL`, `N8N_UPDATE_WEBHOOK_URL`, `N8N_RECHECK_WEBHOOK_URL`.
 */

export interface OwnerWebhooks {
  save: string;
  update: string;
  recheck: string;
}

interface PartialOwnerWebhooks {
  save?: string;
  update?: string;
  recheck?: string;
}

function parseWebhookMap(): Record<string, PartialOwnerWebhooks> {
  const raw = process.env.N8N_WEBHOOKS;
  if (!raw?.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<string, PartialOwnerWebhooks> = {};
    for (const [owner, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!value || typeof value !== "object" || Array.isArray(value)) continue;
      const entry = value as Record<string, unknown>;
      out[owner] = {
        save: typeof entry.save === "string" ? entry.save : undefined,
        update: typeof entry.update === "string" ? entry.update : undefined,
        recheck: typeof entry.recheck === "string" ? entry.recheck : undefined,
      };
    }
    return out;
  } catch {
    return {};
  }
}

export function resolveN8nWebhooks(owner: string): OwnerWebhooks {
  const perOwner = parseWebhookMap()[owner] ?? {};
  return {
    save: perOwner.save || process.env.N8N_SAVE_WEBHOOK_URL || "",
    update: perOwner.update || process.env.N8N_UPDATE_WEBHOOK_URL || "",
    recheck: perOwner.recheck || process.env.N8N_RECHECK_WEBHOOK_URL || "",
  };
}
