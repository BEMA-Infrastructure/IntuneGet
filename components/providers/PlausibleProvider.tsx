"use client";

import { useEffect } from "react";
import { init } from "@plausible-analytics/tracker";

interface PlausibleProviderProps {
  domain: string;
  children: React.ReactNode;
}

export function PlausibleProvider({ domain, children }: PlausibleProviderProps) {
  useEffect(() => {
    init({
      domain,
      hashBasedRouting: false,
      autoCapturePageviews: true,
    });
  }, [domain]);

  return <>{children}</>;
}
