import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { drawChar } from "@/odyssey/gfx";
import { drawHero, HERO_SKINS, CLASSIC_SKIN, skinUnlocked } from "@/odyssey/hero-sprite";
import {
  CAPES, DEFAULT_LOOK, EYE_COLORS, HAIR_COLORS, HAIR_STYLES, HATS, MARKS, OUTFITS, SKIN_PRESETS, SKIN_TONES,
  getLook, randomLook, resolveLook, setLook, type Look,
} from "@/odyssey/appearance";

type Cat = "skins" | "skin" | "hair" | "style" | "eyes" | "outfit" | "cape" | "hat" | "mark";
const CATS: [Cat, string][] = [["skins", "Skins"], ["skin", "Pele"], ["hair", "Cabelo"], ["style", "Estilo"], ["eyes", "Olhos"], ["outfit", "Roupa"], ["cape", "Capa"], ["hat", "Chapéu"], ["mark", "Rosto"]];

function Preview({ look, armor, ring }: { look: Look; armor: string; ring: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [dir, setDir] = useState(0);
  const [frame, setFrame] = useState(0);
  const [walk, setWalk] = useState(true);
  useEffect(() => { if (!walk) { setFrame(0); return; } const id = window.setInterval(() => setFrame((f) => (f + 1) % 4), 220); return () => clearInterval(id); }, [walk]);
  useEffect(() => {
    const c = ref.current?.getContext("2d"); if (!c) return;
    const r = resolveLook(look, armor, ring);
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 84, 156); c.imageSmoothingEnabled = false;
    c.setTransform(6, 0, 0, 6, 0, 0);
    if (!drawHero(c, 7, 22, { skin: look.kskin, dir, moving: walk, frameT: frame, attack: 0, time: frame }))
      drawChar(c, 7, 22, r.pal, dir, frame, null, 0, r.extras);
  }, [look, armor, ring, dir, frame]);
  return (
    <div className="look-preview">
      <canvas ref={ref} width={84} height={156} aria-label="Pré-visualização do herói" />
      <div className="look-preview-btns">
        <Button variant="game" className="game-btn" aria-label="Girar à esquerda" onClick={() => setDir((d) => [2, 3, 1, 0][d] ?? 0)}>⟲</Button>
        <Button variant="game" className="game-btn" aria-label={walk ? "Parar" : "Andar"} onClick={() => setWalk((w) => !w)}>{walk ? "❚❚" : "▶"}</Button>
        <Button variant="game" className="game-btn" aria-label="Girar à direita" onClick={() => setDir((d) => [1, 2, 3, 0][d] ?? 0)}>⟳</Button>
      </div>
    </div>
  );
}

export function AppearancePanel({ level, armor, ring }: { level: number; armor: string; ring: string }) {
  const [look, setL] = useState<Look>(() => getLook());
  const [cat, setCat] = useState<Cat>("skins");
  const apply = (patch: Partial<Look>) => { const n = { ...look, kskin: CLASSIC_SKIN, ...patch }; setL(n); setLook(n); };
  const set = (n: Look) => { setL(n); setLook(n); };

  const swatches = (items: { name: string; color: string }[], key: keyof Look) => (
    <div className="look-grid">{items.map((s, i) => (
      <button key={s.name} className={`look-swatch ${look[key] === i ? "on" : ""}`} onClick={() => apply({ [key]: i } as Partial<Look>)} aria-label={s.name} aria-pressed={look[key] === i} title={s.name}>
        <span style={{ background: s.color || "transparent" }} className={s.color ? "" : "look-none"}>{s.color ? "" : "∅"}</span><small>{s.name}</small>
      </button>))}
    </div>
  );
  const chips = (names: string[], key: keyof Look, locked?: (i: number) => number | undefined) => (
    <div className="look-grid look-chips">{names.map((n, i) => {
      const need = locked?.(i); const lock = need !== undefined && level < need;
      return <button key={n} disabled={lock} className={`look-chip ${look[key] === i ? "on" : ""}`} onClick={() => apply({ [key]: i } as Partial<Look>)} aria-pressed={look[key] === i}>{n}{lock && <small>Nv {need}</small>}</button>;
    })}</div>
  );

  return (
    <div className="look-layout">
      <Preview look={look} armor={armor} ring={ring} />
      <div className="look-editor">
        <div className="look-cats" role="tablist" aria-label="Categorias">{CATS.map(([id, label]) => <button key={id} role="tab" aria-selected={cat === id} className={cat === id ? "on" : ""} onClick={() => setCat(id)}>{label}</button>)}</div>
        <div className="look-options">
          {cat === "skins" && <><div className="look-skins">{HERO_SKINS.map((s, i) => <Button key={s.id} variant="game" disabled={!skinUnlocked(i, level)} aria-pressed={look.kskin === i} className={`look-skin h-auto whitespace-normal text-left ${look.kskin === i ? "ring-1 ring-primary" : ""}`} onClick={() => apply({ kskin: i })}><b>{s.name}</b><small>{skinUnlocked(i, level) ? s.desc : `Libera no nível ${s.minLevel}`}</small></Button>)}</div><div className="look-skins mt-3">{SKIN_PRESETS.map((s) => {
            const lock = level < s.minLevel;
            return <Button variant="game" key={s.id} disabled={lock} className="look-skin h-auto whitespace-normal text-left" onClick={() => set({ ...s.look, kskin: CLASSIC_SKIN })}><b>{s.name}</b><small>{lock ? `Libera no nível ${s.minLevel}` : s.desc}</small></Button>;
          })}</div></>}
          {cat === "skin" && swatches(SKIN_TONES, "skin")}
          {cat === "hair" && swatches(HAIR_COLORS, "hairColor")}
          {cat === "style" && chips(HAIR_STYLES, "hairStyle")}
          {cat === "eyes" && swatches(EYE_COLORS, "eyes")}
          {cat === "outfit" && chips(OUTFITS.map((o) => o.name), "outfit", (i) => OUTFITS[i]?.minLevel)}
          {cat === "cape" && swatches(CAPES, "cape")}
          {cat === "hat" && chips(HATS.map((h) => h.name), "hat", (i) => HATS[i]?.minLevel)}
          {cat === "mark" && chips(MARKS, "mark")}
        </div>
        <div className="look-actions">
          <Button variant="game" className="game-btn" onClick={() => set(randomLook(level))}>🎲 Aleatório</Button>
          <Button variant="game" className="game-btn" onClick={() => set({ ...DEFAULT_LOOK })}>↺ Restaurar</Button>
        </div>
        {look.outfit === 0 && <div className="modal-hint">“Armadura equipada” usa a cor da armadura que você veste.</div>}
      </div>
    </div>
  );
}
