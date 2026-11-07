import type { CSSProperties } from "react";

export const skins = [
  { name: "Lima", color: "#bfdf62", shade: "#728b34", light: "#e6f5a4" },
  { name: "Tangerina", color: "#ef8854", shade: "#af4b31", light: "#ffd1a2" },
  { name: "Lavanda", color: "#b3a0e7", shade: "#75609e", light: "#e0d6ff" },
  { name: "Cromo", color: "#b7c1c3", shade: "#6c8188", light: "#edf6f5" },
  { name: "Fliperama", color: "#f297b4", shade: "#a34b81", light: "#c5ed8b" },
  { name: "Azul", color: "#88b5ec", shade: "#47749e", light: "#c7e4ff" },
];

export function Spring({ skin = 0, className = "", carrying = false }: { skin?: number; className?: string; carrying?: boolean }) {
  const palette = skins[skin] || skins[0];
  return <div className={`spring-character ${carrying ? "spring-carrying" : ""} ${className}`} style={{ "--spring-color": palette.color } as CSSProperties}>
    <svg viewBox="0 0 220 185" role="img" aria-label={`Mola de brinquedo pixel art ${palette.name}`} shapeRendering="crispEdges">
      <ellipse cx="113" cy="166" rx="79" ry="8" fill="#292b23" opacity=".09" />
      <g className="spring-coils">
        {Array.from({ length: 14 }, (_, i) => {
          const angle = Math.PI - (i / 13) * Math.PI;
          const x = 110 + Math.cos(angle) * 67;
          const y = 138 - Math.sin(angle) * 80;
          return <g key={i} transform={`translate(${Math.round(x)} ${Math.round(y)}) rotate(${Math.round((i - 6.5) * 9)})`}>
            <path d="M-25 -10 H-18 V-16 H13 V-12 H23 V-6 H28 V8 H22 V15 H-17 V11 H-26 V4 H-30 V-5 H-25 Z" fill={palette.shade} stroke="#343d26" strokeWidth="2" />
            <path d="M-22 -10 H-15 V-14 H13 V-10 H21 V-4 H25 V5 H20 V10 H-16 V7 H-24 V0 H-27 V-5 H-22 Z M-14 -6 V3 H14 V-6 Z" fill={i % 3 === 0 && skin === 4 ? "#b9e877" : palette.color} fillRule="evenodd" />
            <path d="M-17 -10 H12 V-7 H-17 Z M-23 -6 H-20 V1 H-23 Z" fill={palette.light} />
          </g>;
        })}
        <g className="spring-face" fill="#293126">
          <path d="M74 61 h7 v10 h-7z M99 55 h7 v10 h-7z" />
          <path d="M84 75 h4 v4 h9 v-4 h4 v7 h-17z" />
          <path d="M76 62 h2 v3 h-2z M101 56 h2 v3 h-2z" fill="white" />
        </g>
      </g>
      <path d="M25 144 h21 v7 h-21z M164 144 h24 v7 h-24z" fill={palette.shade} />
    </svg>
  </div>;
}
