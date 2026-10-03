# /brag plan — Expense Tracker

## Rubric
- **What is it:** An Android expense tracker (Expo / React Native) built so logging a purchase takes seconds, which syncs every entry into your own Google Sheet.
- **Who for / what it does:** People who want to track daily spending (AED by default) without accounts or a finance app owning their data.
- **What sets it apart:** No sign-in. It works offline first and syncs to a Google Sheet *you* own through a tiny Apps Script. The sheet is the source of truth.
- **Most impressive claim:** Open → amount → category → save, all in seconds (the design objective in plan.md).
- **Visual hook:** A stopwatch running while the real Add flow plays on the phone.
- **Real UI shown:** Floating tab bar + button, the "Add Income / Add Expense" menu, the Add Expense screen, the category picker sheet, the "Expense Saved" confirmation, the dashboard (balance, KPIs, category cards), the sync cloud icon, and the Transactions tab in the sheet.
- **Tone:** `default`: punchy, clean, sky-blue brand.
- **Share caption:** see share-copy.txt.

## Identity
Colors from `src/lib/theme.ts`: sky #5BB8F5, skyLight #9DD6FB, skyDeep #3A9BEA, skyTint #EAF5FE, bg #F4F8FC, text #0F172A, muted #6B7A90, expense #EF5A78, income #2B7DE9. Font: Inter 400–800 (`@expo-google-fonts/inter`). Icons: Ionicons glyph font from `@expo/vector-icons`. Logo: `assets/splash-icon.png`.

## Angle
"Spent money? Log it in seconds." We prove it with a stopwatch while the real flow plays, then reveal the twist: the entry lands in your own Google Sheet.

## Storyboard (1920×1080, 30fps, 21.0s). Music: happy-beats vol-10 (110 BPM), cuts on beats.
| # | Time | Scene | On screen | SFX |
|---|---|---|---|---|
| 1 | 0.00–2.46 | Hook | Sky gradient. "Spent money?" then "Log it in seconds." | soft impact on line 2 |
| 2 | 2.46–9.29 | The flow | Phone (right) runs the real flow: tap + → Add Expense → type 42.50 → Category sheet → Food → SAVE EXPENSE → "Expense Saved". Left: a stopwatch counts and freezes when it saves. Caption "Open → amount → category → save." | taps, key clicks, success bell |
| 3 | 9.29–14.20 | Sync | Phone (left) returns to the dashboard; the cloud icon spins, then turns to done. Right: Transactions sheet; the new row slides in and highlights. "Lands in your own Google Sheet." / "No sign-in. Works offline, syncs when you're back." | whoosh-ish slide, soft drop |
| 4 | 14.20–18.01 | Insight | Phone (right) scrolls the dashboard; category bars grow. Left: "See where every dirham goes." | light ticks |
| 5 | 18.01–21.00 | Outro | Sky gradient, wallet logo, "Expense Tracker", "Personal Finance", "Your money. Your sheet." | bell on logo, music fades out |

Sample amounts in the UI are illustrative (product in use), not claims.
