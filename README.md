# PC Upgrade Advisor

A hardware-aware upgrade planner. Enter (or auto-detect) a PC's CPU, GPU, memory, storage and power supply, choose a budget and a priority, and get a ranked plan with current → recommended parts, expected gain, price and compatibility notes.

Two surfaces, one codebase:

- **Website** (`site/`): static GitHub Pages page. Parts are typed in manually, with catalog-backed autocomplete and live validation.
- **Windows app** (`desktop/`): single portable `.exe`. Reads the machine's hardware over WMI/CIM, fills the form, and keeps every field editable.

## Layout

```
site/                  Static site (publishable as-is)
  index.html
  assets/
    dataset.js         Curated CPU / GPU / RAM / storage / PSU catalog
    engine.js          Matching, scoring and the budget planner
    app.js             Form, autocomplete, validation, results table
    styles.css         Portfolio theme (azure dark / atelier light)
    theme.js           Theme persistence + toggle
desktop/
  main.js              Electron shell
  preload.js           contextBridge bridge
  hardware.js          PowerShell/WMI hardware detection
  prices.js            Component price fetch and catalog mapping
  icon.ico             App icon
scripts/
  make-icon.js
  serve.js
.github/workflows/
  pages.yml            Deploys `site/` to GitHub Pages
  prices.yml           Daily price snapshot refresh + Pages redeploy
```

## Website

You can use the online version: `https://spencerboggs.github.io/pc-part-recommender/`.

Or you can host the site yourself:

```bash
npm run serve        # http://127.0.0.1:4173
# or
npx serve site
# or
python -m http.server 8000 --directory site
```

## Desktop app

Requirements: Node 22+, Windows 10/11.

```bash
npm install
npm start          # run unpackaged
npm run build:exe  # portable .exe in release/
```

`npm run build:exe` regenerates the icon and runs `electron-builder --win portable`. The portable executable is written to `release/` as `pc-upgrade-advisor-v<version>-windows-x64.exe`. Upload that file to the GitHub release described above.

The build is a portable executable: no installer, no admin rights. The payload is unpacked to a temp folder at launch.

## Price refresh

The checked snapshot in `site/assets/prices.js` is generated from ComponentPrices.

- Desktop: on launch, the app reads a per-user cache from its user-data folder. It fetches a fresh snapshot only when that cache is missing or its `checked` date is not today's Pacific calendar day. The date shown in results updates for that instance. If the fetch fails, the cached or bundled snapshot is used.
- Website: ComponentPrices does not allow browser CORS, so the site cannot refresh live in-page. `.github/workflows/prices.yml` runs at 08:15 UTC (12:15 AM PST), regenerates the snapshot, commits it, and redeploys Pages.

Run `npm run prices` to update the snapshot manually.

## How detection works

`desktop/hardware.js` runs one encoded PowerShell query and maps the result:

| Field | Source |
| --- | --- |
| CPU model, cores, threads, socket | `Win32_Processor` |
| GPU model, vendor | `Win32_VideoController` |
| RAM total, speed, generation, slots | `Win32_PhysicalMemory`, `Win32_PhysicalMemoryArray` |
| Storage models, capacity, bus type | `Get-PhysicalDisk`, `Win32_DiskDrive` |

**Power supplies are not auto-detected.** Desktop PSUs do not expose model or wattage through a generic Windows interface. The app says so in the field and asks for the label value; it still uses the wattage for headroom checks once entered.

The scanner picks the highest-ranked discrete GPU (NVIDIA/AMD discrete over integrated) when a machine reports more than one display adapter. Drives are sorted by capacity, capped at four entries, and USB devices are excluded.

If a detected model is not in the catalog, the field turns amber with "Detected · not in catalog" instead of pretending it recognized it. Picking the closest suggestion enables planning.

## How the planner works

The catalog stores a normalized 0-100 performance index per part (`perf.gaming` / `perf.mt` for CPUs, `perf.raster` / `perf.rt` for GPUs) plus TDP, socket, VRAM, capacity, read speed and street price.

Each priority profile supplies category weights, a memory-capacity target and a ray-tracing / multi-thread mix:

- Balanced
- Visual fidelity
- Competitive gaming
- Content creation
- 3D & rendering
- AI & ML
- Everyday use

The planner:

1. Scores the current build for the selected profile.
2. Builds upgrade candidates per category:
   - Same-socket CPUs as drop-in upgrades
   - Cross-socket / AMD↔Intel CPUs as platform bundles that also include a motherboard and, when memory generation changes, a matching RAM kit
   - GPUs from the currently buyable catalog
   - Memory kits matched to the effective platform DDR after any CPU choice
   - Storage only when the user described a current drive
3. Enumerates budget-feasible combinations, including "leave it alone" for every category. Companion part prices count against the budget.
4. Scores each combination by weighted gain, a small budget-utilization term, a CPU/GPU balance penalty, and a preference for drop-in CPUs when gains are similar.
5. Adds a PSU only when the chosen CPU + GPU draw requires more wattage than the current unit, preferring ATX 3.1 units for higher-TDP GPUs.
6. Returns the plan table, per-row gain, required companion rows, value alternatives, estimated system draw, leftover budget, notes and explicit "left as-is" reasons.

Compatibility notes cover platform switches, cooler/case checks, PSU assumptions, and current DRAM prices.

## Data and caveats

GPU, CPU and memory prices are checked snapshots; storage and PSU prices are estimates for November 2026. Memory and NAND pricing is unusually volatile right now. Performance indices are relative estimates for comparison, not benchmark scores, and they will drift as new parts launch.

Update `site/assets/dataset.js` to add parts. Each entry needs an `id`, `model`, `price`, `perf` indices and the relevant hardware fields. Mark discontinued parts `buyable: false` so they still validate as user hardware but are never recommended as a purchase.

This is an independent tool and is not affiliated with AMD, Intel, NVIDIA or any vendor.
