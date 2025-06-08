"use client";

import React from "react";
import { IconAlertCircle } from "@tabler/icons-react";

interface ParallaxCardProps {
  slug: string;
}

export default function ParallaxCard({ slug }: ParallaxCardProps) {
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      // Calculate mouse position as percentage (-1 to 1)
      const x = (clientX / innerWidth - 0.5) * 2;
      const y = (clientY / innerHeight - 0.5) * 2;

      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Calculate transform values with enhanced 3D rotation
  const transformX = mousePosition.x * 15; // Increased movement
  const transformY = mousePosition.y * 15; // Increased movement
  const rotateX = mousePosition.y * -15; // Enhanced X rotation (inverted for natural feel)
  const rotateY = mousePosition.x * 15; // Enhanced Y rotation
  const rotateZ = mousePosition.x * 5; // Added Z rotation for more 3D effect

  return (
    <div
      className="perspective-1000 relative z-10 mx-auto w-full max-w-md px-6 text-center transition-transform duration-150 ease-out"
      style={{
        transform: `translate3d(${transformX}px, ${transformY}px, 0) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
        transformStyle: "preserve-3d",
      }}
    >
      <div
        className="relative mb-8 flex justify-center"
        style={{
          transform: `rotateX(${rotateX * 0.5}deg) rotateY(${rotateY * 0.5}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        <div className="rounded-full bg-white/5 p-5 backdrop-blur-md transition-transform duration-150">
          <IconAlertCircle className="h-16 w-16 text-red-400" />
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl"
        style={{
          transform: `translateZ(20px)`,
          transformStyle: "preserve-3d",
        }}
      >
        <h1 className="sora mb-4 text-3xl font-bold tracking-tight text-white">
          Link Not Found
        </h1>
        <p className="text-zinc-300">
          The link{" "}
          <span className="font-medium text-white">&quot;{slug}&quot;</span>{" "}
          doesn&apos;t exist or has been removed.
        </p>
      </div>
    </div>
  );
}
