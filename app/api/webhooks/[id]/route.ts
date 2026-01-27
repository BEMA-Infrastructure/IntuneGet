/**
 * Individual Webhook API Routes
 * GET - Get a specific webhook configuration
 * PUT - Update a webhook configuration
 * DELETE - Delete a webhook configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { parseAccessToken } from '@/lib/auth-utils';
import { validateWebhookUrl } from '@/lib/webhooks/service';
import type {
  WebhookConfiguration,
  WebhookConfigurationUpdate,
} from '@/types/notifications';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/webhooks/[id]
 * Get a specific webhook configuration
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = parseAccessToken(request.headers.get('Authorization'));
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const supabase = createServerClient();

    // Get webhook configuration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: webhook, error } = await (supabase as any)
      .from('webhook_configurations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Webhook not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching webhook:', error);
      return NextResponse.json(
        { error: 'Failed to fetch webhook' },
        { status: 500 }
      );
    }

    // Mask secret in response
    const sanitizedWebhook = {
      ...webhook,
      secret: webhook.secret ? '********' : null,
    };

    return NextResponse.json({ webhook: sanitizedWebhook });
  } catch (error) {
    console.error('Webhook GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/webhooks/[id]
 * Update a webhook configuration
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = parseAccessToken(request.headers.get('Authorization'));
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body: WebhookConfigurationUpdate = await request.json();

    // Validate URL if provided
    if (body.url) {
      const urlValidation = validateWebhookUrl(body.url);
      if (!urlValidation.valid) {
        return NextResponse.json(
          { error: urlValidation.error || 'Invalid webhook URL' },
          { status: 400 }
        );
      }
    }

    // Validate webhook type if provided
    if (
      body.webhook_type &&
      !['slack', 'teams', 'discord', 'custom'].includes(body.webhook_type)
    ) {
      return NextResponse.json(
        { error: 'Invalid webhook type' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Verify ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: fetchError } = await (supabase as any)
      .from('webhook_configurations')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.userId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.url !== undefined) updateData.url = body.url;
    if (body.webhook_type !== undefined) updateData.webhook_type = body.webhook_type;
    if (body.headers !== undefined) updateData.headers = body.headers;
    if (body.is_enabled !== undefined) updateData.is_enabled = body.is_enabled;

    // Handle secret update (only update if explicitly provided, including null)
    if ('secret' in body) {
      updateData.secret = body.secret;
    }

    // Update webhook
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: webhook, error } = await (supabase as any)
      .from('webhook_configurations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating webhook:', error);
      return NextResponse.json(
        { error: 'Failed to update webhook' },
        { status: 500 }
      );
    }

    // Mask secret in response
    const sanitizedWebhook = {
      ...webhook,
      secret: webhook.secret ? '********' : null,
    };

    return NextResponse.json({ webhook: sanitizedWebhook });
  } catch (error) {
    console.error('Webhook PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/webhooks/[id]
 * Delete a webhook configuration
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = parseAccessToken(request.headers.get('Authorization'));
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const supabase = createServerClient();

    // Delete webhook (will automatically fail if not owned by user due to WHERE clause)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('webhook_configurations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.userId);

    if (error) {
      console.error('Error deleting webhook:', error);
      return NextResponse.json(
        { error: 'Failed to delete webhook' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
