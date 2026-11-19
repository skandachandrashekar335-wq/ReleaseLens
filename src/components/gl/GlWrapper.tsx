"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const DynamicGL = dynamic(
  () => import("./index").then((mod) => mod.GL),
  {
    ssr: false,
    loading: () => (
      <div
        id="webgl"
        className="fixed inset-0 pointer-events-none bg-black z-0"
        aria-hidden="true"
      />
    ),
  }
);

interface GlBackgroundProps {
  hovering?: boolean;
}

export function GlBackground({ hovering: propHovering }: GlBackgroundProps) {
  const [mounted, setMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [auditHover, setAuditHover] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);

    // Reduced motion accessibility guard
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const onMotionChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", onMotionChange);

    // Event listener for button hover introspection
    const onAuditHover = (e: Event) => {
      const customEvent = e as CustomEvent<{ hovering?: boolean }>;
      setAuditHover(Boolean(customEvent.detail?.hovering));
    };

    window.addEventListener("releaselens:audit-hover", onAuditHover);

    return () => {
      mediaQuery.removeEventListener("change", onMotionChange);
      window.removeEventListener("releaselens:audit-hover", onAuditHover);
    };
  }, []);

  if (!mounted) {
    return (
      <div
        id="webgl"
        className="fixed inset-0 pointer-events-none bg-black z-0"
        aria-hidden="true"
      />
    );
  }

  const isHome = pathname === "/";
  const isHovered = propHovering !== undefined ? propHovering : auditHover;

  // Route-aware intensity & motion tuning:
  // Landing page (/): full vivid intensity (0.82 opacity, 1.0 speed, 0.52 noise)
  // Inner routes (/projects/*, /dashboard, etc.): subtle ambient wave (0.38 opacity, 0.65 speed)
  const targetOpacity = isHome ? 0.82 : 0.38;
  const targetSpeed = prefersReducedMotion ? 0.05 : isHome ? 1.0 : 0.65;
  const targetNoise = isHome ? 0.52 : 0.35;

  return (
    <>
      <DynamicGL
        hovering={isHovered}
        opacity={targetOpacity}
        speed={targetSpeed}
        noiseIntensity={targetNoise}
      />
      {/* Route-Aware Ambient Contrast Shield for Inner Dashboards */}
      {!isHome && (
        <div
          className="fixed inset-0 pointer-events-none z-0 bg-black/40 backdrop-blur-[1px] transition-opacity duration-500"
          aria-hidden="true"
        />
      )}
    </>
  );
}

export default GlBackground;
