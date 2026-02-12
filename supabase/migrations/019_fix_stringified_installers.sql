-- Fix malformed version_history.installers rows written as JSON strings instead of JSON arrays.
-- Also aligns legacy installer_url fields with the first installer entry when available.

-- Convert stringified JSON arrays (e.g. "[{...}]") into proper JSONB arrays.
UPDATE version_history
SET
  installers = (installers #>> '{}')::jsonb,
  updated_at = NOW()
WHERE jsonb_typeof(installers) = 'string'
  AND COALESCE(installers #>> '{}', '') ~ '^\s*\[';

-- Keep legacy flat installer columns in sync with installers[0] when possible.
UPDATE version_history
SET
  installer_url = COALESCE(NULLIF(installer_url, ''), installers->0->>'InstallerUrl'),
  installer_sha256 = COALESCE(NULLIF(installer_sha256, ''), installers->0->>'InstallerSha256'),
  installer_type = COALESCE(NULLIF(installer_type, ''), installers->0->>'InstallerType'),
  installer_scope = COALESCE(NULLIF(installer_scope, ''), installers->0->>'Scope'),
  updated_at = NOW()
WHERE jsonb_typeof(installers) = 'array'
  AND jsonb_array_length(installers) > 0;
