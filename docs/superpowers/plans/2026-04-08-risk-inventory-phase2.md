# Risk Inventory Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add campaign-scoped document versioning, publication workflow, revision cloning, locked published snapshots, and official export support on top of the existing NR-01 risk inventory module.

**Architecture:** Extend the current inventory bounded context with a dedicated `risk_inventory_versions` snapshot model and make `risk_inventory_items` belong to a version instead of living directly as a campaign-level mutable list. Keep the existing risk-matrix domain logic intact, add version-aware repositories/services/routes, and evolve the portal UI from a flat item list into a revision-driven workflow with one active draft and one official published version per campaign.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Supabase Postgres, Zod, existing portal/auth/audit infrastructure, current risk inventory service/repository stack.

---

## File Structure

### Database and schema
- Create: `supabase/migrations/20260408130000_risk_inventory_versions_phase2.sql`
  Responsibility: create `risk_inventory_versions`, migrate `risk_inventory_items` to version ownership, add constraints for one `published` and one `draft` per campaign, add `origin_item_id`, indexes, and RLS updates.

### Domain and validation
- Modify: `src/lib/validation/risk-inventory.ts`
  Responsibility: add version-aware request schemas for listing versions, creating revisions, publishing revisions, and version-scoped item CRUD.

### Repositories and services
- Modify: `src/lib/server/repositories/risk-inventory-repository.ts`
  Responsibility: add version CRUD, version-scoped item listing, copy-from-published helpers, publish/archive mutations, export snapshot queries.
- Modify: `src/lib/server/services/risk-inventory-service.ts`
  Responsibility: enforce document workflow rules, RBAC by revision state, draft/published immutability, revision cloning, publish transaction orchestration.

### API routes
- Modify: `src/app/api/admin/risk-inventory/route.ts`
  Responsibility: switch list/create behavior to version-aware contract.
- Modify: `src/app/api/admin/risk-inventory/[id]/route.ts`
  Responsibility: enforce item editing only inside `draft` revisions.
- Create: `src/app/api/admin/risk-inventory/versions/route.ts`
  Responsibility: list campaign versions, create copied draft, create empty draft.
- Create: `src/app/api/admin/risk-inventory/versions/[id]/publish/route.ts`
  Responsibility: publish a draft with automatic approval metadata and archive of prior published revision.
- Create: `src/app/api/admin/risk-inventory/versions/[id]/route.ts`
  Responsibility: fetch a version detail payload for UI/export.
- Create: `src/app/api/admin/risk-inventory/versions/[id]/export/route.ts`
  Responsibility: return version-scoped export payload or PDF trigger input for the official published revision.

### Portal UI
- Modify: `src/app/inventario-riscos/page.tsx`
  Responsibility: load revision-centric data and pass it into the manager.
- Modify: `src/components/portal/risk-inventory-manager.tsx`
  Responsibility: add revision selector, revision badges, `Nova revisão`, `Nova revisão vazia`, publish confirmation, and published-only export action.
- Create: `src/components/portal/risk-inventory-version-panel.tsx`
  Responsibility: revision header with metadata, state badges, and primary actions.
- Create: `src/components/portal/risk-inventory-publish-dialog.tsx`
  Responsibility: collect optional `approval_note` and confirm publish side effects.

### Auth and docs
- Modify: `src/lib/auth/authorization.ts`
  Responsibility: add version/publish/export endpoint access matrix and clarify admin/hr/manager permissions.
- Modify: `src/lib/auth/authorization.test.ts`
  Responsibility: lock expected route permissions for new endpoints.
- Modify: `03_SOURCE_OF_TRUTH.md`
  Responsibility: document revision lifecycle, one draft / one published rule, and export semantics.
- Modify: `02_SDD.md`
  Responsibility: reflect versioned inventory schema and publication fields.
- Modify: `docs/ACTION_PLAN_COMPLETION.md`
  Responsibility: note Phase 2 document-control dependencies if this doc references inventory lifecycle.

### Verification targets
- Test: `src/lib/auth/authorization.test.ts`
- Run: `npm test -- src/lib/auth/authorization.test.ts`
- Run: `npm test -- src/lib/domain/risk-matrix/engine.test.ts`
- Run: `npm run build`

