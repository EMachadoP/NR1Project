# Risk Inventory Matrix Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a first-class NR-01 risk inventory module with Probability × Severity matrix, NRO calculation, RBAC-aware editing, audit history, filters, and criteria documentation in the portal.

**Architecture:** Add a dedicated `risk_inventory_items` bounded context instead of overloading the existing survey engine. Keep NRO calculation isolated in a new domain module, expose CRUD through admin APIs, and render a focused portal UI with a matrix widget and criteria panel.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Supabase, Zod, existing portal shell/components, existing audit log infrastructure.

---

## File Structure

### New database artifacts
- Create: `supabase/migrations/20260408090000_risk_inventory_matrix_phase1.sql`
  Responsibility: create `risk_inventory_items`, `risk_inventory_history`, constraints, indexes, RLS, helper trigger/function for updated timestamps.

### New domain and validation artifacts
- Create: `src/lib/domain/risk-matrix/types.ts`
  Responsibility: shared types for probability, severity, NRO, classification.
- Create: `src/lib/domain/risk-matrix/engine.ts`
  Responsibility: deterministic NRO calculation, classification, matrix cell metadata.
- Create: `src/lib/domain/risk-matrix/engine.test.ts`
  Responsibility: contract tests for NRO math, boundaries, labels, colors.
- Create: `src/lib/validation/risk-inventory.ts`
  Responsibility: Zod schemas for create/update/filter payloads and role-sensitive fields.

### New server/repository/service artifacts
- Create: `src/lib/server/repositories/risk-inventory-repository.ts`
  Responsibility: CRUD queries, filter/sort, history writes, summary aggregation.
- Create: `src/lib/server/services/risk-inventory-service.ts`
  Responsibility: RBAC enforcement, derived field recalculation, repository orchestration.

### New API routes
- Create: `src/app/api/admin/risk-inventory/route.ts`
  Responsibility: list/create risk inventory items.
- Create: `src/app/api/admin/risk-inventory/[id]/route.ts`
  Responsibility: get/update/delete a single risk inventory item.
- Create: `src/app/api/admin/risk-inventory/criteria/route.ts`
  Responsibility: serve matrix criteria definitions for the UI.

### New portal UI
- Create: `src/app/inventario-riscos/page.tsx`
  Responsibility: page composition, filters, summary, list.
- Create: `src/app/inventario-riscos/[id]/page.tsx`
  Responsibility: item edit/view page.
- Create: `src/components/portal/risk-inventory-manager.tsx`
  Responsibility: list, filters, create action, row interactions.
- Create: `src/components/portal/risk-inventory-form.tsx`
  Responsibility: create/edit form with role-aware field locking.
- Create: `src/components/portal/risk-matrix-grid.tsx`
  Responsibility: reusable 5x5 visual matrix with highlighted cell.
- Create: `src/components/portal/risk-classification-badge.tsx`
  Responsibility: consistent badge rendering for Baixo/Medio/Alto/Critico.
- Create: `src/components/portal/risk-matrix-criteria-panel.tsx`
  Responsibility: modal/panel showing NR-01 criteria tables and formula.

### Existing files to modify
- Modify: `src/components/portal/portal-shell.tsx`
  Responsibility: add navigation entry for the risk inventory module.
- Modify: `src/lib/auth/authorization.ts`
  Responsibility: add endpoint access matrix entries and helper role checks for risk inventory actions.
- Modify: `src/lib/server/audit/logging.ts`
  Responsibility: reuse existing audit logging with new entity types/actions.
- Modify: `docs/GAP_ANALYSIS.md`
  Responsibility: mark phase 1 inventory/matrix coverage after implementation.
- Modify: `03_SOURCE_OF_TRUTH.md`
  Responsibility: define matrix formula, probability/severity scales, role rules, and criteria.

### Verification targets
- Test: `src/lib/domain/risk-matrix/engine.test.ts`
- Test: new API route behavior via targeted service/repository tests if needed
- Run: `npm test -- src/lib/domain/risk-matrix/engine.test.ts`
- Run: `npm run build`

---

### Task 1: Add the Risk Matrix Domain Contract

