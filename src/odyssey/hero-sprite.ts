// Protagonista com os sprites do primeiro jogo: corpo base, skins prontas e arma equipada em camadas.
import type { ItemDef, Palette, WeaponKind } from "./data";
import { drawK, kImage, K_DIR } from "./kaetram";
import type { CharExtras } from "./gfx";

export interface HeroSkin { id: string; name: string; desc: string; sheet: string; minLevel: number }
/** Índice salvo em Look.kskin. O último item volta ao herói desenhado em pixels (personalizável). */
export const HERO_SKINS: HeroSkin[] = [
  { id: "base", name: "Aventureiro", desc: "O herói clássico do primeiro jogo.", sheet: "player/base", minLevel: 1 },
  { id: "danbo", name: "Danbo", desc: "Robô de papelão, firme e leal.", sheet: "player/skin/danbo", minLevel: 1 },
  { id: "danboblue", name: "Danbo Azul", desc: "Pintado com tinta do mar.", sheet: "player/skin/danboblue", minLevel: 2 },
  { id: "danbogreen", name: "Danbo Verde", desc: "Camuflado para a mata.", sheet: "player/skin/danbogreen", minLevel: 3 },
  { id: "danbored", name: "Danbo Rubro", desc: "Pronto para a forja.", sheet: "player/skin/danbored", minLevel: 4 },
  { id: "taekwondo", name: "Mestre Taekwondo", desc: "Faixa preta e dobok branco.", sheet: "player/skin/taekwondo", minLevel: 5 },
  { id: "oldman", name: "Velho Sábio", desc: "Barba longa, passos lentos, olhar atento.", sheet: "player/skin/oldmanskin", minLevel: 7 },
  { id: "skeleton", name: "Esqueleto", desc: "Voltou do Abismo e esqueceu de morrer.", sheet: "player/skin/skeletonskin", minLevel: 10 },
  { id: "darkskeleton", name: "Esqueleto Sombrio", desc: "Ossos tingidos pela Noite.", sheet: "player/skin/darkskeletonskin", minLevel: 15 },
  { id: "classic", name: "Herói em pixels", desc: "O visual personalizável original (pele, cabelo, roupa…).", sheet: "", minLevel: 1 },
];
export const CLASSIC_SKIN = HERO_SKINS.length - 1;
export const skinUnlocked = (i: number, level: number) => level >= (HERO_SKINS[i]?.minLevel ?? 1);

/** Folha de arma para cada tipo quando o item não tiver uma própria. */
const KIND_SPRITE: Record<WeaponKind, string> = { sword: "tinsword", spear: "bronzespear", bow: "woodenbow", staff: "naturestaff" };
export function weaponSheet(item: Pick<ItemDef, "sprite" | "weapon"> | undefined): string {
  const s = item?.sprite ?? KIND_SPRITE[item?.weapon ?? "sword"];
  return `player/weapon/${s}`;
}

/**
 * Desenha o herói com sprites Kaetram. Retorna false quando a skin é a clássica
 * ou as imagens ainda não carregaram (o jogo então usa drawChar).
 */
export function drawHero(c: CanvasRenderingContext2D, x: number, y: number, o: { skin: number; dir: number; moving: boolean; frameT: number; attack: number; weapon?: Pick<ItemDef, "sprite" | "weapon"> | null; time: number; alpha?: number; scale?: number; pal?: Palette; extras?: CharExtras }): boolean {
  const skin = HERO_SKINS[o.skin] ?? HERO_SKINS[0];
  if (!skin.sheet || !kImage(skin.sheet)) return false;
  const d = K_DIR[o.dir] ?? "down", flip = o.dir === 1;
  const bow = o.weapon?.weapon === "bow";
  const attacking = o.attack > 0;
  const anim = attacking ? `${bow ? "bow_" : ""}atk_${d}` : o.moving ? `walk_${d}` : `idle_${d}`;
  const frame = attacking ? Math.min(3, Math.floor((1 - o.attack) * 4)) : o.moving ? o.frameT : o.time * 2.2;
  const wsheet = o.weapon ? weaponSheet(o.weapon) : null;
  const sc = o.scale ?? 1, a = o.alpha ?? 1;
  if (wsheet && d === "up") drawK(c, wsheet, anim, frame, x, y, flip, a, sc);
  drawK(c, skin.sheet, anim, frame, x, y, flip, a, sc);
  if (wsheet && d !== "up") drawK(c, wsheet, anim, frame, x, y, flip, a, sc);
  drawCustomization(c, x, y, d, o.pal, o.extras, o.time, sc, a);
  return true;
}

function drawCustomization(c: CanvasRenderingContext2D, x: number, y: number, dir: string, pal: Palette | undefined, ex: CharExtras | undefined, time: number, sc: number, alpha: number) {
  if (!pal && !ex) return;
  c.save(); c.globalAlpha = alpha; c.translate(Math.round(x), Math.round(y)); c.scale(sc, sc);
  const face = pal?.skin ?? "#f0c8a0", hair = pal?.hair ?? "#f0d040", eye = ex?.eyes ?? "#202030";
  // Tint suave: preserva os pixels da skin Kaetram e aplica a escolha do jogador.
  c.globalCompositeOperation = "multiply"; c.globalAlpha = alpha * .2; c.fillStyle = face; c.fillRect(-4, -16, 8, 7); c.globalCompositeOperation = "source-over";
  c.globalAlpha = alpha * .7;
  if (ex?.cape) { c.fillStyle = ex.cape; c.beginPath(); c.moveTo(-7, -9); c.quadraticCurveTo(-11, -3 + Math.sin(time * 4) * 1.4, -6, 0); c.lineTo(3, -1); c.lineTo(4, -10); c.closePath(); c.fill(); }
  c.fillStyle = hair; c.fillRect(-4, -18, 8, 2); if (ex?.hairStyle === 1) c.fillRect(-6, -14, 2, 6); if (ex?.hairStyle === 2) { c.fillRect(-5, -20, 2, 2); c.fillRect(3, -20, 2, 2); }
  if (dir === "down" || dir === "left" || dir === "right") { c.fillStyle = eye; c.fillRect(dir === "left" ? -4 : 2, -14, 1.5, 2); c.fillRect(dir === "right" ? 2 : -4, -14, 1.5, 2); }
  if (ex?.mark === 1) { c.fillStyle = "#d84b55"; c.fillRect(dir === "left" ? -2 : 2, -12, 1, 4); }
  if (ex?.mark === 2) { c.fillStyle = "#a05a30"; c.fillRect(-3, -11, 1, 1); c.fillRect(2, -11, 1, 1); }
  if (ex?.hat && ex.hatColor) { c.fillStyle = ex.hatColor; c.fillRect(-6, -19, 12, 2); c.fillRect(-3, -22, 6, 3); if (ex.hat === 2) c.fillRect(-1, -25, 2, 3); }
  c.restore();
}