---

### Task 1: Add Versioned Inventory Schema

**Files:**
- Create: `supabase/migrations/20260408130000_risk_inventory_versions_phase2.sql`

- [ ] **Step 1: Write the migration for version snapshots**

```sql
create table if not exists public.risk_inventory_versions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  version_number integer not null,
  status text not null check (status in ('draft', 'published', 'archived')),
  title text,
  summary_note text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default timezone('utc', now()),
  published_by uuid references auth.users(id),
  published_at timestamptz,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  approval_note text,
  supersedes_version_id uuid references public.risk_inventory_versions(id),
  archived_at timestamptz,
  archived_reason text
);

create unique index if not exists risk_inventory_versions_campaign_version_number_idx
  on public.risk_inventory_versions (campaign_id, version_number);

create unique index if not exists risk_inventory_versions_one_published_idx
  on public.risk_inventory_versions (campaign_id)
  where status = 'published';

create unique index if not exists risk_inventory_versions_one_draft_idx
  on public.risk_inventory_versions (campaign_id)
  where status = 'draft';
```

- [ ] **Step 2: Re-home items under versions and preserve lineage for future diffing**

```sql
alter table public.risk_inventory_items
  add column risk_inventory_version_id uuid references public.risk_inventory_versions(id) on delete cascade,
  add column origin_item_id uuid;

create index if not exists risk_inventory_items_version_id_idx
  on public.risk_inventory_items (risk_inventory_version_id);

create index if not exists risk_inventory_items_origin_item_id_idx
  on public.risk_inventory_items (origin_item_id);
```

- [ ] **Step 3: Backfill existing rows into an initial published version per campaign**

```sql
insert into public.risk_inventory_versions (
  campaign_id,
  version_number,
  status,
  title,
  created_by,
  created_at,
  updated_by,
  updated_at,
  published_by,
  published_at,
  approved_by,
  approved_at,
  approval_note
)
select
  campaign_id,
  1,
  'published',
  'Versao inicial migrada da Fase 1',
  coalesce(min(created_by), min(updated_by)),
  min(created_at),
  coalesce(max(updated_by), max(created_by)),
  max(updated_at),
  coalesce(max(updated_by), max(created_by)),
  max(updated_at),
  coalesce(max(updated_by), max(created_by)),
  max(updated_at),
  'Migracao automatica da Fase 1'
from public.risk_inventory_items
where campaign_id is not null
group by campaign_id;

update public.risk_inventory_items items
set
  risk_inventory_version_id = versions.id,
  origin_item_id = items.id
from public.risk_inventory_versions versions
where versions.campaign_id = items.campaign_id
  and versions.version_number = 1
  and items.risk_inventory_version_id is null;
```

- [ ] **Step 4: Enforce not-null and clean old assumptions**

```sql
alter table public.risk_inventory_items
  alter column risk_inventory_version_id set not null;
```

Run: `supabase db push --yes`
Expected: migration applies without constraint errors in the local/dev target database

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260408130000_risk_inventory_versions_phase2.sql
git commit -m "feat: add risk inventory version snapshots"
```

### Task 2: Add Version-Aware Validation Contracts

**Files:**
- Modify: `src/lib/validation/risk-inventory.ts`

- [ ] **Step 1: Write the failing schema usage snippet in the validation module test area or temporary dev check**

```ts
import { z } from "zod";
import {
  createRiskInventoryRevisionSchema,
  publishRiskInventoryVersionSchema
} from "@/lib/validation/risk-inventory";

createRiskInventoryRevisionSchema.parse({ campaignId: "550e8400-e29b-41d4-a716-446655440000", mode: "copy_latest_published" });
publishRiskInventoryVersionSchema.parse({ versionId: "550e8400-e29b-41d4-a716-446655440000", approvalNote: "Revisao aprovada para vigencia." });
```

- [ ] **Step 2: Run build to verify the new symbols do not exist yet**

Run: `npm run build`
Expected: FAIL with missing exports from `@/lib/validation/risk-inventory`

- [ ] **Step 3: Add the version schemas and state enums**

```ts
export const riskInventoryVersionStatusSchema = z.enum(["draft", "published", "archived"]);