**Files:**
- Create: `src/lib/domain/risk-matrix/types.ts`
- Create: `src/lib/domain/risk-matrix/engine.ts`
- Create: `src/lib/domain/risk-matrix/engine.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { classifyNro, computeNro } from "@/lib/domain/risk-matrix/engine";

describe("risk matrix engine", () => {
  it("computes nro as probability times severity", () => {
    expect(computeNro({ probability: 4, severity: 5 })).toBe(20);
  });

  it("classifies low range correctly", () => {
    expect(classifyNro(4)).toMatchObject({ label: "Baixo", colorToken: "green" });
  });

  it("classifies medium, high and critical boundaries correctly", () => {
    expect(classifyNro(5).label).toBe("Medio");
    expect(classifyNro(10).label).toBe("Alto");
    expect(classifyNro(15).label).toBe("Critico");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/domain/risk-matrix/engine.test.ts`
Expected: FAIL with module not found for `@/lib/domain/risk-matrix/engine`

- [ ] **Step 3: Write minimal implementation**

```ts
export type MatrixClassification = {
  label: "Baixo" | "Medio" | "Alto" | "Critico";
  colorToken: "green" | "yellow" | "orange" | "red";
};

export function computeNro(input: { probability: number; severity: number }) {
  return input.probability * input.severity;
}

export function classifyNro(nro: number): MatrixClassification {
  if (nro >= 1 && nro <= 4) return { label: "Baixo", colorToken: "green" };
  if (nro >= 5 && nro <= 9) return { label: "Medio", colorToken: "yellow" };
  if (nro >= 10 && nro <= 14) return { label: "Alto", colorToken: "orange" };
  return { label: "Critico", colorToken: "red" };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/domain/risk-matrix/engine.test.ts`
Expected: PASS with 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/lib/domain/risk-matrix/types.ts src/lib/domain/risk-matrix/engine.ts src/lib/domain/risk-matrix/engine.test.ts
git commit -m "feat: add risk matrix domain engine"
```

### Task 2: Add Database Tables and Constraints

**Files:**
- Create: `supabase/migrations/20260408090000_risk_inventory_matrix_phase1.sql`

- [ ] **Step 1: Write the migration with explicit constraints**

```sql
create table if not exists public.risk_inventory_items (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete set null,
  sector text,
  unit text,
  hazard_code integer,
  title text not null,
  description text not null,
  existing_controls text,
  responsible_name text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'mitigated', 'archived')),
  probability integer not null check (probability between 1 and 5),
  severity integer not null check (severity between 1 and 5),
  nro integer not null check (nro between 1 and 25),
  risk_classification text not null check (risk_classification in ('Baixo', 'Medio', 'Alto', 'Critico')),
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.risk_inventory_history (
  id uuid primary key default gen_random_uuid(),
  risk_inventory_item_id uuid not null references public.risk_inventory_items(id) on delete cascade,
  actor_id uuid not null references auth.users(id),
  actor_role text not null,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default timezone('utc', now())
);
```

- [ ] **Step 2: Add indexes and RLS policies in the same migration**

```sql
create index if not exists risk_inventory_items_campaign_id_idx on public.risk_inventory_items (campaign_id);
create index if not exists risk_inventory_items_sector_unit_idx on public.risk_inventory_items (sector, unit);
create index if not exists risk_inventory_items_nro_idx on public.risk_inventory_items (nro desc);
create index if not exists risk_inventory_items_classification_idx on public.risk_inventory_items (risk_classification);

alter table public.risk_inventory_items enable row level security;
alter table public.risk_inventory_history enable row level security;
```

- [ ] **Step 3: Run migration verification locally**

Run: `npx supabase db lint`
Expected: no SQL syntax errors

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260408090000_risk_inventory_matrix_phase1.sql
git commit -m "feat: add risk inventory tables"
```

### Task 3: Add Validation and RBAC Rules

**Files:**
- Create: `src/lib/validation/risk-inventory.ts`
- Modify: `src/lib/auth/authorization.ts`

- [ ] **Step 1: Write the failing validation test inline in the engine test file or a new test file**

```ts
import { describe, expect, it } from "vitest";
import { riskInventoryCreateSchema } from "@/lib/validation/risk-inventory";

describe("risk inventory validation", () => {
  it("accepts probability and severity in the 1 to 5 range", () => {
    expect(() => riskInventoryCreateSchema.parse({
      title: "Sobrecarga",
      description: "Volume excessivo",
      probability: 4,
      severity: 3
    })).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/domain/risk-matrix/engine.test.ts`
