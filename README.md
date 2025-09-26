# @spiderseek/astro-analytics

[![npm version](https://img.shields.io/npm/v/@spiderseek/astro-analytics.svg)](https://www.npmjs.com/package/@spiderseek/astro-analytics)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Spiderseek integration for Astro that allows you to track your website analytics and enhanced AI traffic analytics. Easily installs the spiderseek analytics script on all your pages with a simple import.

The script URL is hardcoded as:

```html
<script async src="https://js.spiderseek.com/spiderseek.js?id=YOUR_SITE_ID"></script>
```

---

## ✨ Features

- 🚀 **Production-only** — injects during `astro build`, never during `astro dev`.
- 🎯 **Exclude rules** — skip injection on selected routes via `exclude`.
- 🔑 **De-dupe safety** — guarantees only one `<script>` by using a unique `id`.
- 🪶 **Lightweight** — ESM-only, no Vite or runtime overhead.

---

## 📦 Installation

```bash
npm install @spiderseek/astro-analytics
```

or with pnpm:

```bash
pnpm add @spiderseek/astro-analytics
```

---

## ⚡ Usage

In your `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config'
import spiderseek from '@spiderseek/astro-analytics'

export default defineConfig({
  integrations: [
    spiderseek({
      siteId: 'XX-XXXXXX', // required
      exclude: ['/admin', /^\/preview/], // optional
      tagId: 'spiderseek-sdk' // optional (default)
    })
  ]
})
```

---

## ⚙️ Options

| Option    | Type                   | Default            | Description                                                            |
| --------- | ---------------------- | ------------------ | ---------------------------------------------------------------------- |
| `siteId`  | `string`               | — (required)       | Value used in the `?id=` query param. Example: `"26-5P1BG86"`.         |
| `exclude` | `(string \| RegExp)[]` | `[]`               | Paths to exclude from injection. Strings are treated as path prefixes. |
| `tagId`   | `string`               | `"spiderseek-sdk"` | The DOM `id` attribute used to de-dupe the tag.                        |

---

## 🖼️ Example Output

Before (default Astro build):

```html
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>My Astro Site</title>
</head>
```

After (with `@spiderseek/astro-analytics`):

```diff
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>My Astro Site</title>
+ <script id="spiderseek-sdk" async src="https://js.spiderseek.com/spiderseek.js?id=XX-XXXXXX"></script>
</head>
```

---

## ✅ Compatibility

- Works with Astro **v4** and **v5**
- Requires **Node.js 18+**
- ⚠️ This package is **ESM-only**.  
  If you’re using `astro.config.cjs`, switch to `astro.config.mjs` or use dynamic `import()`.

---

## 🛠️ Development

Clone and build locally:

```bash
git clone https://github.com/spiderseek/astro-analytics.git
cd spiderseek-astro-analytics
npm install
npm run build
```

---

## 📄 License

MIT © [Spiderseek](https://www.spiderseek.com)
