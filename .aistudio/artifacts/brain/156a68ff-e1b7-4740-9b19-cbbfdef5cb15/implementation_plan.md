# Implementation Plan: Line Let's Get Rich Visual Texture Overhaul & Pacing (Completed)

Transform *Block & Boulevard* into a rich, glossy mobile board game environment matching *LINE Let's Get Rich* with custom/AI-generated textures, deliberate 3–4 second AI thinking with animated dice gauge windups, full currency consistency (`Rp`), and vibrant non-procedural materials.

---

## 1. Asset & Texture Pipeline (Hybrid AI + High-Res Stylized Maps) [COMPLETED]
- **Texture Generation & Material Upgrades**:
  - Generated and bundled rich image assets:
    - `/src/assets/images/board_monas_plaza_1793623599271.jpg` (Vibrant top-down cartoon Monas plaza & reflecting pool).
    - `/src/assets/images/tropical_sea_caustics_1793623629015.jpg` (Sun caustics over turquoise archipelago water).
    - `/src/assets/images/batik_gold_pattern_1793623649494.jpg` (Indonesian royal gold leaf parang batik board trim).
    - `/src/assets/images/marble_game_tiles_1793623669283.jpg` (Glossy polished ivory marble game tiles with gold filigree).
  - Integrated `loadGameTexture` and `createTileDecalTexture` in `CityTabletop3D.tsx`:
    - Central plaza with Monas park aerial illustration.
    - Animated caustics offset on tropical ocean base (`seaTexture.offset.x` & `y` per frame).
    - Gold batik table rim and marble base for all 32 tiles.
    - Added crisp top decal plates for each tile with district color banner, city name, and Indonesian Rupiah price.

---

## 2. Relaxed Pacing & 3–4s AI Deliberation [COMPLETED]
- **AI Thinking State & Gauge Windup**:
  - Implemented `planAIRollDeliberation` in `src/game/ai.ts`:
    - Evaluates 4 dice power zones (Zone 1: 2-4, Zone 2: 5-7, Zone 3: 8-9, Zone 4: 10-12) to target unowned cities, complete districts, or avoid high-rent landmarks.
    - Formulates authentic tactical thoughts (e.g. *"Gatotkaca membidik Bandung (Zona 3) untuk memperluas monopoli!"*).
  - Implemented 3.4s deliberation sequence in `src/App.tsx`:
    - Phase 1 (0–1200ms): Pondering board state & displaying tactical speech bubble.
    - Phase 2 (1200–2600ms): Power gauge charging with rising pitch synthesizer audio (`soundFX.startGaugeCharge()`) and animated multi-zone bar.
    - Phase 3 (2600–3000ms): Power release chime (`soundFX.playGaugeRelease(plan.isDiceControl)`).
    - Phase 4 (3000–3400ms): Dice roll animation (`soundFX.playDiceRoll()`) and engine state resolution.
  - Added 1.8s delay for AI property purchase decisions (`BUY_OR_PASS`) with Indonesian investment thoughts.
  - Rendered Let's Get Rich character avatar cards, Class S+/S badges, speech bubbles, and animated multi-zone power gauges in `BoardGrid2D.tsx`.

---

## 3. Currency Consistency Audit [COMPLETED]
- **Full Rupiah Localization**:
  - Purged all remaining `"c"`, `"credits"`, and raw numeric formats across:
    - `src/components/BoardGrid2D.tsx` (tile prices, fees, accessibility aria-labels, BuyOrPassCard, debt resolution, development buttons).
    - `src/game/engine.ts` (all event card logs, municipal payouts, fee payments, holding bails, and final victory net worth).
    - `src/components/PropertyInspectorPanel.tsx` (current rent, upgrade costs, liquidation refunds).
    - `src/components/PlayerRosterPanel.tsx` (player cash, net worth).
    - `src/components/Modals.tsx` (character card decks, starting capital, instant monopoly rewards).
  - Every monetary display consistently formatted as `Rp X.XXX.XXX` via `formatRupiah()`.

---

## 4. Verification & Testing [COMPLETED]
- Unit tests (`npx --yes tsx --test src/game/engine.test.ts`): All 13/13 tests pass.
- Type check & build (`npm run lint`, `compile_applet`): 0 errors, build succeeds cleanly.
- Dev server verified via HTTP 200 OK on port 3000.
