# Integration Notes

## Required env vars
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

## Auth
- Portal pages expect Supabase Auth user plus `profiles.role`
- Supported roles in MVP: `admin`, `hr`, `manager`

## Anonymous flow
- Public token is never persisted raw; backend hashes it before lookup
- Anonymous submission stores no personal identifiers
- Official risk calculation runs only in `src/lib/domain/risk/engine.ts`

## Single-use token guarantee
- `survey_submissions.token_id` should be unique in the database
- `campaign_tokens.status` and `used_at` must be updated by backend only
- For stronger guarantees in production, move submission + token consumption into one SQL RPC transaction

## Dashboard
- Campaign dashboard reads consolidated data from backend services
- Do not reproduce classification logic in the frontend
