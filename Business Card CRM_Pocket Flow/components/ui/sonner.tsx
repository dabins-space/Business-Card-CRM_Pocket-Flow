"use client";

import dynamic from "next/dynamic";
import { Toaster as Sonner, ToasterProps } from "sonner";

const useTheme = dynamic(() => import("next-themes").then(mod => ({ default: mod.useTheme })), {
  ssr: false,
});

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
