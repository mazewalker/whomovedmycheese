# Who Moved My Cheese?

A browser maze game inspired by the "Who Moved My Cheese?" parable, styled after a Commodore 64. Navigate a shifting maze, grab cheese before it relocates, dodge enemy mice, chain combos, and unlock achievements — solo or local 2-player.

No build step, no dependencies, no framework — just static HTML/CSS/JS served directly by a browser.

## Running it

```bash
./serve.sh          # picks the first free port starting at 8080
./serve.sh 8090      # or force a specific port
```

Then open the printed URL (or forward the port through VSCode's **Ports** tab if running inside Remote-SSH/Codespaces/a devcontainer). Any static file server works too — `python3 -m http.server` is just what `serve.sh` uses.

## Controls

| Input | Action |
|---|---|
| Arrow Keys / WASD | Move (Player 1 uses Arrow Keys, Player 2 uses WASD in 2-player mode) |
| Space | Pause |
| Touch D-pad / swipe | Move (single-player only, shown automatically on touch devices) |
| Gamepad / USB joystick | D-pad or stick to move, Start button to pause/resume — see below |

### Gamepad support

Plug in up to two controllers before or during play — gamepad 1 controls Player 1, gamepad 2 controls Player 2 in 2-player mode. A "Controller Connected" toast confirms detection. Because many simple/older USB joysticks (e.g. Competition Pro–style controllers) don't register with the browser's "standard" gamepad mapping, detection checks the standard D-pad buttons, a low-index button fallback, and every axis pair, rather than assuming one fixed layout.

If a controller isn't responding, open the browser console — a live diagnostic log (`[gamepad N] "<id>" pressed buttons: [...] axes: [...]`) prints whenever any button or axis is active, which helps pinpoint the exact mapping.

## Characters

| Character | Ability |
|---|---|
| 🐭 Sniff | Cheese-move warning appears earlier |
| 🐹 Scurry | Moves at double speed |
| 🐀 Hem | +1 extra life |
| 🦉 Haw | Sees a line to the cheese on the minimap |

## Gameplay

- **Maze**: regenerated each level via recursive backtracking, then "braided" to add loops so there's rarely just one path.
- **Cheese**: regular, double (2x), and (from level 3+) rare golden cheese; it periodically relocates with a warning beforehand.
- **Combo scoring**: chaining cheese pickups within 8 seconds scales the score bonus, up to +100%.
- **Enemies**: wanderer (roams randomly), thief (chases and steals score, then flees), guardian (patrols near the cheese) — composition scales with difficulty and level.
- **Power-ups**: 🛡️ shield (blocks one hit) and 🍎 apple (restores a life, or +15s if already at full lives).
- **Lives**: enemy contact costs a life and knocks you back to your spawn corner; reaching 0 ends the game.
- **Achievements**: 7 milestones tracked across sessions via `localStorage`.
- **Sound**: procedural Web Audio effects (no audio files) plus optional text-to-speech narration of the maze quotes via the Web Speech API — each quote is read aloud at most once per session.

## Files

| File | Purpose |
|---|---|
| `index.html` | Screens/modals markup |
| `styles.css` | C64-inspired styling (16-color palette, blocky UI, CRT scanline overlay) |
| `game.js` | Game state, maze generation, enemies, scoring, rendering, input (keyboard/touch/gamepad) |
| `sound.js` | `SoundEngine` — procedural SFX + speech synthesis, independent of `game.js` |
| `serve.sh` | Local static file server |

## Persistence

Leaderboards, achievements, and the mute preference are stored in `localStorage` (`cheese_leaderboard_*`, `cheese_achievements`, `cheese_achievements_chars_played`, `cheese_sound_muted`) — no backend.
