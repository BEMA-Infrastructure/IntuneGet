import { Metadata } from "next";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Callout,
} from "@/components/docs";

export const metadata: Metadata = {
  title: "Updates & Policies | IntuneGet Docs",
  description:
    "Available updates, update trigger flow, policy types, and history for IntuneGet.",
  alternates: {
    canonical: "https://intuneget.com/docs/updates-policies",
  },
  openGraph: {
    title: "Updates & Policies | IntuneGet Docs",
    description:
      "Available updates, update trigger flow, policy types, and history for IntuneGet.",
  },
};

export default function UpdatesPoliciesPage() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">
          Updates & Policies
        </h1>
        <p className="mt-4 text-lg text-text-secondary leading-relaxed">
          Configure update behavior per app and tenant, trigger updates
          manually, and audit the full update execution history.
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          Policy Types
        </h2>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Type</TableHeader>
              <TableHeader>Behavior</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell><code>auto_update</code></TableCell>
              <TableCell className="text-sm text-text-secondary">Automatically triggers updates using saved deployment configuration</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>notify</code></TableCell>
              <TableCell className="text-sm text-text-secondary">Shows update availability without auto deployment</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>ignore</code></TableCell>
              <TableCell className="text-sm text-text-secondary">Suppresses update actions for the app</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>pin_version</code></TableCell>
              <TableCell className="text-sm text-text-secondary">Pins app to a specific version</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          Endpoints
        </h2>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Method</TableHeader>
              <TableHeader>Path</TableHeader>
              <TableHeader>Purpose</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell><code>GET/PATCH</code></TableCell>
              <TableCell><code>/api/updates/available</code></TableCell>
              <TableCell className="text-sm text-text-secondary">Read available updates and dismiss/restore entries</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>POST</code></TableCell>
              <TableCell><code>/api/updates/trigger</code></TableCell>
              <TableCell className="text-sm text-text-secondary">Trigger single/bulk updates (max 10 per request)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>GET</code></TableCell>
              <TableCell><code>/api/updates/history</code></TableCell>
              <TableCell className="text-sm text-text-secondary">Read auto-update history and statuses</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>GET/POST</code></TableCell>
              <TableCell><code>/api/update-policies</code></TableCell>
              <TableCell className="text-sm text-text-secondary">List and upsert policies</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>GET/PATCH/DELETE</code></TableCell>
              <TableCell><code>/api/update-policies/[id]</code></TableCell>
              <TableCell className="text-sm text-text-secondary">Read, modify, or delete a specific policy</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          Trigger Behavior
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-text-secondary">
          <li>Validates requested app update records for user + tenant context.</li>
          <li>Ensures a policy exists (or derives one from prior deployment data).</li>
          <li>Temporarily enforces auto-update for manual run execution.</li>
          <li>Creates update history and packaging job records.</li>
          <li>Restores original policy mode when manual trigger completes.</li>
        </ol>
        <Callout type="info" title="Safety Controls">
          <p>
            Update logic applies failure thresholds, cooldown windows, and rate
            caps to reduce deployment risk.
          </p>
        </Callout>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          Assignment Intents
        </h2>
        <p className="text-text-secondary mb-4">
          When deploying an app (or triggering an update), IntuneGet supports
          four assignment intents that control how Intune installs the package:
        </p>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Intent</TableHeader>
              <TableHeader>Behavior</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell><code>Required</code></TableCell>
              <TableCell className="text-sm text-text-secondary">Automatically installs the app on all targeted devices</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>Available</code></TableCell>
              <TableCell className="text-sm text-text-secondary">Makes the app available in Company Portal for users to install on demand</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>Uninstall</code></TableCell>
              <TableCell className="text-sm text-text-secondary">Removes the app from targeted devices</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>Update Only</code></TableCell>
              <TableCell className="text-sm text-text-secondary">
                Assigns as required but adds a requirement rule so that only
                devices where the app is already installed receive the update
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Callout type="info" title="Update Only for Discovered Apps">
          <p>
            The Update Only intent is especially useful for{" "}
            <Link
              href="/docs/unmanaged-apps"
              className="text-accent-cyan hover:underline"
            >
              discovered/unmanaged apps
            </Link>
            . It updates existing installations without force-installing the app
            on devices that do not already have it. See the Unmanaged Apps
            documentation for full details on how requirement rules are
            generated and the app-level caveat when mixing intents.
          </p>
        </Callout>
      </section>
    </div>
  );
}
