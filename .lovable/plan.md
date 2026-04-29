

## Why the font changes didn't apply

The Tailwind utilities (`font-light`, `text-sm`, `font-normal`, `text-xs`) were added to JSX, but they're being overridden by two stronger sources:

1. **Inline `style` props** in the same JSX — e.g. `<span className="ingredient-name text-sm font-light" style={{ fontWeight: '700', fontSize: '1.1rem' }}>`. Inline styles always win against utility classes.
2. **Existing CSS class rules** in `src/styles.css` — `.ingredient-name`, `.hero-badge`, `.card-title`, `.batch-card-title` all hard-code `font-family`, `font-weight`, and `font-size`. Element-class selectors beat single utility classes by specificity, and even when specificity ties, the CSS file is loaded after Tailwind's utility layer.

So the classes were applied to the DOM, but the visual result was identical.

## Fix

Update both layers so the requested weights/sizes actually render.

**1. Strip the conflicting inline styles** in `src/components/EdeinaCalculator.tsx`:
- Hero badge — already class-only, no inline style.
- `.card-title` (Base Recipe) — class-only, no inline style.
- `.batch-card-title` (Batch Configuration) — class-only.
- `.ingredient-name` span (line 185) — remove `style={{ fontWeight: '700', fontSize: '1.1rem' }}`.
- Recipe summary ingredient name (line 246) — remove `fontWeight: '700', fontSize: '1rem'` from the inline style (keep font-family + color).

**2. Update the CSS rules** in `src/styles.css` to match the requested weights so utilities don't have to fight the cascade:
- `.hero-badge` → `font-weight: 300` (light).
- `.card-title` → `font-weight: 300` (light).
- `.batch-card-title` → `font-weight: 400` (normal).
- `.ingredient-name` → `font-weight: 300; font-size: 0.875rem` (text-sm, light).
- Action button label spans (Share/Save/Load/Print) — these get `text-xs` (0.75rem). The current `.action-btn` likely sets a larger size; add a rule so the inner `.text-xs` actually shrinks, or scope `.action-btn span:not(.material-symbols-outlined) { font-size: 0.75rem; }`.

**3. Verify dark mode overrides** in the same file aren't re-asserting weight/size — the existing dark overrides only touch `color`, so they're safe.

## Result

After this, the four target elements visually render in the lighter/smaller weights you asked for instead of looking unchanged.

