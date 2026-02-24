import React from "react";
import { cn } from "../../lib/utils";

export const PixelBackground: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        "fixed inset-0 pointer-events-none z-[-1] opacity-10",
        className
      )}
      style={{
        backgroundImage: `
          linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent),
          linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent)
        `,
        backgroundSize: "50px 50px",
      }}
    />
  );
};