export const createRiskInventoryRevisionSchema = z.object({
  campaignId: z.string().uuid(),
  mode: z.enum(["copy_latest_published", "empty"])
});

export const publishRiskInventoryVersionSchema = z.object({
  versionId: z.string().uuid(),
  approvalNote: z.string().trim().max(1000).nullish().transform((value) => value || null)
});

export const riskInventoryVersionListSchema = z.object({
  campaignId: z.string().uuid()
});
```

- [ ] **Step 4: Make item schemas require a version id instead of direct campaign ownership in write flows**

```ts
export const riskInventorySchema = z.object({
  riskInventoryVersionId: z.string().uuid(),
  sector: optionalTrimmedText,
  unit: optionalTrimmedText,
  hazardCode: optionalPositiveInt,
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(4000),
  existingControls: optionalTrimmedText,
  responsibleName: optionalTrimmedText,
  status: z.enum(["open", "monitoring", "mitigating", "closed"]),
  probability: z.number().int().min(1).max(5),
  severity: z.number().int().min(1).max(5)
});
```

- [ ] **Step 5: Run build to verify the schemas compile**

Run: `npm run build`
Expected: PASS or the next failing references point to repository/service usage that still needs to be updated

- [ ] **Step 6: Commit**

```bash
git add src/lib/validation/risk-inventory.ts
git commit -m "feat: add risk inventory version schemas"
```

### Task 3: Extend the Repository Layer for Versions and Snapshot Queries

**Files:**
- Modify: `src/lib/server/repositories/risk-inventory-repository.ts`

- [ ] **Step 1: Add explicit types for versions and export rows**

```ts
export type RiskInventoryVersionRecord = {
  id: string;
  campaign_id: string;
  version_number: number;
  status: "draft" | "published" | "archived";
  title: string | null;
  summary_note: string | null;
  created_by: string;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
  published_by: string | null;
  published_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  approval_note: string | null;
  supersedes_version_id: string | null;
  archived_at: string | null;
  archived_reason: string | null;
};
```

- [ ] **Step 2: Add version lookup and listing helpers**

```ts
export async function listRiskInventoryVersions(campaignId: string): Promise<RiskInventoryVersionRecord[]> {}
export async function getRiskInventoryVersionById(id: string): Promise<RiskInventoryVersionRecord | null> {}
export async function getPublishedRiskInventoryVersion(campaignId: string): Promise<RiskInventoryVersionRecord | null> {}
export async function getDraftRiskInventoryVersion(campaignId: string): Promise<RiskInventoryVersionRecord | null> {}
```

- [ ] **Step 3: Add version creation and cloning helpers**

```ts
export async function createRiskInventoryVersion(input: {
  campaignId: string;
  versionNumber: number;
  status: "draft";
  title?: string | null;
  createdBy: string;
}) {}

export async function cloneRiskInventoryItemsIntoVersion(input: {
  sourceVersionId: string;
  targetVersionId: string;
  actorId: string;
}) {}
```

- [ ] **Step 4: Add publish/archive mutation helpers with single-responsibility signatures**

```ts
export async function archiveRiskInventoryVersion(input: {
  versionId: string;
  actorId: string;
  archivedReason: string;
}) {}

