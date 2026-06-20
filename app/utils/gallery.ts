// Public gallery — community-submitted design templates. A submission is a
// *sanitized* slice of a project: the look (colours, copy, layout, font) with
// the contributor's own screenshots, icon, custom font, and AI credentials
// stripped out. Templates ship as JSON files under app/gallery/<slug>/ and are
// added by pull request — there is no backend.

import type { UserConfig } from './types'
import { BUILTIN_FONTS, DEFAULT_FONT_FAMILY } from './fonts'

// The design-only slice of UserConfig that travels in a gallery submission.
// `images` is kept but reduced to hosted (http/https) URLs — base64 uploads are
// dropped so the repo never carries binary screenshots.
export type GalleryConfig = Pick<
  UserConfig,
  | 'appName'
  | 'appDescription'
  | 'aiBrief'
  | 'features'
  | 'colors'
  | 'fontFamily'
  | 'fgElements'
  | 'copy'
  | 'copyByLocale'
  | 'locale'
  | 'selectedLocales'
  | 'images'
>

export type GalleryTemplate = {
  schema: 1
  slug: string
  title: string
  author: string
  authorUrl?: string
  tags: string[]
  // Hosted URL of the main preview image shown on the gallery card. Optional —
  // cards fall back to a palette + headline preview when absent.
  previewImage?: string
  config: GalleryConfig
}

export const isHttpUrl = (s: unknown): s is string =>
  typeof s === 'string' && /^https?:\/\//i.test(s)

// Reduce every device's screenshot list to hosted URLs; drop base64/blob.
function urlOnlyImages(images: UserConfig['images']): UserConfig['images'] {
  const out = {} as UserConfig['images']
  for (const k of Object.keys(images) as (keyof UserConfig['images'])[]) {
    out[k] = images[k].map(v => (isHttpUrl(v) ? v : null))
  }
  return out
}

const isBuiltinFont = (f: string) => BUILTIN_FONTS.some(b => b.family === f)

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'template'
}

// Keep only the design fields; drop screenshots, icon, custom font blob, and
// credentials. Anything absent falls back to DEFAULT_CONFIG on import.
export function sanitizeForGallery(c: UserConfig): GalleryConfig {
  return {
    appName: c.appName,
    appDescription: c.appDescription,
    aiBrief: c.aiBrief,
    features: c.features,
    colors: c.colors,
    // Uploaded custom fonts can't travel (licensing + a ~2MB blob) — keep only
    // builtin font tokens, otherwise fall back to the default typeface.
    fontFamily: isBuiltinFont(c.fontFamily) ? c.fontFamily : DEFAULT_FONT_FAMILY,
    fgElements: c.fgElements,
    copy: c.copy,
    copyByLocale: c.copyByLocale,
    locale: c.locale,
    selectedLocales: c.selectedLocales,
    images: urlOnlyImages(c.images),
  }
}
