"use client";

import { useEffect, useState } from "react";
import { Effects } from "@react-three/drei";
import { Canvas, extend } from "@react-three/fiber";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { Particles } from "./particles";
import { VignetteShader } from "./shaders/vignetteShader";

// Extend Three.js ShaderPass into R3F catalog
extend({ ShaderPass });

// Declare custom JSX element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      shaderPass: any;
    }
  }
}

interface GLProps {
  hovering?: boolean;
  speed?: number;
  noiseScale?: number;
  noiseIntensity?: number;
  timeScale?: number;
  focus?: number;
  aperture?: number;
  pointSize?: number;
  opacity?: number;
  planeScale?: number;
  size?: number;
  vignetteDarkness?: number;
  vignetteOffset?: number;
}

export const GL = ({
  hovering = false,
  speed = 1.0,
  noiseScale = 0.6,
  noiseIntensity = 0.52,
  timeScale = 1.0,
  focus = 3.8,
  aperture = 1.79,
  pointSize = 10.0,
  opacity = 0.8,
  planeScale = 10.0,
  size = 512,
  vignetteDarkness = 1.5,
  vignetteOffset = 0.4,
}: GLProps) => {
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setHasWebGL(false);
      }
    } catch {
      setHasWebGL(false);
    }
  }, []);

  if (!hasWebGL) {
    return (
      <div
        id="webgl"
        className="fixed inset-0 pointer-events-none bg-black z-0"
        aria-hidden="true"
      />
    );
  }

  return (
    <div id="webgl" aria-hidden="true">
      <Canvas
        camera={{
          position: [
            1.2629783123314589, 2.664606471394044, -1.8178993743288914,
          ],
          fov: 50,
          near: 0.01,
          far: 300,
        }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#000"]} />
        <Particles
          speed={speed}
          aperture={aperture}
          focus={focus}
          size={size}
          noiseScale={noiseScale}
          noiseIntensity={noiseIntensity}
          timeScale={timeScale}
          pointSize={pointSize}
          opacity={opacity}
          planeScale={planeScale}
          useManualTime={false}
          manualTime={0}
          introspect={hovering}
        />
        <Effects multisamping={0} disableGamma>
          <shaderPass
            args={[VignetteShader]}
            uniforms-darkness-value={vignetteDarkness}
            uniforms-offset-value={vignetteOffset}
          />
        </Effects>
      </Canvas>
    </div>
  );
};

export default GL;
