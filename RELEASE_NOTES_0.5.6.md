# IntuneGet v0.5.6

**Release date:** 2026-02-12

## Highlights
- Fixed GitHub Actions packaging payload handling so package descriptions from Supabase are now included when creating Win32 apps.
- Intune app creation payload now uses the supplied package description and falls back to a legacy synthetic description when missing.
- Existing deployment metadata behavior remains unchanged, including displayVersion and publisher handling.

## What's changed
- Added `description` field propagation from `CartItem` to workflow payload (`app` section).
- Mapped `DESCRIPTION` in the GitHub Actions workflow environment.
- Replaced hardcoded workflow description with payload-driven value plus fallback.
- Updated internal changelog to include `v0.5.6` release notes.

## Related recent fixes
- `v0.5.5`/`v0.5.4` line: architecture handling and installer sync improvements in the GH Actions path were included in the release stream.