export async function publishRiskInventoryVersionRecord(input: {
  versionId: string;
  actorId: string;
  approvalNote: string | null;
  supersedesVersionId?: string | null;
}) {}
```

- [ ] **Step 5: Make item list queries version-scoped and export-safe**

```ts
export async function listRiskInventoryItems(filters: {
  riskInventoryVersionId?: string;
  campaignIds?: string[];
  riskClassification?: RiskInventoryClassification;
  sector?: string | null;
  unit?: string | null;
} = {}) {}
```

Run: `npm run build`
Expected: build progresses with repository signatures available for service integration

- [ ] **Step 6: Commit**

```bash
git add src/lib/server/repositories/risk-inventory-repository.ts
git commit -m "feat: add risk inventory version repository helpers"
```

### Task 4: Enforce Document Workflow in the Service Layer

**Files:**
- Modify: `src/lib/server/services/risk-inventory-service.ts`

- [ ] **Step 1: Add helper guards for mutable draft-only behavior**

```ts
function assertDraftVersion(version: RiskInventoryVersionRecord | null) {
  if (!version) throw new Error("NOT_FOUND");
  if (version.status !== "draft") throw new Error("VERSION_NOT_EDITABLE");
}
```

- [ ] **Step 2: Add list/detail services that return versions with their items**

```ts
export async function listRiskInventoryVersionsService(actor: PortalSession, input: unknown) {}
export async function getRiskInventoryVersionDetailService(actor: PortalSession, versionId: string) {}
```

- [ ] **Step 3: Add draft-creation service with copy and empty modes**

```ts
export async function createRiskInventoryRevisionService(actor: PortalSession, input: unknown) {
  const parsed = createRiskInventoryRevisionSchema.parse(input);
  assertRole(actor, parsed.mode === "empty" ? ["admin"] : ["admin", "hr"]);

  const existingDraft = await getDraftRiskInventoryVersion(parsed.campaignId);
  if (existingDraft) throw new Error("DRAFT_ALREADY_EXISTS");

  const published = await getPublishedRiskInventoryVersion(parsed.campaignId);
  const nextVersionNumber = (published?.version_number ?? 0) + 1;
  const draft = await createRiskInventoryVersion({
    campaignId: parsed.campaignId,
    versionNumber: nextVersionNumber,
    status: "draft",
    createdBy: actor.userId
  });

  if (parsed.mode === "copy_latest_published" && published) {
    await cloneRiskInventoryItemsIntoVersion({
      sourceVersionId: published.id,
      targetVersionId: draft.id,
      actorId: actor.userId
    });
  }

  return draft;
}
```

- [ ] **Step 4: Add publish service with automatic approval and prior archive**

```ts
export async function publishRiskInventoryVersionService(actor: PortalSession, input: unknown) {
  assertRole(actor, ["admin"]);
  const parsed = publishRiskInventoryVersionSchema.parse(input);
  const draft = await getRiskInventoryVersionById(parsed.versionId);
  assertDraftVersion(draft);

  const previousPublished = await getPublishedRiskInventoryVersion(draft.campaign_id);

  if (previousPublished) {
    await archiveRiskInventoryVersion({
      versionId: previousPublished.id,
      actorId: actor.userId,
      archivedReason: "superseded_by_new_publication"
    });
  }

  return publishRiskInventoryVersionRecord({
    versionId: draft.id,
    actorId: actor.userId,
    approvalNote: parsed.approvalNote,
    supersedesVersionId: previousPublished?.id ?? null
  });
}
```

- [ ] **Step 5: Rewire item create/update/delete to validate the parent version state before mutation**

```ts
const version = await getRiskInventoryVersionById(parsed.riskInventoryVersionId ?? before.risk_inventory_version_id);
assertDraftVersion(version);
```

Run: `npm run build`
Expected: build passes with service layer wired to version-aware repository functions

- [ ] **Step 6: Commit**

```bash
git add src/lib/server/services/risk-inventory-service.ts
git commit -m "feat: add risk inventory document workflow services"
```

### Task 5: Add Version API Routes and Rewire Existing Inventory Routes

**Files:**
- Modify: `src/app/api/admin/risk-inventory/route.ts`
- Modify: `src/app/api/admin/risk-inventory/[id]/route.ts`
- Create: `src/app/api/admin/risk-inventory/versions/route.ts`
- Create: `src/app/api/admin/risk-inventory/versions/[id]/route.ts`
- Create: `src/app/api/admin/risk-inventory/versions/[id]/publish/route.ts`
- Create: `src/app/api/admin/risk-inventory/versions/[id]/export/route.ts`

- [ ] **Step 1: Add the versions collection route**

```ts
export async function GET(request: Request) {
  const session = await requirePortalApiSession();
  const { searchParams } = new URL(request.url);
  const payload = await listRiskInventoryVersionsService(session, {
    campaignId: searchParams.get("campaignId")
  });

  return Response.json(payload);
}

