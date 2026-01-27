/**
 * Update Notification Email Template
 * Generates HTML and plain text email content for app update notifications
 */

import type { EmailTemplateData, AppUpdate } from '@/types/notifications';

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/**
 * Generate the update notification email content
 */
export function generateUpdateNotificationEmail(data: EmailTemplateData): EmailContent {
  const { updates, summary, tenant_name, dashboard_url, user_name } = data;

  // Generate subject line
  const subject = summary.critical > 0
    ? `[Action Required] ${summary.critical} Critical App Update${summary.critical > 1 ? 's' : ''} Available`
    : `${summary.total} App Update${summary.total > 1 ? 's' : ''} Available for Your Intune Apps`;

  // Generate HTML content
  const html = generateHtmlEmail(data);

  // Generate plain text content
  const text = generateTextEmail(data);

  return { subject, html, text };
}

/**
 * Generate HTML email content
 */
function generateHtmlEmail(data: EmailTemplateData): string {
  const { updates, summary, tenant_name, dashboard_url, user_name } = data;

  const criticalUpdates = updates.filter(u => u.is_critical);
  const regularUpdates = updates.filter(u => !u.is_critical);

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>App Updates Available</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 0;
        background-color: #f3f4f6;
      }
      .container {
        background: white;
        margin: 20px;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 30px;
        text-align: center;
      }
      .header h1 {
        color: white;
        margin: 0;
        font-size: 24px;
        font-weight: 600;
      }
      .content {
        padding: 30px;
      }
      .greeting {
        font-size: 18px;
        color: #111827;
        margin-bottom: 16px;
      }
      .summary-box {
        background: #f9fafb;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 24px;
        border: 1px solid #e5e7eb;
      }
      .summary-stats {
        display: flex;
        gap: 24px;
      }
      .stat {
        text-align: center;
      }
      .stat-value {
        font-size: 32px;
        font-weight: 700;
        color: #111827;
      }
      .stat-label {
        font-size: 12px;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .stat-critical .stat-value {
        color: #dc2626;
      }
      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: #111827;
        margin: 24px 0 12px 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .critical-badge {
        background: #fef2f2;
        color: #dc2626;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
      }
      .app-list {
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .app-item {
        padding: 16px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        margin-bottom: 8px;
        background: #fafafa;
      }
      .app-item.critical {
        border-color: #fecaca;
        background: #fef2f2;
      }
      .app-name {
        font-weight: 600;
        color: #111827;
        margin-bottom: 4px;
      }
      .app-id {
        font-size: 12px;
        color: #6b7280;
        font-family: monospace;
        margin-bottom: 8px;
      }
      .version-change {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
      }
      .version {
        font-family: monospace;
        padding: 2px 6px;
        border-radius: 4px;
      }
      .version-old {
        background: #fee2e2;
        color: #991b1b;
      }
      .version-new {
        background: #d1fae5;
        color: #065f46;
      }
      .arrow {
        color: #9ca3af;
      }
      .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        text-decoration: none;
        padding: 14px 28px;
        border-radius: 8px;
        font-weight: 600;
        margin-top: 24px;
      }
      .footer {
        text-align: center;
        padding: 20px;
        color: #9ca3af;
        font-size: 12px;
        border-top: 1px solid #e5e7eb;
      }
      .tenant-info {
        color: #6b7280;
        font-size: 14px;
        margin-bottom: 16px;
      }
      @media (max-width: 600px) {
        .container {
          margin: 10px;
        }
        .content {
          padding: 20px;
        }
        .summary-stats {
          flex-direction: column;
          gap: 16px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>IntuneGet</h1>
      </div>

      <div class="content">
        <p class="greeting">
          ${user_name ? `Hi ${escapeHtml(user_name)},` : 'Hello,'}
        </p>

        <p style="color: #6b7280; margin-bottom: 24px;">
          ${summary.critical > 0
            ? `We detected ${summary.critical} critical update${summary.critical > 1 ? 's' : ''} for your deployed Intune applications that may require immediate attention.`
            : `We detected ${summary.total} update${summary.total > 1 ? 's' : ''} available for your deployed Intune applications.`
          }
        </p>

        ${tenant_name ? `<p class="tenant-info">Tenant: <strong>${escapeHtml(tenant_name)}</strong></p>` : ''}

        <div class="summary-box">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" style="text-align: center;">
                <div class="stat">
                  <div class="stat-value">${summary.total}</div>
                  <div class="stat-label">Total Updates</div>
                </div>
              </td>
              <td width="50%" style="text-align: center;">
                <div class="stat ${summary.critical > 0 ? 'stat-critical' : ''}">
                  <div class="stat-value">${summary.critical}</div>
                  <div class="stat-label">Critical Updates</div>
                </div>
              </td>
            </tr>
          </table>
        </div>

        ${criticalUpdates.length > 0 ? `
          <div class="section-title">
            <span class="critical-badge">CRITICAL</span>
            Major Version Updates
          </div>
          <ul class="app-list">
            ${criticalUpdates.map(app => generateAppItemHtml(app, true)).join('')}
          </ul>
        ` : ''}

        ${regularUpdates.length > 0 ? `
          <div class="section-title">
            Available Updates
          </div>
          <ul class="app-list">
            ${regularUpdates.map(app => generateAppItemHtml(app, false)).join('')}
          </ul>
        ` : ''}

        <div style="text-align: center;">
          <a href="${escapeHtml(dashboard_url)}" class="cta-button">
            View in Dashboard
          </a>
        </div>
      </div>

      <div class="footer">
        <p style="margin: 0 0 8px 0;">Sent by IntuneGet</p>
        <p style="margin: 0;">You received this email because you enabled app update notifications.</p>
      </div>
    </div>
  </body>
</html>
  `.trim();
}

/**
 * Generate HTML for a single app item
 */
function generateAppItemHtml(app: AppUpdate, isCritical: boolean): string {
  return `
    <li class="app-item ${isCritical ? 'critical' : ''}">
      <div class="app-name">${escapeHtml(app.app_name)}</div>
      <div class="app-id">${escapeHtml(app.winget_id)}</div>
      <div class="version-change">
        <span class="version version-old">${escapeHtml(app.current_version)}</span>
        <span class="arrow">-></span>
        <span class="version version-new">${escapeHtml(app.latest_version)}</span>
      </div>
    </li>
  `;
}

/**
 * Generate plain text email content
 */
function generateTextEmail(data: EmailTemplateData): string {
  const { updates, summary, tenant_name, dashboard_url, user_name } = data;

  const criticalUpdates = updates.filter(u => u.is_critical);
  const regularUpdates = updates.filter(u => !u.is_critical);

  let text = '';

  // Greeting
  text += user_name ? `Hi ${user_name},\n\n` : 'Hello,\n\n';

  // Summary
  if (summary.critical > 0) {
    text += `We detected ${summary.critical} critical update${summary.critical > 1 ? 's' : ''} for your deployed Intune applications that may require immediate attention.\n\n`;
  } else {
    text += `We detected ${summary.total} update${summary.total > 1 ? 's' : ''} available for your deployed Intune applications.\n\n`;
  }

  // Tenant info
  if (tenant_name) {
    text += `Tenant: ${tenant_name}\n\n`;
  }

  // Stats
  text += `Summary:\n`;
  text += `- Total Updates: ${summary.total}\n`;
  text += `- Critical Updates: ${summary.critical}\n\n`;

  // Critical updates
  if (criticalUpdates.length > 0) {
    text += `=== CRITICAL UPDATES ===\n\n`;
    criticalUpdates.forEach(app => {
      text += generateAppItemText(app);
    });
    text += '\n';
  }

  // Regular updates
  if (regularUpdates.length > 0) {
    text += `=== AVAILABLE UPDATES ===\n\n`;
    regularUpdates.forEach(app => {
      text += generateAppItemText(app);
    });
    text += '\n';
  }

  // CTA
  text += `View in Dashboard: ${dashboard_url}\n\n`;

  // Footer
  text += `---\n`;
  text += `Sent by IntuneGet\n`;
  text += `You received this email because you enabled app update notifications.\n`;

  return text.trim();
}

/**
 * Generate plain text for a single app item
 */
function generateAppItemText(app: AppUpdate): string {
  return `${app.app_name}\n  ID: ${app.winget_id}\n  Version: ${app.current_version} -> ${app.latest_version}\n\n`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}
