# Supabase – Database Migrations

## Running migrations

### Against the remote (production) database

```bash
# Push all pending migrations to the linked Supabase project
supabase db push
```

`supabase db push` compares the remote migration history table against the files in `supabase/migrations/` and applies any that haven't been run yet, in filename order.

### Against a local dev database

```bash
# Start the local Supabase stack (Postgres + Studio + Auth, etc.)
supabase start

# Apply any pending migrations to the local database
supabase db reset   # full reset: drops DB, re-runs all migrations + seed
# OR
supabase migration up  # incremental: applies only new migrations
```

### Manually (psql / SQL editor)

If you need to run a single migration by hand, copy the contents of the relevant file and execute it against the target database. Migrations must be applied in filename order because later ones depend on objects created by earlier ones.

## Creating a new migration

```bash
supabase migration new <descriptive_name>
# e.g. supabase migration new add_user_picks_table
```

This creates a timestamped file in `supabase/migrations/`. Add your SQL to that file, then push or reset to apply it.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed (`brew install supabase/tap/supabase`)
- Project linked: `supabase link --project-ref <your-project-ref>`
- For local dev: Docker running
