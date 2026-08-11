# Migration history is drifted from remote — read before running `db push`

As of 2026-08-10, `supabase migration list` shows ~28 local migrations
missing from the remote (production) database. **Do not run `supabase db
push`** until this is untangled — it would attempt to replay migrations
that may already be applied under a different identity, against a database
whose actual schema history doesn't match what's recorded locally.

## Two separate problems

1. **Hyphenated filenames.** 22 files use `<timestamp>-<uuid>.sql` instead
   of the Supabase CLI's expected `<timestamp>_<description>.sql` (single
   underscore after the 14-digit timestamp). The CLI's migration parser
   skips these entirely — they're invisible to `migration list` and
   `db push`, even though they've presumably already been applied to
   remote by some other means (e.g. pasted into the SQL Editor).

   Affected range: `20250613064440-...` through `20250707220807-...`.

2. **Near-duplicate timestamps.** Several local migrations have timestamps
   1–2 seconds off from a remote migration that does the same or
   overlapping work — e.g. local `20260305225357_...` vs a remote
   migration timestamped `20260305225355`. These look like the same
   change applied twice under different migration IDs, likely from two
   people/tools generating a migration for the same edit at nearly the
   same moment. The CLI has no way to know these are duplicates; it will
   try to apply both.

## Net effect

Local migration history and the remote schema have diverged enough that
`supabase migration list`'s "missing from remote" output can't be trusted
at face value — some of those are genuinely unapplied, others are already
live under a hyphenated filename or a differently-timestamped duplicate.

The three `req_*`/site-requirements migrations added in August 2026
(`20260809120000_*`, `20260809120500_*`, `20260809121000_*`) were applied
directly via the Supabase SQL Editor rather than `db push`, and have no
corresponding rows in the remote `supabase_migrations` table.

## Before anyone runs `db push`

Someone needs to reconcile local history against the actual remote schema:
rename or backfill entries for migrations that are already live (including
the three above), and resolve each near-duplicate pair by deleting
whichever side didn't actually get applied. Until then, apply new
migrations by hand via the SQL Editor and note it here.
