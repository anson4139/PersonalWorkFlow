# Changelog

All notable changes to the Personal Blog Platform will be documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added

- Added a protected auto-pipeline `/line-test` endpoint to verify production LINE delivery without running the publishing pipeline.
- Added impact-level summary cards to the industry trends page so decision-makers can see weekly high, medium, and low signal counts with plain-language definitions.
- Added an RSS-to-blog Cron Worker that collects daily RSS candidates, deduplicates URLs with KV, orchestrates the existing AI generation endpoints, publishes selected posts, and sends LINE execution summaries.
- Added admin dashboard content trend charts for published posts and Giscus comments, backed by new `posts-timeline` and `giscus-timeline` API endpoints.
- Added ESLint flat config for the Vite web project so `npm run lint` works with ESLint 10.
- Added `ai_image_jobs` D1 tracking, Queue producer binding, and a dedicated AI image Queue consumer Worker so cover and illustration rendering can run as background jobs.
- Added admin image job status polling so the AI generation UI no longer waits on long-running image render requests.

### Changed

- Added `PIPELINE_SECRET` Bearer-token fallback for admin API calls initiated by the Cron pipeline while preserving existing admin session behavior.
- Renamed the Blog brand text and RSS title from `BU AN LA AI` to `BLACK HARNESS AI`.

### Fixed

- Fixed the login button staying disabled on production builds by loading the Google OAuth client ID from a runtime auth config endpoint when no Vite build-time variable is present.
- Fixed the daily auto-pipeline so publishing no longer blocks on cover and illustration job completion, preventing the third category from being left as a draft when image generation takes too long.
- Fixed desktop navigation sizing so top-level links visually match the BLACK HARNESS family sites.
- Fixed archive month filtering so invalid dates cannot collapse valid year/month results into an empty archive.
- Fixed admin session expiry handling so expired sessions clear automatically and redirect back to the home page.
- Extended AI cover and illustration image generation timeouts so production `gpt-image-2` requests can complete instead of aborting around 30 seconds.
- Fixed industry trend insights to deduplicate repeated or near-identical event titles, including source suffix variants joined with spaces, hyphens, or pipes, before calculating hit counts and rendering key events.
- Fixed Phase 0 insights backfill to query FinMind `TaiwanStockNews` one day at a time, normalize trend event titles for the public API, and prevent duplicate source rows on repeated backfills.