Expected: FAIL with module not found for `@/lib/validation/risk-inventory`

- [ ] **Step 3: Write minimal schema and RBAC entries**

```ts
import { z } from "zod";

export const riskInventoryCreateSchema = z.object({
  campaignId: z.string().uuid().optional().nullable(),
  sector: z.string().trim().nullable().optional(),
  unit: z.string().trim().nullable().optional(),
  hazardCode: z.number().int().positive().optional().nullable(),
  title: z.string().min(1),
  description: z.string().min(1),
  existingControls: z.string().optional().nullable(),
  responsibleName: z.string().optional().nullable(),
  status: z.enum(["open", "in_progress", "mitigated", "archived"]).default("open"),
  probability: z.number().int().min(1).max(5),
  severity: z.number().int().min(1).max(5)
});
```

Add to `ADMIN_ENDPOINT_ACCESS_MATRIX`:

```ts
{ method: "GET", path: "/api/admin/risk-inventory", allowedRoles: ["admin", "hr", "manager"], scope: "campaign_scope", notes: "Leitura do inventario respeita escopo." },
{ method: "POST", path: "/api/admin/risk-inventory", allowedRoles: ["admin", "hr"], scope: "global", notes: "Criacao do inventario restrita a perfis administrativos." },
{ method: "PATCH", path: "/api/admin/risk-inventory/[id]", allowedRoles: ["admin", "hr"], scope: "global", notes: "Edicao administrativa do inventario." },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/domain/risk-matrix/engine.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/validation/risk-inventory.ts src/lib/auth/authorization.ts
git commit -m "feat: add risk inventory validation and access rules"
```

### Task 4: Add Repository and Service Layer

**Files:**
- Create: `src/lib/server/repositories/risk-inventory-repository.ts`
- Create: `src/lib/server/services/risk-inventory-service.ts`
- Modify: `src/lib/server/audit/logging.ts`

- [ ] **Step 1: Write the repository/service skeleton with explicit interfaces**

```ts
export async function listRiskInventoryItems() {}
export async function getRiskInventoryItemById(id: string) {}
export async function createRiskInventoryItem(input: CreateRiskInventoryInput, actor: PortalSession) {}
export async function updateRiskInventoryItem(id: string, input: UpdateRiskInventoryInput, actor: PortalSession) {}
export async function deleteRiskInventoryItem(id: string, actor: PortalSession) {}
export async function listRiskInventorySummary(filters: RiskInventoryFilterInput) {}
```

- [ ] **Step 2: Implement derived-field recalculation in the service**

```ts
const nro = computeNro({ probability: input.probability, severity: input.severity });
const classification = classifyNro(nro);
```

- [ ] **Step 3: Write history rows on probability/severity changes**

```ts
await supabase.from("risk_inventory_history").insert({
  risk_inventory_item_id: id,
  actor_id: actor.userId,
  actor_role: actor.role,
  before_json: before,
  after_json: after
});
```

- [ ] **Step 4: Verify with targeted service test or temporary repository smoke command**

Run: `npm run build`
Expected: build passes with new modules wired in

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/repositories/risk-inventory-repository.ts src/lib/server/services/risk-inventory-service.ts src/lib/server/audit/logging.ts
git commit -m "feat: add risk inventory services"
```

### Task 5: Add Admin API Routes

**Files:**
- Create: `src/app/api/admin/risk-inventory/route.ts`
- Create: `src/app/api/admin/risk-inventory/[id]/route.ts`
- Create: `src/app/api/admin/risk-inventory/criteria/route.ts`

- [ ] **Step 1: Mirror existing route patterns from admin modules**

```ts
export async function GET() {}
export async function POST(request: Request) {}
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {}
export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {}
```

- [ ] **Step 2: Enforce role rules in handlers**

```ts
const session = await requirePortalApiSession();
assertRole(session, ["admin", "hr"]);
```

- [ ] **Step 3: Expose criteria payload**

```ts
return Response.json({
  probabilityLevels: [...],
  severityLevels: [...],
  classificationBands: [...],
  formula: "NRO = Probabilidade x Severidade"
});
```

- [ ] **Step 4: Run build verification**

Run: `npm run build`
Expected: build passes with routes compiled

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/risk-inventory/route.ts src/app/api/admin/risk-inventory/[id]/route.ts src/app/api/admin/risk-inventory/criteria/route.ts
git commit -m "feat: add risk inventory api routes"
```

