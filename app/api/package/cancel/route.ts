/**
 * Cancel Package API Route
 * Cancels pending or in-process packaging jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { cancelWorkflowRun, isGitHubActionsConfigured } from '@/lib/github-actions';

interface CancelRequestBody {
  jobId: string;
}

// Statuses that can be cancelled (active jobs)
const CANCELLABLE_STATUSES = ['queued', 'packaging', 'uploading'];
// Statuses that can be force-dismissed by the user
const DISMISSABLE_STATUSES = ['queued', 'packaging', 'uploading', 'completed', 'failed'];

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header (Microsoft access token from MSAL)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in with Microsoft.' },
        { status: 401 }
      );
    }

    // Decode the token to get user info
    const accessToken = authHeader.slice(7);
    let userId: string;
    let userEmail: string | null = null;

    try {
      const tokenPayload = JSON.parse(
        Buffer.from(accessToken.split('.')[1], 'base64').toString()
      );
      userId = tokenPayload.oid || tokenPayload.sub;
      // Try multiple token fields for email
      userEmail = tokenPayload.preferred_username || tokenPayload.email || tokenPayload.upn || null;

      if (!userId) {
        return NextResponse.json(
          { error: 'Invalid token: missing user identifier' },
          { status: 401 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: CancelRequestBody = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createServerClient();

    // Fetch the job to verify ownership and check status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: job, error: fetchError } = await (supabase as any)
      .from('packaging_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Verify the user owns this job
    if (job.user_id !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to cancel this job' },
        { status: 403 }
      );
    }

    // Check if job is already cancelled or deployed (cannot be modified)
    if (job.status === 'cancelled') {
      return NextResponse.json({
        success: true,
        message: 'Job is already cancelled',
        jobId,
        githubCancelled: null,
      });
    }

    if (job.status === 'deployed') {
      return NextResponse.json(
        { error: 'Cannot cancel a deployed job. It is already in Intune.' },
        { status: 400 }
      );
    }

    // Check if job can be dismissed
    if (!DISMISSABLE_STATUSES.includes(job.status)) {
      return NextResponse.json(
        { error: `Job cannot be cancelled. Current status: ${job.status}` },
        { status: 400 }
      );
    }

    // Attempt to cancel GitHub workflow if run ID exists and job is still active
    let githubCancelResult = null;
    const isActiveJob = CANCELLABLE_STATUSES.includes(job.status);
    if (isActiveJob && job.github_run_id && isGitHubActionsConfigured()) {
      githubCancelResult = await cancelWorkflowRun(job.github_run_id);
      console.log('GitHub cancel result:', githubCancelResult);
    }

    // Update job status to cancelled in database
    // We update regardless of GitHub result - the user wants this cancelled/dismissed
    let errorMessage = 'Job cancelled by user';
    if (!isActiveJob) {
      errorMessage = `Job dismissed by user (was ${job.status})`;
    } else if (githubCancelResult && !githubCancelResult.success) {
      errorMessage = `Job cancelled by user. GitHub workflow: ${githubCancelResult.message}`;
    }

    // Use token email, or fall back to job's stored user_email
    const cancelledByEmail = userEmail || job.user_email || 'unknown';

    // Try full update first with all cancellation fields
    const fullUpdateData: Record<string, unknown> = {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: cancelledByEmail,
      updated_at: new Date().toISOString(),
      error_message: errorMessage,
    };

    // Build query - use optimistic lock for active jobs, but allow force update for dismissed jobs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let updateQuery = (supabase as any)
      .from('packaging_jobs')
      .update(fullUpdateData)
      .eq('id', jobId);

    // Only use optimistic lock for active jobs (prevent race conditions)
    // For dismissed jobs (completed/failed), we allow updating regardless of current status
    if (isActiveJob) {
      updateQuery = updateQuery.eq('status', job.status);
    } else {
      // For non-active jobs, exclude already cancelled or deployed
      updateQuery = updateQuery.not('status', 'in', '("cancelled","deployed")');
    }

    let { error: updateError } = await updateQuery;

    // If full update fails (e.g., missing columns), try minimal update
    if (updateError) {
      console.error('Full database update error:', updateError);

      // Fallback to minimal update with only essential fields
      const minimalUpdateData: Record<string, unknown> = {
        status: 'cancelled',
        updated_at: new Date().toISOString(),
        error_message: errorMessage,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let minimalQuery = (supabase as any)
        .from('packaging_jobs')
        .update(minimalUpdateData)
        .eq('id', jobId);

      if (isActiveJob) {
        minimalQuery = minimalQuery.eq('status', job.status);
      } else {
        minimalQuery = minimalQuery.not('status', 'in', '("cancelled","deployed")');
      }

      const { error: minimalError } = await minimalQuery;

      if (minimalError) {
        console.error('Minimal database update error:', minimalError);
        return NextResponse.json(
          { error: 'Failed to update job status. The job may have already changed status.' },
          { status: 500 }
        );
      }

      // Minimal update succeeded
      updateError = null;
    }

    return NextResponse.json({
      success: true,
      message: 'Job cancelled successfully',
      jobId,
      githubCancelled: githubCancelResult?.success ?? null,
    });
  } catch (error) {
    console.error('Cancel API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
