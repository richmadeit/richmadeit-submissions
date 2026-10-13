# Shaq’s Big Shot

Unofficial browser basketball game by Rich Made It. No Shaq endorsement implied.

Play: https://richmadeit.github.io/richmadeit-submissions/

## Play first

No registration or nickname is required to start. Complete a 60-second round, then optionally post a public nickname and Instagram handle. The handle links to the profile; it is not proof of identity. For prize campaigns, verify the winner by having them message from the claimed account.

Today and all-time leaderboards show the best round per browser-held player identity. Today resets at midnight America/Chicago. Ties favor the earlier score. There is no account recovery or cross-device identity merge. Clearing browser storage creates a new player identity.

## Hosting and scores

GitHub Pages publishes the standalone `index.html` from `shaqs-big-shot`, root folder. Supabase project `molqlfdjlmnlkscecngz` (Richmadeit Submissions) hosts the `bigshot-leaderboard` Edge Function and isolated `bigshot_rounds` / `bigshot_scores` tables. Existing submissions are separate.

The Supabase migration and Edge Function source are included under `supabase/`. Apply the migration once. Future schema changes need a new migration. Redeploy the Edge Function after server changes. The configured function uses custom player-secret / round-ticket authentication (`verify_jwt = false`). Service credentials are read only from Supabase's server environment; none are in the game or repository.

Only the Edge Function service role can access the tables and RPCs. Public endpoints expose ranks, nicknames, optional Instagram handles and scores. Writes require a round ticket belonging to the browser-held player secret, a completed round duration, and a physics replay matching the submitted score. Duplicate score writes are idempotent. Round creation is rate limited. Round records expire after one day; submitted scores persist. These protections discourage trivial score edits but are not a tournament-grade anti-cheat or identity verification system. Review winners before awarding prizes.

## Mobile experience

Swipe up anywhere on the court. Active swipes temporarily hold page scrolling and release it after the gesture. Large MUSIC and LEADERBOARD controls sit beside the court. Opening either panel pauses the game clock; returning resumes a previously running round. Music keeps its own play/pause state. The first Start tap requests the DJ Diesel mix from 1:00; a visible Play control is available if the browser blocks playback.

Music remains on official external sources. No music is downloaded or rehosted. Gameplay does not guarantee a counted streaming-platform play.

## Validation

49 existing gameplay, sharing and gesture checks pass. Leaderboard checks cover physics replay, invalid totals, incomplete rounds, session ownership, duplicate posting, ranking, tie order, date reset, CORS, rate limiting and expired rounds. Additional optional-handle validation checks pass. A real completed browser round was saved to Supabase and read from the public GitHub game during launch verification; temporary QA scores are removed afterward.
