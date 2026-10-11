// Reads the billing page theme variables so the scene matches the HUD.

export interface SceneTheme {
  bg: string; accent: string; accent2: string; gold: string; text: string; border: string;
}

export const THEME_FALLBACK: SceneTheme = {
  bg: '#010101',
  accent: '#d9a83e',
  accent2: '#d96b55',
  gold: '#e8bd58',
  text: '#fff8e8',
  border: 'rgba(255, 215, 122, 0.3)',
};

const VARS: Record<keyof SceneTheme, string> = {
  bg: '--bg', accent: '--accent', accent2: '--accent-2', gold: '--gold', text: '--text', border: '--border',
};

/** Resolve CSS vars from `el` (default: documentElement); missing values use fallbacks. */
export function readTheme(el?: Element): SceneTheme {
  const target = el ?? (typeof document !== 'undefined' ? document.documentElement : undefined);
  if (!target || typeof getComputedStyle !== 'function') return { ...THEME_FALLBACK };
  const css = getComputedStyle(target);
  const out = { ...THEME_FALLBACK };
  for (const key of Object.keys(VARS) as (keyof SceneTheme)[]) {
    const v = css.getPropertyValue(VARS[key]).trim();
    if (v) out[key] = v;
  }
  return out;
}
