import type { CSSProperties } from "react";

export type SpringPose = "idle" | "compress" | "reach" | "transport" | "celebrate";

/** Hue offsets over a shared rainbow coil strip — personality without losing arco-íris. */
export const skins = [
  { name: "Lima", offset: 0, color: "linear-gradient(135deg,#7fd96a,#45c7e0,#b07af0)" },
  { name: "Tangerina", offset: 1, color: "linear-gradient(135deg,#ff8f3a,#f2c94c,#7fd96a)" },
  { name: "Lavanda", offset: 3, color: "linear-gradient(135deg,#b07af0,#5b8ef0,#ff5a5a)" },
  { name: "Cromo", offset: 5, color: "linear-gradient(135deg,#5b8ef0,#b07af0,#ff8f3a)" },
  { name: "Fliperama", offset: 2, color: "linear-gradient(135deg,#f2c94c,#ff5a5a,#45c7e0)" },
  { name: "Azul", offset: 4, color: "linear-gradient(135deg,#45c7e0,#5b8ef0,#7fd96a)" },
];

const rainbow = [
  { color: "#ff5a5a", shade: "#c23636", light: "#ffb4b4" },
  { color: "#ff8f3a", shade: "#c45c18", light: "#ffd0a6" },
  { color: "#f2c94c", shade: "#b8911c", light: "#fff0ab" },
  { color: "#7fd96a", shade: "#458f35", light: "#c7f5b6" },
  { color: "#45c7e0", shade: "#247f96", light: "#b4eef8" },
  { color: "#5b8ef0", shade: "#3558ab", light: "#b9d1ff" },
  { color: "#b07af0", shade: "#6e48ad", light: "#dcc4ff" },
];

/** Paper-board coil path: thick, chunky rings with a crisp pixel silhouette. */
const coilOuter = "M-26 -11 H-18 V-17 H14 V-12 H24 V-6 H29 V9 H23 V16 H-18 V12 H-27 V5 H-31 V-4 H-26 Z";
const coilInner = "M-22 -10 H-14 V-14 H14 V-10 H22 V-3 H26 V6 H21 V11 H-16 V8 H-24 V1 H-27 V-5 H-22 Z M-14 -6 V4 H15 V-6 Z";
const coilLite = "M-17 -10 H13 V-7 H-17 Z M-23 -6 H-19 V2 H-23 Z";

function coilLayout(pose: SpringPose, index: number, total: number) {
  const t = index / (total - 1);
  if (pose === "compress") {
    return {
      x: 110 + (t - 0.5) * 18,
      y: 128 - t * 22,
      rot: (t - 0.5) * 8,
      scaleX: 1.18,
      scaleY: 0.62,
    };
  }
  if (pose === "reach") {
    const stretch = t * t;
    return {
      x: 72 + stretch * 118,
      y: 132 - Math.sin(t * Math.PI) * 58 - stretch * 18,
      rot: -18 + t * 48,
      scaleX: 0.92 + stretch * 0.2,
      scaleY: 0.88,
    };
  }
  if (pose === "transport") {
    const angle = Math.PI - t * Math.PI;
    return {
      x: 110 + Math.cos(angle) * 78,
      y: 136 - Math.sin(angle) * 74,
      rot: (t - 0.5) * 22,
      scaleX: 1.02,
      scaleY: 0.94,
    };
  }
  if (pose === "celebrate") {
    const angle = Math.PI - t * Math.PI;
    return {
      x: 110 + Math.cos(angle) * 62,
      y: 118 - Math.sin(angle) * 96,
      rot: (t - 0.5) * 14,
      scaleX: 0.96,
      scaleY: 1.08,
    };
  }
  // idle — arched walk from prancha 01 (Playful Paper)
  const angle = Math.PI - t * Math.PI;
  return {
    x: 110 + Math.cos(angle) * 67,
    y: 138 - Math.sin(angle) * 80,
    rot: (t - 0.5) * 18,
    scaleX: 1,
    scaleY: 1,
  };
}