### Task 6: Build the Portal UI

**Files:**
- Create: `src/app/inventario-riscos/page.tsx`
- Create: `src/app/inventario-riscos/[id]/page.tsx`
- Create: `src/components/portal/risk-inventory-manager.tsx`
- Create: `src/components/portal/risk-inventory-form.tsx`
- Create: `src/components/portal/risk-matrix-grid.tsx`
- Create: `src/components/portal/risk-classification-badge.tsx`
- Create: `src/components/portal/risk-matrix-criteria-panel.tsx`
- Modify: `src/components/portal/portal-shell.tsx`

- [ ] **Step 1: Render list page inside existing portal shell**

```tsx
<PortalShell
  session={session}
  eyebrow="PGR"
  title="Inventario de Riscos"
  description="Gerencie riscos operacionais e classifique o NRO pela matriz NR-01."
>
  <RiskInventoryManager items={items} summary={summary} campaigns={campaigns} />
</PortalShell>
```

- [ ] **Step 2: Add the matrix widget and badge component**

```tsx
<RiskMatrixGrid probability={form.probability} severity={form.severity} />
<RiskClassificationBadge classification={classification} />
```

- [ ] **Step 3: Make severity readonly for non-admin users**

```tsx
<select disabled={!canEditSeverity} ...>
```

- [ ] **Step 4: Add criteria panel with the agreed levels**

```tsx
<RiskMatrixCriteriaPanel
  probabilityLevels={probabilityLevels}
  severityLevels={severityLevels}
  formula="NRO = Probabilidade x Severidade"
/>
```

- [ ] **Step 5: Run build verification**

Run: `npm run build`
Expected: route pages compile and portal navigation renders

- [ ] **Step 6: Commit**

```bash
git add src/app/inventario-riscos src/components/portal/risk-inventory-manager.tsx src/components/portal/risk-inventory-form.tsx src/components/portal/risk-matrix-grid.tsx src/components/portal/risk-classification-badge.tsx src/components/portal/risk-matrix-criteria-panel.tsx src/components/portal/portal-shell.tsx
git commit -m "feat: add risk inventory portal ui"
```

### Task 7: Document the Criteria and Update Gap Tracking

**Files:**
- Modify: `03_SOURCE_OF_TRUTH.md`
- Modify: `docs/GAP_ANALYSIS.md`

- [ ] **Step 1: Add explicit NR-01 matrix rules**

```md
## Matriz de Probabilidade e Severidade

Formula: NRO = Probabilidade x Severidade

Probabilidade:
1 = Muito Baixa
2 = Baixa
3 = Media
4 = Alta
5 = Muito Alta

Severidade:
1 = Insignificante
2 = Menor
3 = Moderada
4 = Grave
5 = Catastrofica
```

- [ ] **Step 2: Update gap analysis to reflect implemented UI and matrix support**

```md
| Matriz probabilidade × severidade | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Implementado no inventario de riscos | ✅ IMPLEMENTADO |
```

- [ ] **Step 3: Commit**

```bash
git add 03_SOURCE_OF_TRUTH.md docs/GAP_ANALYSIS.md
git commit -m "docs: define nr01 matrix criteria"
```

### Task 8: Final Verification

**Files:**
- Verify all files touched in Tasks 1-7

- [ ] **Step 1: Run targeted domain test**

Run: `npm test -- src/lib/domain/risk-matrix/engine.test.ts`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Re-read the requirements checklist**

Checklist:
- [ ] CRUD administrativo do inventario
- [ ] Probabilidade editavel por editor/admin
- [ ] Severidade editavel apenas por admin
- [ ] NRO calculado automaticamente
- [ ] Badge e classificacao por faixa
- [ ] Matriz 5x5 com destaque
- [ ] Criterios documentados
- [ ] Auditoria de alteracoes de probabilidade/severidade

- [ ] **Step 4: Commit final integration changes**

```bash
git add .
git commit -m "feat: implement nr01 risk inventory matrix"
```
