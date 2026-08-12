// Approximate visual preview for the VITA 3D-Master shade guide.
// Colors are a schematic approximation (not calibrated/clinical) meant only to give
// a quick visual reference while picking a shade — group 1 (lightest) to 5 (darkest),
// letter L/M/R standing for the Lightness/Medium/Reddish chroma sub-groups.

const GROUP_LIGHTNESS: Record<number, number> = { 1: 91, 2: 84, 3: 77, 4: 70, 5: 63 };
const LETTER_STYLE: Record<'L' | 'M' | 'R', { hue: number; sat: number }> = {
  L: { hue: 45, sat: 16 },
  M: { hue: 40, sat: 30 },
  R: { hue: 32, sat: 42 },
};

const hslToHex = (hue: number, saturationPct: number, lightnessPct: number) => {
  const s = saturationPct / 100;
  const l = lightnessPct / 100;
  const k = (n: number) => (n + hue / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (value: number) => Math.round(255 * value).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
};

const shadeToHex = (code: string): string => {
  const match = code.match(/^(\d)([LMR])([\d.]+)$/);
  if (!match) return '#e5d9c3';
  const group = Number(match[1]);
  const letter = match[2] as 'L' | 'M' | 'R';
  const value = Number(match[3]);
  const { hue, sat } = LETTER_STYLE[letter];
  const lightness = GROUP_LIGHTNESS[group] - (value - 1) * 3;
  return hslToHex(hue, sat, lightness);
};

const SHADE_CODES = [
  '1M1', '1M2',
  '2L1.5', '2L2.5', '2M1', '2M2', '2M3', '2R1.5', '2R2.5',
  '3L1.5', '3L2.5', '3M1', '3M2', '3M3', '3R1.5', '3R2.5',
  '4L1.5', '4L2.5', '4M1', '4M2', '4M3', '4R1.5', '4R2.5',
  '5M1', '5M2', '5M3',
];

export interface VitaShade {
  code: string;
  hex: string;
}

export const VITA_3D_MASTER_SHADES: VitaShade[] = SHADE_CODES.map((code) => ({ code, hex: shadeToHex(code) }));

export const getVitaShadeHex = (code?: string) => VITA_3D_MASTER_SHADES.find((shade) => shade.code === code)?.hex;
