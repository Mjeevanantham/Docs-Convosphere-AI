# Documentation logos

Logos are synced from **Convosphere-Marketing** (`public/logos/`) and mapped by theme for the docs app (Mintlify).

## Theme mapping

| File | Use | Theme |
|------|-----|--------|
| **light.svg** | Full logo in navbar/sidebar | **Light mode** (dark/black logo on light background) |
| **dark.svg** | Full logo in navbar/sidebar | **Dark mode** (white/light logo on dark background) |
| **icon-light.svg** | Icon-only (half logo) | Light backgrounds — e.g. favicon, inline in MDX |
| **icon-dark.svg** | Icon-only (half logo) | Dark backgrounds |

## Usage in docs

- **docs.json** `logo.light` and `logo.dark` point to `light.svg` and `dark.svg` (full logos).
- **Favicon** (`/favicon.svg`) uses the icon for the browser tab (same as `icon-light.svg`).
- In MDX, use `/logo/icon-light.svg` or `/logo/icon-dark.svg` for compact branding; use `/logo/light.svg` or `/logo/dark.svg` for the full wordmark when needed.

## Source (Marketing)

- Full: `full-dark-logo.svg` → docs **light**; `full-light-logo.svg` → docs **dark**.
- Icon: `black-clr-logo` (light) / `white-clr-logo` (dark) — SVG equivalents are `icon-light.svg` and `icon-dark.svg` here.
