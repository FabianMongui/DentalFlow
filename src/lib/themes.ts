import type { ThemeId } from '../types';

export interface ThemePreset {
  id: ThemeId;
  label: string;
  description: string;
  /** Tono OKLCH de la marca (0-360). */
  brandH: number;
  /** Croma OKLCH de la marca. */
  brandC: number;
  /** Tono OKLCH del acento. */
  accentH: number;
  /** Croma OKLCH del acento. */
  accentC: number;
}

export const DEFAULT_THEME_ID: ThemeId = 'indigo';

/**
 * La luminosidad no es configurable: se fija en index.css. Cada preset solo
 * mueve tono y croma, así el contraste de textos sobre la marca se mantiene
 * igual en todos los temas.
 */
export const THEME_PRESETS: ThemePreset[] = [
  { id: 'indigo', label: 'Índigo', description: 'Tema por defecto', brandH: 277, brandC: 0.215, accentH: 185, accentC: 0.104 },
  { id: 'azul-clinico', label: 'Azul clínico', description: 'Sobrio y sanitario', brandH: 255, brandC: 0.19, accentH: 205, accentC: 0.1 },
  { id: 'turquesa', label: 'Turquesa', description: 'Fresco y limpio', brandH: 195, brandC: 0.12, accentH: 150, accentC: 0.11 },
  { id: 'verde-bosque', label: 'Verde bosque', description: 'Natural y calmado', brandH: 155, brandC: 0.13, accentH: 250, accentC: 0.12 },
  { id: 'violeta', label: 'Violeta', description: 'Moderno y cálido', brandH: 305, brandC: 0.19, accentH: 190, accentC: 0.1 },
  { id: 'rosa', label: 'Rosa', description: 'Cercano y amable', brandH: 10, brandC: 0.18, accentH: 200, accentC: 0.1 },
  { id: 'terracota', label: 'Terracota', description: 'Cálido y terroso', brandH: 50, brandC: 0.14, accentH: 175, accentC: 0.1 },
  { id: 'grafito', label: 'Grafito', description: 'Neutro, sin color de marca', brandH: 265, brandC: 0.03, accentH: 200, accentC: 0.09 },
];

const PRESETS_BY_ID = new Map(THEME_PRESETS.map((preset) => [preset.id, preset]));

export const getThemePreset = (id?: string): ThemePreset => (
  PRESETS_BY_ID.get(id as ThemeId) ?? PRESETS_BY_ID.get(DEFAULT_THEME_ID)!
);

export const isThemeId = (value?: string): value is ThemeId => PRESETS_BY_ID.has(value as ThemeId);

/**
 * Variables que definen un tema. Se aplican en <html> para el tema activo o en
 * cualquier contenedor para previsualizar un tema sin cambiar el global.
 */
export const themeVariables = (preset: ThemePreset): Record<string, string> => ({
  '--brand-h': String(preset.brandH),
  '--brand-c': String(preset.brandC),
  '--accent-h': String(preset.accentH),
  '--accent-c': String(preset.accentC),
});

/** Color de marca resuelto, para muestras de color fuera del árbol tematizado. */
export const themeSwatch = (preset: ThemePreset) => ({
  primary: `oklch(0.457 ${preset.brandC} ${preset.brandH})`,
  primaryContainer: `oklch(0.585 ${preset.brandC * 0.95} ${preset.brandH})`,
  accent: `oklch(0.6 ${preset.accentC} ${preset.accentH})`,
});
