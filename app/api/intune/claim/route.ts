/**
 * Claim App API Route
 * Records when a user claims an unmanaged app for deployment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { ClaimAppRequest, ClaimedApp } from '@/types/unmanaged';

/**
 * Ensure user profile exists in the database
 * This is necessary because claimed_apps has a foreign key to user_profiles
 */
async function ensureUserProfile(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  tenantId: string,
  tokenPayload: Record<string, unknown>
): Promise<void> {
  const profileData = {
    id: userId,
    email: tokenPayload.preferred_username || tokenPayload.email || null,
    name: tokenPayload.name || null,
    intune_tenant_id: tenantId,
    updated_at: new Date().toISOString(),
  };

  console.log('Ensuring user profile exists:', { userId, tenantId });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('user_profiles').upsert(
    profileData,
    { onConflict: 'id' }
  );

  if (error) {
    console.error('Error upserting user profile:', error);
    // Try insert instead if upsert fails
    console.log('Attempting direct insert...');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any)
      .from('user_profiles')
      .insert(profileData);

    if (insertError) {
      console.error('Error inserting user profile:', insertError);
      throw new Error(`Failed to create user profile: ${insertError.message}`);
    }
  }

  console.log('User profile ensured successfully');
}

// Database row type for claimed_apps table
interface ClaimedAppRow {
  id: string;
  user_id: string;
  tenant_id: string;
  discovered_app_id: string;
  discovered_app_name: string;
  winget_package_id: string;
  intune_app_id: string | null;
  device_count_at_claim: number | null;
  claimed_at: string;
  status: string;
}

/**
 * POST - Create a new claim record
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
    let tokenPayload: Record<string, unknown>;

    try {
      tokenPayload = JSON.parse(
        Buffer.from(accessToken.split('.')[1], 'base64').toString()
      );
      userId = (tokenPayload.oid || tokenPayload.sub) as string;
      tenantId = tokenPayload.tid as string;

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

    const body: ClaimAppRequest = await request.json();

    if (!body.discoveredAppId || !body.discoveredAppName || !body.wingetPackageId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Ensure user profile exists (required for foreign key constraint)
    await ensureUserProfile(supabase, userId, tenantId, tokenPayload);

    // Check if already claimed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('claimed_apps')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('discovered_app_id', body.discoveredAppId)
      .single();

    let claim: ClaimedAppRow | null = null;
    let error: Error | null = null;

    if (existing) {
      // Update existing claim (allow re-claiming)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (supabase as any)
        .from('claimed_apps')
        .update({
          user_id: userId,
          winget_package_id: body.wingetPackageId,
          device_count_at_claim: body.deviceCount || 0,
          status: 'pending',
          claimed_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single() as { data: ClaimedAppRow | null; error: Error | null };
      claim = result.data;
      error = result.error;
    } else {
      // Create new claim record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (supabase as any)
        .from('claimed_apps')
        .insert({
          user_id: userId,
          tenant_id: tenantId,
          discovered_app_id: body.discoveredAppId,
          discovered_app_name: body.discoveredAppName,
          winget_package_id: body.wingetPackageId,
          device_count_at_claim: body.deviceCount || 0,
          status: 'pending',
        })
        .select()
        .single() as { data: ClaimedAppRow | null; error: Error | null };
      claim = result.data;
      error = result.error;
    }

    if (error || !claim) {
      console.error('Error creating claim:', error);
      return NextResponse.json(
        { error: 'Failed to create claim' },
        { status: 500 }
      );
    }

    const formattedClaim: ClaimedApp = {
      id: claim.id,
      userId: claim.user_id,
      tenantId: claim.tenant_id,
      discoveredAppId: claim.discovered_app_id,
      discoveredAppName: claim.discovered_app_name,
      wingetPackageId: claim.winget_package_id,
      intuneAppId: claim.intune_app_id,
      deviceCountAtClaim: claim.device_count_at_claim,
      claimedAt: claim.claimed_at,
      status: claim.status as ClaimedApp['status'],
    };

    return NextResponse.json({ claim: formattedClaim }, { status: 201 });
  } catch (error) {
    console.error('Claim POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create claim' },
      { status: 500 }
    );
  }
}

/**
 * GET - List claimed apps for the tenant
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: claims, error } = await (supabase as any)
      .from('claimed_apps')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('claimed_at', { ascending: false }) as { data: ClaimedAppRow[] | null; error: Error | null };

    if (error) {
      console.error('Error fetching claims:', error);
      return NextResponse.json(
        { error: 'Failed to fetch claims' },
        { status: 500 }
      );
    }

    const formattedClaims: ClaimedApp[] = (claims || []).map(c => ({
      id: c.id,
      userId: c.user_id,
      tenantId: c.tenant_id,
      discoveredAppId: c.discovered_app_id,
      discoveredAppName: c.discovered_app_name,
      wingetPackageId: c.winget_package_id,
      intuneAppId: c.intune_app_id,
      deviceCountAtClaim: c.device_count_at_claim,
      claimedAt: c.claimed_at,
      status: c.status as ClaimedApp['status'],
    }));

    return NextResponse.json({ claims: formattedClaims });
  } catch (error) {
    console.error('Claim GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch claims' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update claim status (e.g., after deployment)
 */
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { claimId, status, intuneAppId } = body;

    if (!claimId) {
      return NextResponse.json(
        { error: 'Missing claim ID' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (intuneAppId) updates.intune_app_id = intuneAppId;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: claim, error } = await (supabase as any)
      .from('claimed_apps')
      .update(updates)
      .eq('id', claimId)
      .eq('tenant_id', tenantId)
      .select()
      .single() as { data: ClaimedAppRow | null; error: Error | null };

    if (error || !claim) {
      console.error('Error updating claim:', error);
      return NextResponse.json(
        { error: 'Failed to update claim' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      claim: {
        id: claim.id,
        userId: claim.user_id,
        tenantId: claim.tenant_id,
        discoveredAppId: claim.discovered_app_id,
        discoveredAppName: claim.discovered_app_name,
        wingetPackageId: claim.winget_package_id,
        intuneAppId: claim.intune_app_id,
        deviceCountAtClaim: claim.device_count_at_claim,
        claimedAt: claim.claimed_at,
        status: claim.status,
      },
    });
  } catch (error) {
    console.error('Claim PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update claim' },
      { status: 500 }
    );
  }
}
