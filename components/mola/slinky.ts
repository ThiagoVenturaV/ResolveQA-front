import { ATLAS, ATLAS_SRC } from "./atlas";
import { smoothstep } from "./physics";

export type SlinkyPose = { cycle: number; strength: number; facing: 1 | -1 };

/** Anticipate → take off → flight → landing → settle. All joints are continuous. */
export function slinkyHop(cycle: number) {
  const p = ((cycle % 1) + 1) % 1;
  if (p < 0.16) return { lift: 0, stretch: 1 - 0.18 * smoothstep(p / 0.16) };
  if (p < 0.76) {
    const flight = (p - 0.16) / 0.6;
    return {
      lift: 62 * Math.sin(Math.PI * flight),
      stretch: 0.82 + 0.26 * Math.sin(Math.PI * flight),
    };
  }
  const landing = (p - 0.76) / 0.24;
  return { lift: 0, stretch: 0.82 + 0.18 * smoothstep(landing) + 0.035 * Math.sin(landing * Math.PI * 2) * Math.sin(landing * Math.PI) };
}

/** Two alternating supports: lead end advances first, trailing end catches up. */
export function slinkyOffsets(t: number, pose: SlinkyPose) {
  const p = ((pose.cycle % 1) + 1) % 1;
  const lead = smoothstep(p * 2);
  const trail = smoothstep((p - 0.5) * 2);
  const frontX = 36 * (lead - p);
  const rearX = 36 * (trail - p);
  const frontY = p < 0.5 ? -28 * Math.sin(Math.PI * lead) : 0;
  const rearY = p >= 0.5 ? -28 * Math.sin(Math.PI * trail) : 0;
  // A delayed wave along the coil bends the arch, rather than scaling the image.
  const wave = Math.sin(Math.PI * t) * Math.sin(2 * Math.PI * (p - t * 0.24)) * 14;
  return {
    x: ((1 - t) * rearX + t * frontX) * pose.strength,
    y: ((1 - t) * rearY + t * frontY + wave) * pose.strength,
  };
}

let image: HTMLImageElement | undefined;

/** Paints the existing idle artwork as narrow elastic strips; owns no timers. */
export function paintSlinky(host: HTMLElement, pose: SlinkyPose | null) {
  const canvas = host.querySelector<HTMLCanvasElement>(".mola-slinky");
  if (!canvas) return;
  if (!pose) {
    canvas.hidden = true;
    host.style.backgroundImage = `url(${ATLAS_SRC})`;
    host.dataset.locomotion = "walk";
    return;
  }
  if (!image) { image = new Image(); image.src = ATLAS_SRC; }
  if (!image.complete || !image.naturalWidth) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.hidden = false;
  host.style.backgroundImage = "none";
  host.dataset.locomotion = "slinky";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const hop = slinkyHop(pose.cycle);
  const lift = hop.lift * pose.strength;
  const stretch = 1 + (hop.stretch - 1) * pose.strength;
  ctx.save();
  ctx.translate(16 + (pose.facing < 0 ? ATLAS.cellW : 0), 64);
  ctx.scale(pose.facing, 1);
  ctx.imageSmoothingEnabled = false;
  // The fixed shadow provides a ground reference while the body is airborne.
  ctx.fillStyle = `rgba(41,43,35,${0.16 - lift / 620})`;
  ctx.beginPath();
  ctx.ellipse(96, 181, 58 - lift * 0.25, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Overlapping subpixel strips avoid cracks while retaining the original face,
  // rainbow coils and pixel-art texture. No generated replacement character.
  for (let x = 0; x < ATLAS.cellW; x += 2) {
    const t = Math.max(0, Math.min(1, (x - 16) / 160));
    const nextT = Math.max(0, Math.min(1, (x + 2 - 16) / 160));
    const a = slinkyOffsets(t, pose), b = slinkyOffsets(nextT, pose);
    ctx.drawImage(image, x, 0, 2, ATLAS.cellH,
      x + a.x, 179 * (1 - stretch) + a.y - lift,
      2 + b.x - a.x + 0.4, ATLAS.cellH * stretch);
  }
  ctx.restore();
}