export function Spring({
  skin = 0,
  className = "",
  carrying = false,
  pose = "idle",
}: {
  skin?: number;
  className?: string;
  carrying?: boolean;
  pose?: SpringPose;
}) {
  const palette = skins[skin] || skins[0];
  const coils = 14;
  const showCard = pose === "transport" || pose === "celebrate" || (carrying && pose === "idle");
  const showSparkles = pose === "celebrate";

  return (
    <div
      className={`spring-character spring-pose-${pose} ${carrying ? "spring-carrying" : ""} ${className}`}
      style={{ "--spring-color": rainbow[(palette.offset) % rainbow.length].color } as CSSProperties}
      data-pose={pose}
    >
      <svg viewBox="0 0 220 185" role="img" aria-label={`Mola arco-íris pixel art ${palette.name}`} shapeRendering="crispEdges">
        <ellipse cx="113" cy="166" rx="79" ry="8" fill="#292b23" opacity=".09" />
        <g className="spring-coils">
          {Array.from({ length: coils }, (_, i) => {
            const band = rainbow[(i + palette.offset) % rainbow.length];
            const layout = coilLayout(pose, i, coils);
            return (
              <g
                key={i}
                className="spring-coil"
                transform={`translate(${Math.round(layout.x)} ${Math.round(layout.y)}) rotate(${Math.round(layout.rot)}) scale(${layout.scaleX.toFixed(2)} ${layout.scaleY.toFixed(2)})`}
              >
                <path d={coilOuter} fill={band.shade} stroke="#2a2d24" strokeWidth="2" />
                <path d={coilInner} fill={band.color} fillRule="evenodd" />
                <path d={coilLite} fill={band.light} />
              </g>
            );
          })}
          <g className="spring-face" fill="#293126">
            {pose === "compress" ? (
              <>
                <path d="M96 108 h8 v4 h-8z M114 108 h8 v4 h-8z" />
                <path d="M104 118 h12 v3 h-12z" />
              </>
            ) : pose === "celebrate" ? (
              <>
                <path d="M78 42 h7 v9 h-7z M104 36 h7 v9 h-7z" />
                <path d="M80 43 h2 v3 h-2z M106 37 h2 v3 h-2z" fill="white" />
                <path d="M88 54 h4 v3 h8 v-3 h4 v5 h-4 v3 h-8 v-3 h-4z" />
              </>
            ) : pose === "reach" ? (
              <>
                <path d="M148 48 h7 v10 h-7z M172 42 h7 v10 h-7z" />
                <path d="M150 49 h2 v3 h-2z M174 43 h2 v3 h-2z" fill="white" />
                <path d="M156 62 h16 v4 h-16z" />
              </>
            ) : (
              <>
                <path d="M74 61 h7 v10 h-7z M99 55 h7 v10 h-7z" />
                <path d="M76 62 h2 v3 h-2z M101 56 h2 v3 h-2z" fill="white" />
                <path d="M84 75 h4 v4 h9 v-4 h4 v7 h-17z" />
              </>
            )}
          </g>
          {showCard && (
            <g className="spring-held-card" transform={pose === "celebrate" ? "translate(96 18)" : "translate(88 28)"}>
              <rect x="0" y="0" width="28" height="22" rx="2" fill="#fcfcf3" stroke="#2a2d24" strokeWidth="2" />
              <path d="M6 7 h16 v2 H6z M6 12 h11 v2 H6z" fill="#97ad65" />
            </g>
          )}
          {showSparkles && (
            <g className="spring-sparkles" fill="#f2c94c" stroke="#2a2d24" strokeWidth="1">
              <path d="M52 28 h4 v4 h-4z M168 22 h4 v4 h-4z M110 8 h4 v4 h-4z" />
              <path d="M44 48 h3 v3 h-3z M176 46 h3 v3 h-3z" fill="#ff8f3a" />
            </g>
          )}
        </g>
        <g className="spring-feet" fill="#2a2d24">
          {pose === "compress" ? (
            <path d="M78 148 h28 v7 H78z M114 148 h28 v7 H114z" />
          ) : pose === "reach" ? (
            <path d="M38 148 h22 v7 H38z M168 140 h24 v7 H168z" />
          ) : (
            <path d="M25 144 h21 v7 H25z M164 144 h24 v7 H164z" />
          )}
        </g>
      </svg>
    </div>
  );
}