export async function POST(request: Request) {
  const session = await requirePortalApiSession();
  const body = await request.json();
  const version = await createRiskInventoryRevisionService(session, body);
  return Response.json({ version }, { status: 201 });
}
```

- [ ] **Step 2: Add the publish route**

```ts
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requirePortalApiSession();
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const version = await publishRiskInventoryVersionService(session, {
    versionId: id,
    approvalNote: body.approvalNote ?? null
  });
  return Response.json({ version });
}
```

- [ ] **Step 3: Add the version detail and export routes**

```ts
export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requirePortalApiSession();
  const { id } = await context.params;
  const payload = await getRiskInventoryVersionDetailService(session, id);
  return Response.json(payload);
}
```

```ts
export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requirePortalApiSession();
  const { id } = await context.params;
  const payload = await exportRiskInventoryVersionService(session, id);
  return Response.json(payload);
}
```

- [ ] **Step 4: Make existing item routes require `riskInventoryVersionId` and surface version-state errors cleanly**

```ts
if (error instanceof Error && error.message === "VERSION_NOT_EDITABLE") {
  return Response.json({ error: "Apenas revisoes draft podem ser editadas." }, { status: 409 });
}
```

- [ ] **Step 5: Run build verification**

Run: `npm run build`
Expected: PASS with all new routes compiled

- [ ] **Step 6: Commit**

```bash
git add src/app/api/admin/risk-inventory/route.ts src/app/api/admin/risk-inventory/[id]/route.ts src/app/api/admin/risk-inventory/versions/route.ts src/app/api/admin/risk-inventory/versions/[id]/route.ts src/app/api/admin/risk-inventory/versions/[id]/publish/route.ts src/app/api/admin/risk-inventory/versions/[id]/export/route.ts
git commit -m "feat: add risk inventory version api routes"
```

### Task 6: Update Portal Authorization Rules

**Files:**
- Modify: `src/lib/auth/authorization.ts`
- Modify: `src/lib/auth/authorization.test.ts`

- [ ] **Step 1: Add endpoint matrix entries for version listing, creation, publish, and export**

```ts
{ method: "GET", path: "/api/admin/risk-inventory/versions", allowedRoles: ["admin", "hr", "manager"], scope: "campaign_scope", notes: "Lista revisoes conforme escopo da campanha." },
{ method: "POST", path: "/api/admin/risk-inventory/versions", allowedRoles: ["admin", "hr"], scope: "campaign_scope", notes: "Cria nova revisao draft por copia; revisao vazia validada no service." },
{ method: "POST", path: "/api/admin/risk-inventory/versions/[id]/publish", allowedRoles: ["admin"], scope: "campaign_scope", notes: "Publicacao oficial com aprovacao automatica." },
{ method: "GET", path: "/api/admin/risk-inventory/versions/[id]/export", allowedRoles: ["admin", "hr", "manager"], scope: "campaign_scope", notes: "Exporta apenas a revisao published permitida pelo escopo." },
```

- [ ] **Step 2: Add route permission assertions to the authorization test file**

```ts
expect(canAccessAdminEndpoint("admin", "POST", "/api/admin/risk-inventory/versions/[id]/publish")).toBe(true);
expect(canAccessAdminEndpoint("hr", "POST", "/api/admin/risk-inventory/versions/[id]/publish")).toBe(false);
expect(canAccessAdminEndpoint("manager", "GET", "/api/admin/risk-inventory/versions/[id]/export")).toBe(true);
```

- [ ] **Step 3: Run the targeted auth test**

Run: `npm test -- src/lib/auth/authorization.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth/authorization.ts src/lib/auth/authorization.test.ts
git commit -m "feat: add risk inventory version authorization rules"
```

### Task 7: Evolve the Portal UI to a Revision Workflow

**Files:**
- Modify: `src/app/inventario-riscos/page.tsx`
- Modify: `src/components/portal/risk-inventory-manager.tsx`
- Create: `src/components/portal/risk-inventory-version-panel.tsx`
- Create: `src/components/portal/risk-inventory-publish-dialog.tsx`

- [ ] **Step 1: Change the page loader to fetch versions plus selected version detail**

```tsx
const versionsResponse = await fetchVersionList({ campaignId: selectedCampaignId });
const selectedVersion = resolveSelectedVersion(versionsResponse.versions, searchParams.versionId);
const detailResponse = selectedVersion ? await fetchVersionDetail(selectedVersion.id) : null;
```

- [ ] **Step 2: Render a dedicated version panel above the inventory grid**

```tsx
<RiskInventoryVersionPanel
  versions={versions}
  selectedVersionId={selectedVersion?.id ?? null}
  sessionRole={session.role}
  onCreateRevision={handleCreateRevision}
  onCreateEmptyRevision={handleCreateEmptyRevision}
  onPublish={openPublishDialog}
  onExport={handleExport}
