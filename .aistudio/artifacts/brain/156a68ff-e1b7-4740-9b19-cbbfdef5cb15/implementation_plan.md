# Implementation Plan: Line Let's Get Rich Visual Texture Overhaul & Pacing

Transform *Block & Boulevard* into a rich, glossy mobile board game environment matching *LINE Let's Get Rich* with custom/AI-generated textures, deliberate 3–4 second AI thinking with animated dice gauge windups, full currency consistency (`Rp`), and vibrant non-procedural materials.

---

## 1. Asset & Texture Pipeline (Hybrid AI + High-Res Stylized Maps)
- **Texture Generation**:
  - Use `generate_image` to generate bespoke visual assets:
    - `board_center_monas`: Aerial vibrant cartoon illustration of Monas park with reflecting pool, tropical trees, and marble plaza for the center board courtyard.
    - `tropical_water_caustics`: Stylized vibrant turquoise ocean water texture with shimmering sun caustics for the surrounding archipelago sea.
    - `batik_gold_ornament`: Traditional Indonesian royal gold parang batik texture for tile borders, luxury frames, and card backgrounds.
    - `indonesia_city_tiles`: Stylized city district header illustrations (Medan Deli architecture, Bandung Art Deco, Surabaya Heroes Monument, Makassar Phinisi, Bali Kuta Beach, Jakarta SCBD skyline).
- **Three.js Material Upgrades (`CityTabletop3D.tsx`)**:
  - Apply diffuse, roughness, and bump/normal maps to all board surfaces (marble tiles, wood trim, water plane, Joglo roof shingles, Monas obelisk).
  - Add glossy specular reflections (`roughness: 0.2`, `metalness: 0.15`) to give tiles the signature glossy collectible board game look of *Let's Get Rich*.
  - Render high-resolution tile face textures combining city artwork, district colors, and golden deed seals.

---

## 2. Relaxed Pacing & 3–4s AI Deliberation
- **AI Thinking State & Gauge Windup**:
  - When an AI player's turn begins:
    1. Enter a visible **AI Deliberation Phase** (3 to 4 seconds).
    2. Display a tactical thinking speech bubble above the 3D board (e.g. *"Gatotkaca sedang membidik target petak 8..."* / *"Dewi Sri menghitung peluang sewa..."*).
    3. Simulate visible dice gauge charging on the HUD so the player sees the AI's power bar filling up to its target range before releasing!
    4. Play procedural gauge audio during AI charge and release.
- **Paced Hop-by-Hop Animations**:
  - Keep avatar hops at ~280ms with clear bouncy sound feedback and camera damping.

---

## 3. Currency Consistency Audit
- **Full Rupiah Localization**:
  - Purge all remaining `"c"`, `"credits"`, and `toLocaleString()` raw values across:
    - `src/components/BoardGrid2D.tsx` (all tooltips, quick build pills, holding bail buttons)
    - `src/components/PropertyInspectorPanel.tsx` (rent schedules, upgrade costs, liquidation refunds)
    - `src/components/Modals.tsx` (setup starting capital, standings net worth, bankruptcy debt)
    - `src/game/engine.ts` (all activity logs, event card payouts, pass bonuses)
  - Ensure every monetary amount displays as `Rp X.XXX.XXX` via `formatRupiah()`.

---

## 4. Verification & Testing
- Unit tests (`npx --yes tsx --test src/game/engine.test.ts`): Verify currency, monopoly triggers, and gauge mechanics.
- Type check & build (`npm run lint`, `compile_applet`).
- Browser verification on desktop and mobile viewports verifying textured board rendering, AI thinking bubble, and dice gauge windup.
