/* PC Upgrade Advisor matching and recommendation engine. */
window.PCEngine = (function () {
  const D = window.PCData;

  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const round = (n, step) => Math.round(n / step) * step;

  function norm(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\b(nvidia|geforce|amd|radeon|intel|core|processor|cpu|gpu|graphics|series|edition|desktop|tm|r)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function loose(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function compact(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function seriesKey(item, kind) {
    if (kind === 'cpu') return item.socket + ':' + item.id;
    return item.id;
  }

  function aliasesFor(item, kind) {
    if (item.__aliases) return item.__aliases;
    const list = new Set();
    const base = item.model;
    const add = (v) => {
      const n = norm(v);
      if (n) list.add(n);
      const raw = loose(v);
      if (raw && raw !== n) list.add(raw);
    };
    add(base);
    add(base.replace(/\b(AMD|Intel|NVIDIA|GeForce|Radeon|Core|Processor|Graphics)\b/g, ' '));
    add(base.replace(/\b(16GB|12GB|8GB|6GB|4GB|10GB)\b/gi, ' '));
    add(base.replace(/\b(RTX|RX|GTX|Arc)\b/gi, ' '));
    if (item.alias) item.alias.forEach(add);
    if (kind === 'cpu') {
      const m = base.match(/([A-Za-z]*)(\d{3,5}[A-Za-z]{0,3})/);
      if (m) add(m[2]);
    }
    if (kind === 'gpu') {
      const m = base.match(/(RTX|RX|GTX|Arc)\s*([A-Z0-9 ]+)/i);
      if (m) add(m[2]);
    }
    item.__aliases = Array.from(list);
    return item.__aliases;
  }

  function scoreAlias(alias, query) {
    if (!alias || !query) return 0;
    if (alias === query) return 100;
    const aliasCompact = compact(alias);
    const queryCompact = compact(query);
    if (aliasCompact === queryCompact) return 99;
    if (queryCompact.length >= 2 && aliasCompact.startsWith(queryCompact)) {
      return 93 - Math.min(8, aliasCompact.length - queryCompact.length);
    }
    if (alias.startsWith(query + ' ')) {
      return 94 - Math.min(8, alias.length - query.length);
    }
    if (alias.includes(' ' + query)) {
      return 88 - Math.min(10, alias.length - query.length);
    }
    if (query.includes(alias)) {
      return 86 - Math.min(10, query.length - alias.length);
    }
    const qt = query.split(' ').filter(Boolean);
    const at = alias.split(' ').filter(Boolean);
    if (!qt.length) return 0;
    const hits = qt.filter((t) => at.some((a) =>
      a === t ||
      (t.length >= 3 && a.startsWith(t)) ||
      (/^\d+$/.test(t) && t.length >= 2 && a.startsWith(t))
    )).length;
    if (hits) {
      const coverage = hits / qt.length;
      if (coverage >= 0.5) return 40 + coverage * 40 - Math.min(10, (at.length - hits) * 2);
    }
    return 0;
  }

  function matchScore(item, query, kind) {
    let best = 0;
    // If the query contains a model number, the candidate must contain it too.
    // Otherwise "RTX 3060" drags in every other RTX card through the shared brand token.
    const numbers = query.match(/\d{3,5}/g) || [];
    for (const alias of aliasesFor(item, kind)) {
      if (numbers.length && !numbers.some((n) => alias.includes(n))) continue;
      best = Math.max(best, scoreAlias(alias, query));
    }
    return best;
  }

  const pools = { cpu: D.cpus, gpu: D.gpus, ram: D.ramKits, storage: D.storage, psu: D.psus };

  function capacityHint(raw) {
    const m = String(raw || '').toLowerCase().match(/(\d+(?:\.\d+)?)\s*(tb|gb)/);
    if (!m) return null;
    return parseFloat(m[1]) * (m[2] === 'tb' ? 1000 : 1);
  }

  function itemCapacity(item, kind) {
    if (kind === 'storage' || kind === 'ram') return item.capacity;
    if (kind === 'gpu') return item.vram;
    return null;
  }

  // A query like "SN850X 2TB" or "RTX 5060 Ti 16GB" must rank the matching
  // capacity variant above its identical-looking siblings.
  function capacityBonus(item, kind, hint) {
    if (!hint) return 0;
    const cap = itemCapacity(item, kind);
    if (!cap) return 0;
    const diff = Math.abs(cap - hint);
    if (diff <= 1) return 16;
    if (diff / hint <= 0.06) return 10;
    return 0;
  }

  function search(kind, query, limit) {
    const q = norm(query);
    if (!q) return [];
    const pool = pools[kind] || [];
    const hint = capacityHint(query);
    return pool
      .map((item) => ({ item, score: matchScore(item, q, kind) + capacityBonus(item, kind, hint) }))
      .filter((r) => r.score >= 35)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const ac = a.item.buyable ? 1 : 0;
        const bc = b.item.buyable ? 1 : 0;
        if (ac !== bc) return bc - ac;
        return (b.item.year || 0) - (a.item.year || 0);
      })
      .slice(0, limit || 8);
  }

  function lookup(kind, query) {
    const results = search(kind, query, 3);
    if (!results.length) return { status: 'unknown', item: null, score: 0, results: [] };
    const top = results[0];
    return {
      status: top.score >= 62 ? 'valid' : 'partial',
      item: top.score >= 62 ? top.item : null,
      candidate: top.item,
      score: top.score,
      results
    };
  }

  // ---------- RAM helpers ----------
  const DDR5_SPEEDS = [4800, 5200, 5600, 6000, 6200, 6400, 6600, 6800, 7000, 7200, 7600, 8000];
  const DDR4_SPEEDS = [2133, 2400, 2666, 2800, 3000, 3200, 3600, 3800, 4000];

  function parseRam(text) {
    const t = String(text || '').toLowerCase();
    if (!t.trim()) return { gen: null, speed: null, kit: null, status: 'empty' };
    const kit = lookup('ram', text);
    const genMatch = t.match(/ddr\s*([45])/);
    let gen = genMatch ? 'DDR' + genMatch[1] : null;
    let speed = null;
    const speedWithGen = t.match(/ddr\s*[45][\s\-]*(?:mt\/s\s*)?(\d{4,5})/);
    if (speedWithGen) speed = parseInt(speedWithGen[1], 10);
    if (!speed) {
      const mhz = t.match(/(\d{4,5})\s*(?:mt\/s|mhz)/);
      if (mhz) speed = parseInt(mhz[1], 10);
    }
    if (!speed) {
      const all = t.match(/\b(\d{4,5})\b/g) || [];
      const candidate = all.map(Number).find((n) => (gen === 'DDR5' ? DDR5_SPEEDS : DDR4_SPEEDS).includes(n));
      if (candidate) speed = candidate;
    }
    if (!gen && kit.status === 'valid' && kit.item) gen = kit.item.gen;
    if (!speed && kit.status === 'valid' && kit.item) speed = kit.item.speed;
    if (kit.status === 'valid' && kit.item) {
      return { gen: gen || kit.item.gen, speed: speed || kit.item.speed, kit: kit.item, status: 'valid', match: kit };
    }
    if (gen && speed) return { gen, speed, kit: null, status: 'valid', match: kit };
    if (gen || speed) return { gen, speed, kit: null, status: 'partial', match: kit };
    return { gen: null, speed: null, kit: null, status: 'partial', match: kit };
  }

  function ramScore(ram, profile) {
    if (!ram) return 0;
    const need = (profile && profile.ramNeed) || 32;
    const capacity = Number(ram.capacityGB) || 0;
    const gen = ram.gen || 'DDR4';
    const speed = Number(ram.speed) || (gen === 'DDR5' ? 5200 : 3000);
    const modules = Number(ram.modules) || 2;
    // Capacity past the amount the workload actually uses is not an upgrade.
    const capScore = clamp(capacity / need, 0, 1) * 40;
    let speedScore;
    if (gen === 'DDR5') {
      speedScore = clamp((speed - 4000) / (8000 - 4000), 0, 1) * 24 + 6;
    } else {
      speedScore = clamp((speed - 2133) / (4000 - 2133), 0, 1) * 24 + 4;
    }
    const channelScore = modules >= 2 ? 15 : 4;
    return clamp(capScore + speedScore + channelScore, 0, 100);
  }

  // ---------- storage helpers ----------
  const STORAGE_TIER = {
    'NVMe Gen5': 100,
    'NVMe Gen4': 85,
    'NVMe Gen3': 65,
    'NVMe SSD': 82,
    'SATA SSD': 45,
    HDD: 12
  };

  function storageScore(drive) {
    if (!drive) return 0;
    const tier = STORAGE_TIER[drive.kind] || 40;
    const capacity = Number(drive.capacityGB) || 0;
    return clamp(tier * 0.74 + clamp(capacity / 4000, 0, 1) * 26, 0, 100);
  }

  // ---------- CPU / GPU composites ----------
  function cpuScore(cpu, profile) {
    if (!cpu) return 0;
    const p = profile || D.profiles.balanced;
    return clamp(cpu.perf.gaming * (1 - p.mt) + cpu.perf.mt * p.mt, 0, 100);
  }

  function gpuScore(gpu, profile) {
    if (!gpu) return 0;
    const p = profile || D.profiles.balanced;
    if (p.vram) {
      const vram = clamp(gpu.vram / 32, 0, 1) * 48;
      return clamp(gpu.perf.raster * 0.42 + vram + gpu.perf.rt * 0.10, 0, 100);
    }
    return clamp(gpu.perf.raster * (1 - p.rt) + gpu.perf.rt * p.rt, 0, 100);
  }

  function requiredPsu(cpu, gpu) {
    const cpuTdp = cpu ? cpu.tdp : 125;
    const gpuTdp = gpu ? gpu.tdp : 0;
    const load = cpuTdp + gpuTdp + 120;
    return Math.ceil((load * 1.35) / 50) * 50;
  }

  function money(n) {
    return '$' + Math.round(Number(n) || 0).toLocaleString('en-US');
  }

  // ---------- recommendation ----------
  function recommend(input, budget, profileKey) {
    const profile = D.profiles[profileKey] || D.profiles.balanced;
    const b = Math.max(100, Number(budget) || 1000);

    const cpuNow = input.cpu && input.cpu.item;
    const gpuNow = input.gpu && input.gpu.item;
    const cpuNowScore = cpuScore(cpuNow, profile);
    const gpuNowScore = gpuScore(gpuNow, profile);
    const ramInfoNow = {
      capacityGB: input.ram.totalGB,
      gen: input.ram.gen,
      speed: input.ram.speed,
      modules: input.ram.slotsUsed
    };
    const ramNowScore = ramScore(ramInfoNow, profile);
    const drives = (input.drives || []).filter((d) => d.capacityGB > 0);
    const primary = drives.slice().sort((x, y) => (y.item ? storageScore(y) : 0) - (x.item ? storageScore(x) : 0))[0] || null;
    // No drive data means "unknown", not "zero". Never recommend storage the
    // user did not describe.
    const storageNowScore = primary ? (primary.item ? storageScore(primary.item) : storageScore({ kind: 'NVMe SSD', capacityGB: primary.capacityGB })) : null;
    const currentPsu = input.psu && (input.psu.wattage || (input.psu.item && input.psu.item.wattage)) || null;

    const notes = [];
    const holds = [];

    // CPU options: same socket only.
    const cpuOpts = [];
    if (cpuNow) {
      for (const c of D.cpus) {
        if (!c.buyable || c.socket !== cpuNow.socket) continue;
        const gain = normalizedGain(cpuNowScore, cpuScore(c, profile));
        if (gain < 0.06) continue;
        cpuOpts.push({
          key: 'cpu',
          item: c,
          gain,
          price: c.price,
          scoreAfter: cpuScore(c, profile)
        });
      }
      if (!cpuOpts.length) {
        const socketName = D.meta.sockets[cpuNow.socket] || cpuNow.socket;
        notes.push('The ' + socketName + ' platform has no useful same-socket CPU upgrade left. A faster CPU requires a new motherboard and memory.');
      }
    }

    // GPU options
    const gpuOpts = [];
    if (gpuNow) {
      for (const g of D.gpus) {
        if (!g.buyable) continue;
        const gain = normalizedGain(gpuNowScore, gpuScore(g, profile));
        if (gain < 0.07) continue;
        gpuOpts.push({
          key: 'gpu',
          item: g,
          gain,
          price: g.price,
          scoreAfter: gpuScore(g, profile)
        });
      }
    }

    // RAM options: at least as much capacity as today, faster or larger.
    const ramOpts = [];
    for (const kit of D.ramKits) {
      if (!kit.buyable) continue;
      if (kit.gen !== (input.ram.gen || (input.cpu.item && input.cpu.item.ddr) || 'DDR5')) continue;
      if (kit.capacity < (Number(input.ram.totalGB) || 0)) continue;
      const after = ramScore({ capacityGB: kit.capacity, gen: kit.gen, speed: kit.speed, modules: kit.modules }, profile);
      const gain = normalizedGain(ramNowScore, after);
      if (gain < 0.05) continue;
      ramOpts.push({ key: 'ram', item: kit, gain, price: kit.price, scoreAfter: after });
    }

    // Storage options only exist when the user actually described a drive.
    const storageOpts = [];
    if (primary) {
      for (const s of D.storage) {
        if (!s.buyable) continue;
        const gain = normalizedGain(storageNowScore, storageScore(s));
        if (gain < 0.06) continue;
        storageOpts.push({ key: 'storage', item: s, gain, price: s.price, scoreAfter: storageScore(s) });
      }
    }

    // Keep "do nothing" in the enumeration so the planner only buys useful parts.
    const gpuList = [null].concat(gpuOpts);
    const cpuList = [null].concat(cpuOpts);
    const ramList = [null].concat(ramOpts);
    const storageList = [null].concat(storageOpts);

    let best = null;
    for (const g of gpuList) {
      for (const c of cpuList) {
        for (const r of ramList) {
          for (const s of storageList) {
            let spend = 0;
            let weighted = 0;
            if (g) { spend += g.price; weighted += g.gain * profile.weights.gpu; }
            if (c) { spend += c.price; weighted += c.gain * profile.weights.cpu; }
            if (r) { spend += r.price; weighted += r.gain * profile.weights.ram; }
            if (s) { spend += s.price; weighted += s.gain * profile.weights.storage; }

            const needed = requiredPsu(c ? c.item : cpuNow, g ? g.item : gpuNow);
            let psuPick = null;
            if (currentPsu && needed > currentPsu + 25) {
              psuPick = D.psus
                .filter((p) => p.buyable && p.wattage >= needed)
                .sort((a, b2) => a.price - b2.price)[0];
              if (!psuPick) continue;
              spend += psuPick.price;
              weighted += 0.02 * profile.weights.psu;
            }
            if (spend > b) continue;

            const utilization = spend / b;
            let score = weighted * 100 + utilization * 4.5;
            // A small nudge toward filling the biggest relative gap.
            const gaps = { cpu: 1 - cpuNowScore / 100, gpu: 1 - gpuNowScore / 100, ram: 1 - ramNowScore / 100 };
            const biggest = Object.keys(gaps).sort((x, y) => gaps[y] - gaps[x])[0];
            if ((biggest === 'cpu' && c) || (biggest === 'gpu' && g) || (biggest === 'ram' && r)) score += 1.5;

            if (!best || score > best.score + 0.0001 || (Math.abs(score - best.score) < 0.0001 && spend < best.spend)) {
              best = { score, spend, g, c, r, s, psuPick, weighted, needed };
            }
          }
        }
      }
    }

    if (!best || best.weighted < 0.02) {
      return {
        plan: [],
        holds: buildHolds(),
        notes,
        verdict: 'No upgrade inside ' + money(budget) + ' is worth the cost for this build.',
        metrics: {
          total: 0,
          remaining: b,
          uplift: 0,
          draw: (cpuNow ? cpuNow.tdp : 65) + (gpuNow ? gpuNow.tdp : 0) + 90,
          psuHeadroom: currentPsu ? currentPsu - ((cpuNow ? cpuNow.tdp : 65) + (gpuNow ? gpuNow.tdp : 0) + 90) : null,
          budget: b,
          profile: profile.label
        },
        budget: b,
        profile
      };
    }

    const plan = [];
    if (best.g) {
      plan.push({
        key: 'gpu',
        label: 'Graphics card',
        current: gpuNow,
        currentText: gpuNow ? gpuNow.model : 'Unknown',
        upgrade: best.g.item,
        gain: best.g.gain,
        price: best.g.price,
        why: gpuWhy(gpuNow, best.g.item, profile),
        alt: pickAlt(gpuOpts, best.g, 'gpu')
      });
    }
    if (best.c) {
      plan.push({
        key: 'cpu',
        label: 'Processor',
        current: cpuNow,
        currentText: cpuNow ? cpuNow.model : 'Unknown',
        upgrade: best.c.item,
        gain: best.c.gain,
        price: best.c.price,
        why: cpuWhy(cpuNow, best.c.item, profile),
        alt: pickAlt(cpuOpts, best.c, 'cpu')
      });
    }
    if (best.r) {
      plan.push({
        key: 'ram',
        label: 'Memory',
        current: null,
        currentText: (input.ram.totalGB || '?') + ' GB ' + (input.ram.gen || '') + (input.ram.speed ? '-' + input.ram.speed : '') + ' (' + input.ram.slotsUsed + '/' + input.ram.slotsTotal + ' slots)',
        upgrade: best.r.item,
        gain: best.r.gain,
        price: best.r.price,
        why: ramWhy(input, best.r.item),
        alt: pickAlt(ramOpts, best.r, 'ram')
      });
    }
    if (best.s) {
      plan.push({
        key: 'storage',
        label: 'Storage',
        current: primary,
        currentText: primary ? (primary.item ? primary.item.model : (Math.round(primary.capacityGB / 1000) + ' TB drive')) : 'Unknown',
        upgrade: best.s.item,
        gain: best.s.gain,
        price: best.s.price,
        why: storageWhy(primary, best.s.item),
        alt: pickAlt(storageOpts, best.s, 'storage')
      });
    }
    if (best.psuPick) {
      plan.push({
        key: 'psu',
        label: 'Power supply',
        current: null,
        currentText: currentPsu ? currentPsu + ' W' : 'Unknown',
        upgrade: best.psuPick,
        gain: 0,
        price: best.psuPick.price,
        why: 'The planned parts need about ' + best.needed + ' W. This unit covers that with headroom and a native 12V-2x6 connector.',
        alt: null
      });
    }

    // Notes that depend on the final plan
    if (plan.some((p) => p.key === 'ram')) {
      notes.push('Desktop memory prices are high right now. Add capacity only if you are running out.');
    }
    if (currentPsu == null) {
      const needed = best.needed;
      notes.push('Power supply wattage is unknown, so the estimate assumes 650 W. The recommended parts need about ' + needed + ' W in total. Check the PSU label before buying.');
    } else if (!best.psuPick && currentPsu < best.needed) {
      notes.push('The current PSU is close to the estimated load. Leave headroom if it is old or a budget model.');
    }
    if (best.spend < b * 0.62 && plan.length) {
      notes.push('The plan leaves ' + money(b - best.spend) + ' unspent because the next useful upgrade did not add enough performance for the cost.');
    }
    if (plan.length && best.spend > b * 0.95) {
      notes.push('The plan uses most of the budget. Prices are estimates, so check each listing before ordering.');
    }
    if (plan.some((p) => p.key === 'gpu') && !plan.some((p) => p.key === 'psu')) {
      notes.push('Check the card length against the case and confirm the PSU has the right PCIe power connectors.');
    }

    const draw = (best.c ? best.c.item.tdp : cpuNow.tdp) + (best.g ? best.g.item.tdp : gpuNow.tdp) + 90;
    const psuWattage = best.psuPick ? best.psuPick.wattage : currentPsu;
    const uplift = Math.round(best.weighted * 100);

    return {
      plan,
      holds: buildHolds(plan),
      notes,
      verdict: verdictFor(plan, best, profile, b),
      metrics: {
        total: best.spend,
        remaining: b - best.spend,
        uplift,
        draw,
        psuHeadroom: psuWattage ? psuWattage - draw : null,
        needed: best.needed,
        budget: b,
        profile: profile.label
      },
      budget: b,
      profile
    };

    function buildHolds(activePlan) {
      const active = new Set((activePlan || []).map((p) => p.key));
      const out = [];
      if (!active.has('gpu')) out.push({ label: 'GPU', reason: 'No worthwhile upgrade within the budget.' });
      if (!active.has('cpu')) out.push({ label: 'CPU', reason: cpuOpts.length ? 'Not the best use of the remaining budget.' : 'No same-socket upgrade is available.' });
      if (!active.has('ram')) out.push({ label: 'Memory', reason: ramNowScore >= 65 ? 'Capacity and speed are sufficient.' : 'The gain does not justify current memory prices.' });
      if (!active.has('storage') && storageNowScore >= 60) out.push({ label: 'Storage', reason: 'Fast enough. Capacity is your call.' });
      if (!active.has('psu')) out.push({ label: 'PSU', reason: currentPsu ? currentPsu + ' W is enough for this plan.' : 'Kept as is. Check the label.' });
      return out;
    }
  }

  function normalizedGain(before, after) {
    if (!after || after <= before) return 0;
    const headroom = Math.max(1, 100 - before);
    return clamp((after - before) / headroom, 0, 1);
  }

  function pickAlt(options, chosen, key) {
    const pool = options
      .filter((o) => o.item.id !== chosen.item.id && o.price < chosen.price && o.gain >= chosen.gain * 0.58)
      .sort((a, b) => (b.gain / b.price) - (a.gain / a.price));
    const pick = pool[0];
    if (!pick) return null;
    return { item: pick.item, price: pick.price, gain: pick.gain };
  }

  function gpuWhy(before, after, profile) {
    if (!before) return 'Modern GPU with current drivers and upscaling support.';
    const gain = Math.round(normalizedGain(gpuScore(before, profile), gpuScore(after, profile)) * 100);
    return 'About ' + gain + '% higher score for ' + profile.label.toLowerCase() + ', with ' + after.vram + ' GB VRAM and ' + (after.brand === 'NVIDIA' ? 'DLSS 4' : after.brand === 'AMD' ? 'FSR 4' : 'XeSS') + '.';
  }

  function cpuWhy(before, after, profile) {
    const socket = D.meta.sockets[after.socket] || after.socket;
    return 'Fits ' + socket + ': ' + after.cores + ' cores / ' + after.threads + ' threads, ' + after.tdp + ' W.';
  }

  function ramWhy(input, kit) {
    const now = (input.ram.totalGB || '?') + ' GB';
    return 'Takes you from ' + now + ' to ' + kit.capacity + ' GB at ' + kit.speed + ' MT/s. That keeps more projects and browser tabs in memory.';
  }

  function storageWhy(primary, drive) {
    const from = primary ? (primary.capacityGB ? 'the current ' + Math.round(primary.capacityGB / 1000) + ' TB drive' : 'the current drive') : 'the current drive';
    return 'Replaces ' + from + ' with a ' + Math.round(drive.capacity / 1000) + ' TB ' + drive.kind + ' drive. Reads up to ' + drive.read.toLocaleString() + ' MB/s.';
  }

  function verdictFor(plan, best, profile, budget) {
    if (!plan.length) return 'No upgrade inside ' + money(budget) + ' is worth the cost for this build.';
    const names = plan.map((p) => p.upgrade.model);
    const left = budget - best.spend;
    return 'Recommended: ' + names.join(', ') + '. This uses ' + money(best.spend) + ' of the ' + money(budget) + ' budget' + (left > 0 ? ' and leaves ' + money(left) + '.' : '.');
  }

  return {
    search,
    lookup,
    norm,
    parseRam,
    ramScore,
    storageScore,
    cpuScore,
    gpuScore,
    requiredPsu,
    recommend,
    money,
    profiles: D.profiles
  };
})();