/>
```

- [ ] **Step 3: Lock form actions and inputs when the selected version is not `draft`**

```tsx
const isDraft = selectedVersion?.status === "draft";
const canCreate = sessionRole === "admin" && isDraft;
const canEdit = (sessionRole === "admin" || sessionRole === "hr") && isDraft;
const canDelete = sessionRole === "admin" && isDraft;
```

- [ ] **Step 4: Add the publish confirmation dialog with optional `approval_note`**

```tsx
<RiskInventoryPublishDialog
  open={isPublishDialogOpen}
  onClose={closePublishDialog}
  onConfirm={handlePublish}
  warning="Ao publicar, esta revisao fica imutavel e a versao published anterior sera arquivada automaticamente."
/>
```

- [ ] **Step 5: Surface version metadata in the UI**

```tsx
<p className="text-xs text-muted">Versao {version.version_number} • {version.status}</p>
<p className="text-sm text-muted">Publicado em {formatDate(version.published_at)} por {version.published_by ?? "-"}</p>
```

- [ ] **Step 6: Run build verification**

Run: `npm run build`
Expected: PASS with `/inventario-riscos` rendering revision controls and no type errors

- [ ] **Step 7: Commit**

```bash
git add src/app/inventario-riscos/page.tsx src/components/portal/risk-inventory-manager.tsx src/components/portal/risk-inventory-version-panel.tsx src/components/portal/risk-inventory-publish-dialog.tsx
git commit -m "feat: add risk inventory revision workflow ui"
```

### Task 8: Add Official Published Export Payload

**Files:**
- Modify: `src/lib/server/services/risk-inventory-service.ts`
- Modify: `src/lib/server/repositories/risk-inventory-repository.ts`
- Create: `src/app/api/admin/risk-inventory/versions/[id]/export/route.ts`

- [ ] **Step 1: Add a service that rejects export for non-published versions**

```ts
export async function exportRiskInventoryVersionService(actor: PortalSession, versionId: string) {
  const version = await getRiskInventoryVersionById(versionId);
  if (!version) throw new Error("NOT_FOUND");
  if (version.status !== "published") throw new Error("VERSION_NOT_EXPORTABLE");

  const items = await listRiskInventoryItems({ riskInventoryVersionId: versionId });
  return { version, items };
}
```

- [ ] **Step 2: Shape the export payload around the official snapshot only**

```ts
return {
  documentType: "risk_inventory_published_snapshot",
  campaign: payload.campaign,
  version: {
    id: payload.version.id,
    versionNumber: payload.version.version_number,
    publishedAt: payload.version.published_at,
    approvedAt: payload.version.approved_at,
    approvalNote: payload.version.approval_note
  },
  matrixCriteria: {
    formula: "NRO = Probabilidade x Severidade"
  },
  items: payload.items.map((item) => ({
    title: item.title,
    sector: item.sector,
    unit: item.unit,
    probability: item.probability,
    severity: item.severity,
    nro: item.nro,
    riskClassification: item.risk_classification,
    status: item.status
  }))
};
```

- [ ] **Step 3: Add route-level handling for non-published export attempts**

```ts
if (error instanceof Error && error.message === "VERSION_NOT_EXPORTABLE") {
  return Response.json({ error: "Apenas revisoes published podem ser exportadas." }, { status: 409 });
}
```

- [ ] **Step 4: Run build verification**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/services/risk-inventory-service.ts src/lib/server/repositories/risk-inventory-repository.ts src/app/api/admin/risk-inventory/versions/[id]/export/route.ts
git commit -m "feat: add risk inventory published export payload"
```

