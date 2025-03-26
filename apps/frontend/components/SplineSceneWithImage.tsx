"use client";

import { Suspense, lazy, useState, useEffect, useRef } from "react";
import * as THREE from "three"; // Required for texture handling
const Spline = lazy(() => import("@splinetool/react-spline"));
import { Application } from "@splinetool/runtime";

interface SplineSceneProps {
  scene: string;
  className?: string;
  imageUrl?: string; // Optional URL of your image
  objectName: string; // Name of the object in the Spline scene to apply the image
  useOwlImage?: boolean; // Flag to use the owl image
}

// Butterfly particle component
const ButterflyParticles = ({ count = 15 }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const butterflies: HTMLDivElement[] = [];

    // Create butterflies
    for (let i = 0; i < count; i++) {
      const butterfly = document.createElement("div");
      butterfly.className = "absolute w-3 h-3";
      butterfly.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L8 6L12 10L16 6L12 2Z" fill="${getRandomColor()}" />
          <path d="M12 10L8 14L12 18L16 14L12 10Z" fill="${getRandomColor()}" />
        </svg>
      `;

      // Random starting position
      butterfly.style.left = `${Math.random() * 100}%`;
      butterfly.style.top = `${Math.random() * 100}%`;
      butterfly.style.opacity = `${0.3 + Math.random() * 0.7}`;
      butterfly.style.transform = `scale(${0.5 + Math.random()})`;

      container.appendChild(butterfly);
      butterflies.push(butterfly);

      // Animate each butterfly
      animateButterfly(butterfly);
    }

    function getRandomColor() {
      const colors = ["#7e57c2", "#5c6bc0", "#42a5f5", "#26c6da", "#26a69a"];
      return colors[Math.floor(Math.random() * colors.length)];
    }

    function animateButterfly(butterfly: HTMLDivElement) {
      const speed = 2 + Math.random() * 4;
      const direction = Math.random() * Math.PI * 2;
      let x = parseFloat(butterfly.style.left);
      let y = parseFloat(butterfly.style.top);
      let angle = 0;
      const scale = parseFloat(
        butterfly.style.transform.replace("scale(", "").replace(")", "")
      );

      function update() {
        // Flutter wings by scaling
        angle += 0.1;
        const wingScale = scale + Math.sin(angle) * 0.1;

        // Move in a somewhat random path
        x += Math.cos(direction + Math.sin(angle * 0.2) * 0.5) * speed * 0.05;
        y += Math.sin(direction + Math.sin(angle * 0.2) * 0.5) * speed * 0.05;

        // Wrap around edges
        if (x > 100) x = 0;
        if (x < 0) x = 100;
        if (y > 100) y = 0;
        if (y < 0) y = 100;

        butterfly.style.left = `${x}%`;
        butterfly.style.top = `${y}%`;
        butterfly.style.transform = `scale(${wingScale}) rotate(${Math.sin(angle * 0.5) * 15}deg)`;

        requestAnimationFrame(update);
      }

      update();
    }

    return () => {
      // Cleanup
      butterflies.forEach((butterfly) => {
        if (container.contains(butterfly)) {
          container.removeChild(butterfly);
        }
      });
    };
  }, [count]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none z-10"
    ></div>
  );
};

export function SplineSceneWithImage({
  scene,
  className,
  imageUrl,
  objectName,
  useOwlImage = false,
}: SplineSceneProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleSceneLoad = (spline: Application) => {
    // Set loaded state
    setIsLoaded(true);

    // Find the object in the Spline scene by name
    const imageObject = spline.findObjectByName(objectName);
    if (imageObject) {
      const textureLoader = new THREE.TextureLoader();

      // Use the owl image if specified, otherwise use the provided imageUrl
      const imageToLoad = useOwlImage ? "/owl-logo.png" : imageUrl;

      // Only attempt to load if we have an image path
      if (imageToLoad) {
        textureLoader.load(
          imageToLoad,
          (texture: THREE.Texture) => {
            // Set the texture (image) to the object's material
            const obj = imageObject as {
              material?: {
                map: THREE.Texture;
                needsUpdate: boolean;
                emissive?: THREE.Color;
                emissiveIntensity?: number;
              };
            };
            if (obj.material) {
              obj.material.map = texture;

              // Add subtle glow effect
              if (obj.material.emissive) {
                obj.material.emissive = new THREE.Color(0x0088ff);
                obj.material.emissiveIntensity = 0.5;
              }

              obj.material.needsUpdate = true; // Trigger a re-render
            }

            // Add subtle animation to the object
            const animate = () => {
              if (imageObject) {
                // Apply subtle floating animation
                const time = Date.now() * 0.001;
                imageObject.position.y += Math.sin(time) * 0.0005;
                imageObject.rotation.y += 0.001;
              }
              requestAnimationFrame(animate);
            };
            animate();
          },
          undefined,
          (error: unknown) => console.error("Failed to load texture:", error)
        );
      }
    } else {
      console.warn(`Object with name "${objectName}" not found in the scene.`);
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Butterfly particles overlay */}
      {isLoaded && (
        <>
          <ButterflyParticles count={12} />
          <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-b from-blue-500/5 to-purple-500/5 mix-blend-overlay"></div>
        </>
      )}

      <Suspense
        fallback={
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-r from-gray-900/5 to-gray-800/5">
            <div className="relative w-16 h-16">
              <span
                className="loader absolute"
                style={{
                  display: "inline-block",
                  width: "40px",
                  height: "40px",
                  border: "3px solid rgba(0,120,255,0.1)",
                  borderRadius: "50%",
                  borderTopColor: "#0088ff",
                  animation: "spin 1s ease-in-out infinite",
                }}
              ></span>
              <span
                className="loader absolute"
                style={{
                  display: "inline-block",
                  width: "30px",
                  height: "30px",
                  margin: "5px",
                  border: "2px solid rgba(120,0,255,0.1)",
                  borderRadius: "50%",
                  borderTopColor: "#7800ff",
                  animation: "spin 1.5s ease-in-out infinite reverse",
                }}
              ></span>
            </div>
            <p className="mt-4 text-sm text-gray-500 font-mono">Loading...</p>
          </div>
        }
      >
        <div
          className={`relative ${className} transition-opacity duration-1000 ${isLoaded ? "opacity-100" : "opacity-0"}`}
        >
          <Spline
            scene={scene}
            onLoad={handleSceneLoad}
            className={className}
          />
        </div>
      </Suspense>
    </div>
  );
}
