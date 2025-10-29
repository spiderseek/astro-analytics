/// <reference types="node" />
import type { AstroIntegration } from 'astro'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

type PathMatcher = string | RegExp

export interface SpiderseekOptions {
  /** The value used in the `?id=` query param. Example: "26-5P1BG86" */
  siteId: string
  /** Paths to exclude from injection (prefix strings or RegExp). */
  exclude?: PathMatcher[]
  /** Optional: override the DOM id used to de-dupe the tag. */
  tagId?: string // default: 'spiderseek-sdk'
}

/**
 * Astro integration: injects a literal external <script> only for production builds.
 * The script URL is hardcoded to https://spiderseekjs.com/spiderseek.js?id=SITE_ID
 * Operates on built HTML files in `astro:build:done`.
 */
export default function spiderseek(options: SpiderseekOptions): AstroIntegration {
  const { siteId, exclude = [], tagId = 'spiderseek-sdk' } = options
  if (!siteId) throw new Error('[spiderseek] options.siteId is required')

  const BASE_URL = 'https://spiderseekjs.com/spiderseek.js'
  const SCRIPT_HTML = `<script id="${escapeHtml(
    tagId
  )}" async src="${BASE_URL}?id=${encodeURIComponent(siteId)}"></script>`

  // Normalize matchers
  const matchers = exclude.map((m) => {
    if (typeof m === 'string') return m
    if (m instanceof RegExp) return m
    throw new Error('[spiderseek] exclude items must be string or RegExp')
  })

  const isExcluded = (urlPath: string): boolean => {
    for (const m of matchers) {
      if (typeof m === 'string') {
        const pref = m.endsWith('/') ? m : m + '/'
        if (urlPath === m || urlPath.startsWith(pref)) return true
      } else if (m.test(urlPath)) {
        return true
      }
    }
    return false
  }

  return {
    name: 'spiderseek-external-prod-only',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        try {
          // `dir` is a URL; convert to filesystem path
          const outDir = typeof dir === 'string' ? dir : fileURLToPath(dir)
          const htmlFiles = await collectHtmlFiles(outDir)

          let injectedCount = 0
          for (const file of htmlFiles) {
            const urlPath = filePathToUrl(outDir, file)
            if (isExcluded(urlPath)) continue

            let html = await fs.promises.readFile(file, 'utf8')

            // De-dupe by tag id
            if (html.includes(`id="${tagId}"`) || html.includes(`id='${tagId}'`)) continue

            const headCloseIdx = html.search(/<\/head\s*>/i)
            if (headCloseIdx !== -1) {
              html =
                html.slice(0, headCloseIdx) +
                (html[headCloseIdx - 1] === '\n' ? '' : '\n') +
                SCRIPT_HTML +
                '\n' +
                html.slice(headCloseIdx)
            } else {
              // Fallback: prepend to document
              html = SCRIPT_HTML + '\n' + html
            }

            await fs.promises.writeFile(file, html, 'utf8')
            injectedCount++
          }

          logger.info?.(
            `[spiderseek] Injected <script> into ${injectedCount} page(s).` +
              (matchers.length ? ` Excluded: ${matchers.map(String).join(', ')}` : '')
          )
        } catch (err) {
          const msg = (err as Error)?.message ?? String(err)
          logger.error?.(`[spiderseek] Failed to inject script: ${msg}`)
        }
      }
    }
  }
}

/** Recursively collect .html files */
async function collectHtmlFiles(root: string): Promise<string[]> {
  const out: string[] = []
  async function walk(dir: string) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true })
    for (const e of entries) {
      const full = path.join(dir, e.name)
      if (e.isDirectory()) await walk(full)
      else if (e.isFile() && full.endsWith('.html')) out.push(full)
    }
  }
  await walk(root)
  return out
}

/** Convert an output file path to a URL path like "/about/", "/blog/post/" or "/foo.html" */
function filePathToUrl(root: string, file: string): string {
  const rel = path.relative(root, file).split(path.sep).join('/')
  if (rel.endsWith('/index.html')) {
    const base = '/' + rel.slice(0, -'index.html'.length)
    return base === '/' ? '/' : base // ensures trailing slash
  }
  if (rel.endsWith('.html')) {
    return '/' + rel // keeps filename.html if not an index route
  }
  return '/' + rel
}

/** Minimal HTML escaper for attribute values */
function escapeHtml(s: string): string {
  return s.replace(
    /["&<>]/g,
    (ch) => ({ '"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]!)
  )
}