### Task 9: Update Product Documentation

**Files:**
- Modify: `03_SOURCE_OF_TRUTH.md`
- Modify: `02_SDD.md`
- Modify: `docs/ACTION_PLAN_COMPLETION.md`

- [ ] **Step 1: Document the version lifecycle in the source of truth**

```md
## Inventario/PGR por campanha

Cada campanha possui revisoes documentais do inventario com estados:
- draft
- published
- archived

Regras:
- apenas uma draft por campanha
- apenas uma published por campanha
- published e archived sao imutaveis
- publicar uma draft arquiva automaticamente a published anterior
```

- [ ] **Step 2: Update the SDD schema section with the new table and item ownership**

```md
### risk_inventory_versions
Campos: id, campaign_id, version_number, status, published_by, published_at, approved_by, approved_at, approval_note, supersedes_version_id, archived_at, archived_reason

### risk_inventory_items
A partir da Fase 2, cada item pertence a `risk_inventory_version_id`.
```

- [ ] **Step 3: Note the dependency boundary against future Phase 3 work**

```md
Fora da Fase 2:
- comparativo formal entre revisoes
- evidencia de eficacia dos controles
- PDF completo do PGR com anexos ampliados
- integracoes com treinamento, indicadores e eSocial
```

- [ ] **Step 4: Commit**

```bash
git add 03_SOURCE_OF_TRUTH.md 02_SDD.md docs/ACTION_PLAN_COMPLETION.md
git commit -m "docs: define phase2 inventory document workflow"
```

### Task 10: Final Verification

**Files:**
- Verify all files touched in Tasks 1-9

- [ ] **Step 1: Run the authorization test**

Run: `npm test -- src/lib/auth/authorization.test.ts`
Expected: PASS

- [ ] **Step 2: Run the existing matrix domain test to confirm no regression**

Run: `npm test -- src/lib/domain/risk-matrix/engine.test.ts`
Expected: PASS

- [ ] **Step 3: Run the production build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Re-check the Phase 2 requirements against the finished code**

Checklist:
- [ ] versionamento por campanha
- [ ] uma `draft` por campanha
- [ ] uma `published` por campanha
- [ ] `draft`, `published`, `archived`
- [ ] publicacao com `published_by`, `published_at`, `approved_by`, `approved_at`, `approval_note`
- [ ] arquivamento automatico da versao `published` anterior
- [ ] nova revisao por copia da ultima `published`
- [ ] nova revisao vazia apenas para `admin`
- [ ] itens pertencem a snapshot de versao
- [ ] apenas `draft` pode ser editada
- [ ] export mostra somente a versao vigente publicada

- [ ] **Step 5: Commit the final integration pass**

```bash
git add .
git commit -m "feat: implement risk inventory document versioning"
```

---

## Self-Review

### Spec coverage
- Versioning by campaign: covered in Tasks 1, 3, 4, 5, 7.
- `draft` / `published` / `archived`: covered in Tasks 1, 4, 7, 9.
- Automatic approval on publish: covered in Tasks 1 and 4.
- Automatic archive of previous published: covered in Task 4.
- Copy latest published to new draft: covered in Tasks 3 and 4.
- Empty revision restricted to admin: covered in Tasks 2, 4, 6, 7.
- Copy only consolidated items, not history: covered in Tasks 1, 3, 4.
- PDF/export only for official published revision: covered in Tasks 5 and 8.
- Prepare for future diff without exposing it now: covered in Task 1 via `origin_item_id` and in Task 9 as deferred scope.

### Placeholder scan
- No `TODO`, `TBD`, or “similar to Task N” placeholders remain.
- All code-changing steps contain explicit code blocks or function signatures.
- Every verification step contains an exact command and expected outcome.

### Type consistency
- Version status uses `draft | published | archived` consistently.
- Service/repository names use `RiskInventoryVersion` consistently.
- `riskInventoryVersionId` is used consistently as the item parent key in write flows.

Plan complete and saved to `docs/superpowers/plans/2026-04-08-risk-inventory-phase2.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
