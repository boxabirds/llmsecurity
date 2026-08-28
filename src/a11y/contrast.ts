/**
 * WCAG contrast maths, used to hold the design tokens to AA in a test rather
 * than trusting that the palette "looks fine".
 */

export const AA_TEXT_RATIO = 4.5
export const AA_UI_RATIO = 3

export function parseHex(hex: string): [number, number, number] {
  const clean = hex.trim().replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`Not a hex colour: ${hex}`)
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ]
}

function channel(value: number): number {
  const s = value / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Extracts `--name: #hex;` declarations from a CSS block. */
export function extractHexTokens(css: string): Record<string, string> {
  const out: Record<string, string> = {}
  const re = /--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\s*;/g
  let match: RegExpExecArray | null
  while ((match = re.exec(css)) !== null) {
    out[match[1]] = match[2]
  }
  return out
}
