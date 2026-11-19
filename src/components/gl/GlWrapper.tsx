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
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [auditHover, setAuditHover] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Check mobile viewport
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768);
    }

    // Defer WebGL particle canvas mounting until after initial paint & main-thread idle
    let idleId: number | null = null;
    let timerId: NodeJS.Timeout | null = null;

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = (window as any).requestIdleCallback(
        () => setMounted(true),
        { timeout: 1000 }
      );
    } else {
      timerId = setTimeout(() => setMounted(true), 200);
    }

    // Reduced motion accessibility guard
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const onMotionChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", onMotionChange);

    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", onResize, { passive: true });

    // Event listener for button hover introspection
    const onAuditHover = (e: Event) => {
      const customEvent = e as CustomEvent<{ hovering?: boolean }>;
      setAuditHover(Boolean(customEvent.detail?.hovering));
    };

    window.addEventListener("releaselens:audit-hover", onAuditHover);

    return () => {
      if (idleId !== null && typeof window !== "undefined" && "cancelIdleCallback" in window) {
        (window as any).cancelIdleCallback(idleId);
      }
      if (timerId !== null) {
        clearTimeout(timerId);
      }
      mediaQuery.removeEventListener("change", onMotionChange);
      window.removeEventListener("resize", onResize);
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
      <div className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700 ease-out opacity-100">
        <DynamicGL
          hovering={isHovered}
          opacity={targetOpacity}
          speed={targetSpeed}
          noiseIntensity={targetNoise}
          size={isMobile ? 256 : 512}
          pointSize={isMobile ? 12.0 : 10.0}
        />
      </div>
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
