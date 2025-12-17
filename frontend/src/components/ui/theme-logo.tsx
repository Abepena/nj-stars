"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

// Logo source paths for each theme
const LOGO_LIGHT_MODE = "/brand/logos/text-logo-light.svg"; // Light-colored logo for light backgrounds
const LOGO_DARK_MODE = "/brand/logos/text-logo-dark.svg"; // Dark-colored logo for dark backgrounds

interface ThemeLogoProps {
  width?: number;
  height?: number;
  className?: string;
  linkTo?: string | null;
}

/**
 * Theme-aware logo component that switches between light/dark variants
 * based on the current theme (detected via document.documentElement class)
 */
export function ThemeLogo({
  width = 160,
  height = 50,
  className = "",
  linkTo = "/",
}: ThemeLogoProps) {
  const [logoSrc, setLogoSrc] = useState(LOGO_DARK_MODE);

  useEffect(() => {
    const updateLogo = () => {
      const isLightMode = document.documentElement.classList.contains("light");
      setLogoSrc(isLightMode ? LOGO_LIGHT_MODE : LOGO_DARK_MODE);
    };

    // Initial update
    updateLogo();

    // Watch for class changes on html element
    const observer = new MutationObserver(updateLogo);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const imageElement = (
    <Image
      src={logoSrc}
      alt="NJ Stars"
      width={width}
      height={height}
      className={className}
      priority
    />
  );

  if (linkTo) {
    return (
      <Link
        href={linkTo}
        className="transition-opacity duration-200 ease-in-out hover:opacity-80"
      >
        {imageElement}
      </Link>
    );
  }

  return imageElement;
}
