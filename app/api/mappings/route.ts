/**
 * Manual App Mappings API Route
 * CRUD operations for user-created app-to-WinGet mappings
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { ManualAppMapping, CreateMappingRequest } from '@/types/unmanaged';

// Database row type
interface ManualMappingRow {
  id: string;
  discovered_app_name: string;
  discovered_publisher: string | null;
  winget_package_id: string;
  created_by: string | null;
  tenant_id: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * GET - List all manual mappings for the tenant
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.slice(7);
    let tenantId: string;

    try {
      const tokenPayload = JSON.parse(
        Buffer.from(accessToken.split('.')[1], 'base64').toString()
      );
      tenantId = tokenPayload.tid;

      if (!tenantId) {
        return NextResponse.json(
          { error: 'Invalid token: missing tenant identifier' },
          { status: 401 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Get mappings for this tenant and global mappings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: mappings, error } = await (supabase as any)
      .from('manual_app_mappings')
      .select('*')
      .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
      .order('created_at', { ascending: false }) as { data: ManualMappingRow[] | null; error: Error | null };

    if (error) {
      console.error('Error fetching mappings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch mappings' },
        { status: 500 }
      );
    }

    const formattedMappings: ManualAppMapping[] = (mappings || []).map(m => ({
      id: m.id,
      discoveredAppName: m.discovered_app_name,
      discoveredPublisher: m.discovered_publisher,
      wingetPackageId: m.winget_package_id,
      createdBy: m.created_by,
      tenantId: m.tenant_id,
      isVerified: m.is_verified,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));

    return NextResponse.json({ mappings: formattedMappings });
  } catch (error) {
    console.error('Mappings GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mappings' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new manual mapping
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.slice(7);
    let userId: string;
    let tenantId: string;

    try {
      const tokenPayload = JSON.parse(
        Buffer.from(accessToken.split('.')[1], 'base64').toString()
      );
      userId = tokenPayload.oid || tokenPayload.sub;
      tenantId = tokenPayload.tid;

      if (!userId || !tenantId) {
        return NextResponse.json(
          { error: 'Invalid token: missing identifiers' },
          { status: 401 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      );
    }

    const body: CreateMappingRequest = await request.json();

    if (!body.discoveredAppName || !body.wingetPackageId) {
      return NextResponse.json(
        { error: 'Missing required fields: discoveredAppName and wingetPackageId' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if mapping already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('manual_app_mappings')
      .select('id')
      .eq('discovered_app_name', body.discoveredAppName.toLowerCase().trim())
      .eq('tenant_id', tenantId)
      .single() as { data: { id: string } | null };

    if (existing) {
      // Update existing mapping
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updated, error } = await (supabase as any)
        .from('manual_app_mappings')
        .update({
          winget_package_id: body.wingetPackageId,
          discovered_publisher: body.discoveredPublisher || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single() as { data: ManualMappingRow | null; error: Error | null };

      if (error || !updated) {
        console.error('Error updating mapping:', error);
        return NextResponse.json(
          { error: 'Failed to update mapping' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        mapping: formatMapping(updated),
        updated: true,
      });
    }

    // Create new mapping
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: created, error } = await (supabase as any)
      .from('manual_app_mappings')
      .insert({
        discovered_app_name: body.discoveredAppName.toLowerCase().trim(),
        discovered_publisher: body.discoveredPublisher || null,
        winget_package_id: body.wingetPackageId,
        created_by: userId,
        tenant_id: tenantId,
        is_verified: false,
      })
      .select()
      .single() as { data: ManualMappingRow | null; error: Error | null };

    if (error || !created) {
      console.error('Error creating mapping:', error);
      return NextResponse.json(
        { error: 'Failed to create mapping' },
        { status: 500 }
      );
    }

    // Update the discovered apps cache to reflect the new mapping
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: cacheError } = await (supabase as any)
      .from('discovered_apps_cache')
      .update({
        matched_package_id: body.wingetPackageId,
        match_status: 'matched',
        match_confidence: 1.0,
      })
      .eq('tenant_id', tenantId)
      .ilike('display_name', body.discoveredAppName);

    if (cacheError) {
      console.error('Error updating discovered apps cache:', cacheError);
    }

    return NextResponse.json({
      mapping: formatMapping(created),
      updated: false,
      cacheWarning: cacheError ? 'Cache update failed - mapping saved but cache may be stale' : undefined,
    }, { status: 201 });
  } catch (error) {
    console.error('Mappings POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create mapping' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove a manual mapping
 */
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.slice(7);
    let tenantId: string;

    try {
      const tokenPayload = JSON.parse(
        Buffer.from(accessToken.split('.')[1], 'base64').toString()
      );
      tenantId = tokenPayload.tid;

      if (!tenantId) {
        return NextResponse.json(
          { error: 'Invalid token: missing tenant identifier' },
          { status: 401 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const mappingId = searchParams.get('id');

    if (!mappingId) {
      return NextResponse.json(
        { error: 'Missing mapping ID' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get the mapping first to verify ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: mapping, error: fetchError } = await (supabase as any)
      .from('manual_app_mappings')
      .select('*')
      .eq('id', mappingId)
      .single() as { data: ManualMappingRow | null; error: Error | null };

    if (fetchError || !mapping) {
      return NextResponse.json(
        { error: 'Mapping not found' },
        { status: 404 }
      );
    }

    // Only allow deletion by creator or tenant members
    if (mapping.tenant_id !== tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this mapping' },
        { status: 403 }
      );
    }

    // Delete the mapping
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from('manual_app_mappings')
      .delete()
      .eq('id', mappingId);

    if (deleteError) {
      console.error('Error deleting mapping:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete mapping' },
        { status: 500 }
      );
    }

    // Update the discovered apps cache to remove the mapping
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: cacheError } = await (supabase as any)
      .from('discovered_apps_cache')
      .update({
        matched_package_id: null,
        match_status: 'unmatched',
        match_confidence: 0,
      })
      .eq('tenant_id', tenantId)
      .ilike('display_name', mapping.discovered_app_name);

    if (cacheError) {
      console.error('Error updating discovered apps cache after delete:', cacheError);
    }

    return NextResponse.json({
      success: true,
      cacheWarning: cacheError ? 'Cache update failed - mapping deleted but cache may be stale' : undefined,
    });
  } catch (error) {
    console.error('Mappings DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete mapping' },
      { status: 500 }
    );
  }
}

function formatMapping(m: ManualMappingRow): ManualAppMapping {
  return {
    id: m.id,
    discoveredAppName: m.discovered_app_name,
    discoveredPublisher: m.discovered_publisher,
    wingetPackageId: m.winget_package_id,
    createdBy: m.created_by,
    tenantId: m.tenant_id,
    isVerified: m.is_verified,
    createdAt: m.created_at,
    updatedAt: m.updated_at,
  };
}
