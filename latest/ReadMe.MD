# module/browser - V8 module

Quickly turn a web page into a small, friendly object you can query for text, HTML, and headings without managing browser details. It is designed for workflows that want simple extraction with minimal setup.

Learn more at https://instago.ai.

## Technical reference

Exports:
- `page(url, options?)`
- `close`
- `raw`

Usage:
- `page(url, options?)` returns a page wrapper.
  - `options.refresh` (boolean): if true, snapshot the DOM immediately.
  - Methods on the wrapper:
    - `url()` -> current URL string
    - `goto(url, { refresh? })` -> same wrapper
    - `reload({ refresh? })` -> same wrapper
    - `html({ refresh? })` / `getHTML({ refresh? })` -> DOM HTML string
    - `text({ refresh? })` / `getText({ refresh? })` -> plain text string
    - `headings(levels?, { refresh? })` / `getHeaders(levels?, { refresh? })`
      - `levels` can be a number or array; defaults to h1-h6
      - returns an object like `{ h1: [...], h2: [...] }`
    - `refresh()` -> forces a new DOM snapshot and returns HTML
    - `raw()` -> underlying page object
    - If available on the underlying page object: `close()`, `click()`, `evaluate()`, `mouseMove()`, `screenshot()`
- `close` is the module-level close helper (passes through to the underlying runtime).
- `raw` exposes the module-level underlying object.

Configuration:
- No required or optional env keys.

Examples:
```js
const browser = require('browser@latest');

const page = browser.page('https://instago.ai', { refresh: true });
const titleText = page.headings(1).h1.join(' ');
const bodyText = page.text();
page.close();
```

```js
const browser = require('browser@latest');

const page = browser.page('https://example.com');
page.goto('https://instago.ai', { refresh: true });
const html = page.html();
page.close();
```
