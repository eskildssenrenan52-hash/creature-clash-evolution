// Efeitos especiais pintados por IA (sem personagem): 16 efeitos × 5 quadros em public/fx/fx.png.
// Quadros de 64 px; o brilho já vem com transparência, então desenha sobre qualquer chão.
// Estado é transitório (nunca vai para o save).

export const FX_NAMES = [
  "explosion", "slash", "lightning", "ice",
  "void", "holy", "poison", "wind",
  "earth", "water", "arcane", "impact",
  "meteor", "nature", "shock", "blood",
] as const;
export type FxName = (typeof FX_NAMES)[number];

/** Efeitos que nascem do chão: ancorados pela base em vez do centro. */
const GROUND = new Set<FxName>(["lightning", "holy", "poison", "earth", "water", "arcane", "meteor", "shock", "wind"]);
const FRAME = 64, FRAMES = 5;

export interface FxInst { n: number; x: number; y: number; t: number; dur: number; sc: number; flip: boolean; rot: number }

let img: HTMLImageElement | null | undefined;
function sheet(): HTMLImageElement | null {
  if (img === undefined) {
    if (typeof Image === "undefined") { img = null; return null; }
    img = new Image(); img.src = "/fx/fx.png";
  }
  return img && img.complete && img.naturalWidth ? img : null;
}
/** Pré-carrega a folha (chamado no início do jogo e na tela de aparência). */
export const preloadFx = () => { sheet(); };

export function makeFx(name: FxName, x: number, y: number, sc = 0.6, flip = false, dur = 0.34, rot = 0): FxInst {
  return { n: Math.max(0, FX_NAMES.indexOf(name)), x, y, t: 0, dur, sc, flip, rot };
}

export function tickFx(list: FxInst[], dt: number): FxInst[] {
  for (const f of list) f.t += dt;
  return list.filter((f) => f.t < f.dur);
}

export function drawFxInst(c: CanvasRenderingContext2D, f: FxInst, alpha = 1): boolean {
  const im = sheet(); if (!im) return false;
  const k = Math.min(FRAMES - 1, Math.floor((f.t / f.dur) * FRAMES));
  const s = FRAME * f.sc;
  const ground = GROUND.has(FX_NAMES[f.n] ?? "impact");
  c.save();
  c.globalAlpha *= alpha;
  c.translate(Math.round(f.x), Math.round(f.y));
  if (f.rot) c.rotate(f.rot);
  if (f.flip) c.scale(-1, 1);
  c.drawImage(im, k * FRAME, f.n * FRAME, FRAME, FRAME, -s / 2, ground ? -s * 0.86 : -s / 2, s, s);
  c.restore();
  return true;
}

export function drawFx(c: CanvasRenderingContext2D, list: FxInst[]) {
  for (const f of list) drawFxInst(c, f);
}
