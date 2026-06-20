// Validate community gallery submissions. Run in CI on PRs that touch
// app/gallery/**. Fails (exit 1) on a malformed or unsanitized template so a
// broken entry can't reach main. Usage: node scripts/validate-gallery.mjs
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(process.cwd(), 'app', 'gallery')
// Project-only fields that must never appear in a sanitized template — their
// presence means someone pasted a full project export (icon, custom font blob,
// or AI credentials). `images` is allowed but URL-only (checked below).
const FORBIDDEN = ['appIcon', 'customFont', 'ai']
const isHttpUrl = s => typeof s === 'string' && /^https?:\/\//i.test(s)
const errors = []
const slugs = new Set()

if (!existsSync(ROOT)) {
  console.log('No app/gallery directory — nothing to validate.')
  process.exit(0)
}

for (const dir of readdirSync(ROOT, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue
  const file = join(ROOT, dir.name, 'template.json')
  const at = `app/gallery/${dir.name}/template.json`
  if (!existsSync(file)) { errors.push(`${dir.name}: missing template.json`); continue }

  let t
  try { t = JSON.parse(readFileSync(file, 'utf8')) }
  catch (e) { errors.push(`${at}: invalid JSON — ${e.message}`); continue }

  if (t.schema !== 1) errors.push(`${at}: schema must be 1`)
  if (typeof t.slug !== 'string' || !t.slug) errors.push(`${at}: slug required`)
  else {
    if (t.slug !== dir.name) errors.push(`${at}: slug "${t.slug}" must match folder "${dir.name}"`)
    if (!/^[a-z0-9-]+$/.test(t.slug)) errors.push(`${at}: slug must be kebab-case [a-z0-9-]`)
    if (slugs.has(t.slug)) errors.push(`${at}: duplicate slug "${t.slug}"`)
    slugs.add(t.slug)
  }
  if (typeof t.title !== 'string' || !t.title) errors.push(`${at}: title required`)
  if (typeof t.author !== 'string' || !t.author) errors.push(`${at}: author required (set yours before submitting)`)
  if (!Array.isArray(t.tags)) errors.push(`${at}: tags must be an array`)
  if ('previewImage' in t && !isHttpUrl(t.previewImage)) errors.push(`${at}: previewImage must be an http(s) URL`)
  if ('authorUrl' in t && !isHttpUrl(t.authorUrl)) errors.push(`${at}: authorUrl must be an http(s) URL`)

  const c = t.config
  if (!c || typeof c !== 'object') { errors.push(`${at}: config required`); continue }
  for (const k of FORBIDDEN) {
    if (k in c) errors.push(`${at}: config.${k} is not allowed — submit a sanitized template, not a full project`)
  }
  if (!c.colors || !c.colors.bgFrom || !c.colors.bgTo || !c.colors.textLight) {
    errors.push(`${at}: config.colors must include bgFrom, bgTo, textLight`)
  }
  if (!Array.isArray(c.copy) || !c.copy.length) errors.push(`${at}: config.copy must be a non-empty array`)

  // images is optional; when present, every entry must be a hosted URL or null.
  if (c.images && typeof c.images === 'object') {
    for (const [dev, arr] of Object.entries(c.images)) {
      if (!Array.isArray(arr)) { errors.push(`${at}: config.images.${dev} must be an array`); continue }
      for (const v of arr) {
        if (v !== null && !isHttpUrl(v)) errors.push(`${at}: config.images.${dev} must hold http(s) URLs or null`)
      }
    }
  }

  if (readFileSync(file, 'utf8').includes('data:')) {
    errors.push(`${at}: contains a data: URL — uploaded screenshots/icons/fonts must be stripped`)
  }
}

if (errors.length) {
  console.error(`Gallery validation failed (${errors.length}):`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log(`Gallery OK — ${slugs.size} template(s) valid.`)
