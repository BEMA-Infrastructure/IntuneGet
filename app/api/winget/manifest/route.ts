import { NextRequest, NextResponse } from 'next/server';
import { getManifest, getInstallers, getBestInstaller, getPackage } from '@/lib/winget-api';
import { fetchSimilarPackages, fetchAvailableVersions } from '@/lib/manifest-api';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const packageId = searchParams.get('id');
    const version = searchParams.get('version');
    const architecture = searchParams.get('arch') as 'x64' | 'x86' | 'arm64' | null;

    if (!packageId) {
      return NextResponse.json(
        { error: 'Package ID parameter "id" is required' },
        { status: 400 }
      );
    }

    // Try to get manifest
    let manifest = await getManifest(packageId, version || undefined);

    // If manifest lookup fails, try to get package info and use its version
    if (!manifest) {
      console.warn(`Direct manifest lookup failed for ${packageId}, trying package lookup`);
      const pkg = await getPackage(packageId);
      if (pkg && pkg.version) {
        console.log(`Found package ${packageId} with version ${pkg.version}, retrying manifest fetch`);
        manifest = await getManifest(packageId, pkg.version);
      }
    }

    // If still no manifest, try fetching available versions directly from GitHub
    if (!manifest) {
      console.warn(`Package lookup failed for ${packageId}, trying GitHub versions`);
      const versions = await fetchAvailableVersions(packageId);
      if (versions.length > 0) {
        console.log(`Found ${versions.length} versions for ${packageId} from GitHub, trying latest: ${versions[0]}`);
        manifest = await getManifest(packageId, versions[0]);
      }
    }

    if (!manifest) {
      // Fetch similar packages to suggest
      const suggestions = await fetchSimilarPackages(packageId);
      return NextResponse.json(
        {
          error: 'Package not found',
          message: suggestions.length > 0
            ? `Package "${packageId}" not found. Did you mean one of these?`
            : `Package "${packageId}" not found in winget-pkgs repository`,
          suggestions,
        },
        { status: 404 }
      );
    }

    // Get normalized installers
    const installers = await getInstallers(packageId, version || manifest.Version);

    // Get best installer for requested architecture
    const bestInstaller = architecture
      ? await getBestInstaller(packageId, version || manifest.Version, architecture)
      : installers[0] || null;

    return NextResponse.json({
      manifest: {
        id: manifest.Id,
        name: manifest.Name,
        publisher: manifest.Publisher,
        version: manifest.Version,
        description: manifest.Description || manifest.ShortDescription,
        homepage: manifest.Homepage,
        license: manifest.License,
        licenseUrl: manifest.LicenseUrl,
        tags: manifest.Tags,
      },
      installers,
      recommendedInstaller: bestInstaller,
    });
  } catch (error) {
    console.error('Manifest fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch manifest', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
