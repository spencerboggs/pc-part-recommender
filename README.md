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
```

## Website

No build step. Serve the folder over HTTP (the scripts are classic scripts, so `file://` also works for a quick check, but a server is cleaner):

```bash
npm run serve        # http://127.0.0.1:4173
# or
npx serve site
# or
python -m http.server 8000 --directory site
```

The page uses relative asset paths, so it works at a project-page URL such as `https://spencerboggs.github.io/pc-part-recommender/`.

To publish, push the repo, open **Settings → Pages**, and set the source to **GitHub Actions**. The included workflow uploads `site/` on pushes to `main`.

The header and download section point at the latest GitHub release asset:
`https://github.com/spencerboggs/pc-part-recommender/releases/latest/download/PC-Upgrade-Advisor.exe`.
Create a release and attach `release/PC-Upgrade-Advisor.exe` with that exact filename. The link updates automatically for future releases, and the binary stays out of the repository. If the repository name changes, update the two release URLs in `site/index.html`.

## Desktop app

Requirements: Node 22+, Windows 10/11.

```bash
npm install
npm start          # run unpackaged
npm run build:exe  # portable .exe in release/
```

`npm run build:exe` regenerates the icon and runs `electron-builder --win portable`. The portable executable is written to `release/`. Upload that file to the GitHub release described above.

The build is a portable executable: no installer, no admin rights. The payload is unpacked to a temp folder at launch.

## Price refresh

The checked snapshot in `site/assets/prices.js` is generated from ComponentPrices.

- Desktop: on launch, the app reads a cached snapshot from its user-data folder. It fetches a new snapshot when the cache is missing or older than 24 hours. If the fetch fails, the cached or bundled snapshot is used.
- Website: `.github/workflows/prices.yml` runs at 08:15 UTC (12:15 AM PST), regenerates the snapshot and commits it. The Pages workflow then deploys the change. No page visit is needed for the refresh.

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
   - CPUs only within the current socket (no surprise motherboard requirement)
   - GPUs, DIMM kits and drives from the currently buyable catalog
   - memory only when it adds capacity the profile can use or a meaningful speed step
3. Enumerates budget-feasible combinations, including "leave it alone" for every category.
4. Scores each combination by weighted gain plus a small budget-utilization term, and picks the best.
5. Adds a PSU only when the chosen CPU + GPU draw requires more wattage than the current unit, and picks the cheapest adequate model.
6. Returns the plan table, per-row gain, value alternatives, estimated system draw, leftover budget, notes and explicit "left as-is" reasons.

Compatibility notes cover socket ceilings, PSU assumptions, case and connector checks, and current DRAM prices.

## Data and caveats

GPU, CPU and memory prices are checked snapshots; storage and PSU prices are estimates for November 2026. Memory and NAND pricing is unusually volatile right now. Performance indices are relative estimates for comparison, not benchmark scores, and they will drift as new parts launch.

Update `site/assets/dataset.js` to add parts. Each entry needs an `id`, `model`, `price`, `perf` indices and the relevant hardware fields. Mark discontinued parts `buyable: false` so they still validate as user hardware but are never recommended as a purchase.

This is an independent tool and is not affiliated with AMD, Intel, NVIDIA or any vendor.
