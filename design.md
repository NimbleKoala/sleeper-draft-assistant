# Design — Sleeper Draft Assistant

A locked design system for the Sleeper Fantasy Football Draft Assistant.

## Genre
modern-minimal (utilitarian, high-density live draft operations)

## Macrostructure
Workbench (High-density split layout: Left primary data grid / player value engine, Right live draft board & roster tracker)

## Theme & Palette Tokens
- `--color-paper`:      #080c15 (deep carbon canvas)
- `--color-paper-2`:    #0f172a (solid surface panel)
- `--color-paper-3`:    #182338 (interactive card hover surface)
- `--color-ink`:        #f8fafc (primary white text)
- `--color-ink-2`:      #94a3b8 (secondary slate text)
- `--color-ink-3`:      #64748b (muted caption text)
- `--color-rule`:       rgba(255, 255, 255, 0.08) (hairline border)
- `--color-rule-focus`: rgba(59, 130, 246, 0.4) (active / focused border)
- `--color-accent`:     #3b82f6 (cobalt anchor accent)
- `--color-focus`:      #60a5fa (focus ring outline)

### Positional Tokens
- QB:  `--pos-qb-bg`: rgba(16, 185, 129, 0.12), `--pos-qb-text`: #34d399, `--pos-qb-border`: rgba(16, 185, 129, 0.3)
- RB:  `--pos-rb-bg`: rgba(59, 130, 246, 0.12), `--pos-rb-text`: #60a5fa, `--pos-rb-border`: rgba(59, 130, 246, 0.3)
- WR:  `--pos-wr-bg`: rgba(244, 114, 182, 0.12), `--pos-wr-text`: #f472b6, `--pos-wr-border`: rgba(244, 114, 182, 0.3)
- TE:  `--pos-te-bg`: rgba(245, 158, 11, 0.12), `--pos-te-text`: #fbbf24, `--pos-te-border`: rgba(245, 158, 11, 0.3)
- K:   `--pos-k-bg`:  rgba(168, 85, 247, 0.12), `--pos-k-text`:  #c084fc, `--pos-k-border`:  rgba(168, 85, 247, 0.3)
- DEF: `--pos-def-bg`: rgba(6, 182, 212, 0.12), `--pos-def-text`: #22d3ee, `--pos-def-border`: rgba(6, 182, 212, 0.3)

## Typography
- Display / Headings: `Plus Jakarta Sans`, font-weight 700/800, tracking -0.025em, roman (normal)
- Body: `Inter`, font-weight 400/500/600
- Mono / Tabular Numbers: `JetBrains Mono`, font-weight 600/700, `font-variant-numeric: tabular-nums`

## Motion & Microinteractions
- Easings: `cubic-bezier(0.16, 1, 0.3, 1)` (exponential ease-out)
- Duration: 150ms - 200ms
- No bouncy / wobbly keyframes
- No gradient text clipping or aurora background blobs
- Crisp surface elevation via lightness and borders rather than diffuse neon glow
