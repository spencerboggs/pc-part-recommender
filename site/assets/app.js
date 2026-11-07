/* PC Upgrade Advisor UI controller. */
(function () {
  'use strict';

  const E = window.PCEngine;
  const D = window.PCData;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const MAX_DRIVES = 4;
  const desktop = window.pcAdvisorDesktop || null;

  const state = {
    cpu: { item: null, status: 'empty', detected: false },
    gpu: { item: null, status: 'empty', vendor: '', detected: false },
    ram: { totalGB: 0, gen: null, speed: null, kit: null, slotsUsed: 2, slotsTotal: 4, status: 'empty' },
    drives: [],
    psu: { item: null, wattage: null, status: 'empty' },
    budget: 1000,
    profile: 'balanced'
  };

  // ------------------------------------------------------------------ helpers
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setStatus(el, status, text) {
    if (!el) return;
    el.dataset.status = status;
    const t = $('.status-text', el);
    if (t) t.textContent = text;
  }

  function setCard(id, status) {
    const card = document.getElementById(id);
    if (!card) return;
    if (status === 'empty' || status === 'idle') card.removeAttribute('data-state');
    else card.dataset.state = status;
  }

  function setChips(el, chips) {
    if (!el) return;
    el.innerHTML = chips
      .map((c) => `<span class="${c.tone ? 'is-' + c.tone : ''}">${esc(c.text)}</span>`)
      .join('');
  }

  function priceLabel(item) {
    if (!item.price) return '';
    return item.buyable ? E.money(item.price) : '~' + E.money(item.price) + ' used';
  }

  function listingUrl(model) {
    return 'https://pcpartpicker.com/search/?q=' + encodeURIComponent(model);
  }

  function specLine(kind, item) {
    if (!item) return '';
    if (kind === 'cpu') {
      return `${item.cores}C / ${item.threads}T · ${D.meta.sockets[item.socket] || item.socket} · ${item.tdp} W · ${item.buyable ? 'current' : 'legacy'}`;
    }
    if (kind === 'gpu') return `${item.brand} · ${item.vram} GB · ${item.tdp} W · ${item.buyable ? 'current' : 'legacy'}`;
    if (kind === 'ram') return `${item.gen}-${item.speed} · ${item.capacity} GB · ${item.modules} modules`;
    if (kind === 'storage') return `${item.kind} · ${Math.round(item.capacity / 1000)} TB · ${item.read.toLocaleString()} MB/s`;
    if (kind === 'psu') return `${item.wattage} W · ${item.rating}${item.atx31 ? ' · ATX 3.1' : ''}`;
    return '';
  }

  // ------------------------------------------------------------- comboboxes
  const combos = [];

  function attachCombo(input, kind, onPick) {
    const wrap = input.closest('.combo');
    if (!wrap) return null;
    const list = document.createElement('ul');
    list.className = 'suggest';
    list.id = (input.id || 'combo-' + kind) + '-list';
    list.setAttribute('role', 'listbox');
    wrap.appendChild(list);

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', list.id);

    let results = [];
    let active = -1;
    let isOpen = false;

    function close() {
      isOpen = false;
      active = -1;
      list.classList.remove('is-open');
      input.setAttribute('aria-expanded', 'false');
    }

    function paint() {
      list.innerHTML = results.length
        ? results
            .map((r, i) => {
              const item = r.item;
              return `<li role="option" aria-selected="${i === active}">
                <button type="button" tabindex="-1" data-index="${i}" class="${i === active ? 'is-active' : ''}">
                  <span class="s-model">${esc(item.model)}</span>
                  <span class="s-price">${esc(priceLabel(item))}</span>
                  <span class="s-meta">${esc(specLine(kind, item))}</span>
                </button>
              </li>`;
            })
            .join('')
        : '<li class="s-empty" role="option" aria-disabled="true">No catalog match. Try a shorter model name.</li>';

      $$('button', list).forEach((btn) => {
        btn.addEventListener('mousedown', (e) => e.preventDefault());
        btn.addEventListener('click', () => choose(Number(btn.dataset.index)));
      });
    }

    function openWith(res) {
      combos.forEach((other) => { if (other !== api) other.close(); });
      results = res;
      active = -1;
      isOpen = true;
      paint();
      list.classList.add('is-open');
      input.setAttribute('aria-expanded', 'true');
    }

    function move(delta) {
      if (!results.length) return;
      active = (active + delta + results.length) % results.length;
      paint();
      const activeEl = $('[data-index="' + active + '"]', list);
      if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
    }

    function choose(index) {
      const r = results[index];
      if (!r) return;
      input.value = r.item.model;
      close();
      if (onPick) onPick(r.item);
    }

    function refresh() {
      const q = input.value.trim();
      if (!q) { close(); return; }
      openWith(E.search(kind, q, 8));
    }

    input.addEventListener('input', refresh);
    input.addEventListener('focus', () => { if (input.value.trim()) refresh(); });
    input.addEventListener('blur', () => setTimeout(close, 140));
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') { close(); return; }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (!isOpen) refresh(); else move(1);
        return;
      }
      if (event.key === 'ArrowUp') { event.preventDefault(); move(-1); return; }
      if (event.key === 'Enter' && isOpen) {
        event.preventDefault();
        choose(active >= 0 ? active : 0);
      }
    });

    const api = { close, refresh, choose };
    combos.push(api);
    return api;
  }

  // ------------------------------------------------------------------- CPU
  function validateCPU(opts) {
    opts = opts || {};
    const input = $('#cpu-model');
    const raw = input.value.trim();
    const statusEl = $('#cpu-status');
    const meta = $('#cpu-meta');
    state.cpu.item = null;

    if (!raw) {
      state.cpu.status = 'empty';
      setStatus(statusEl, 'idle', 'Not set');
      setCard('cpu-card', '');
      setChips(meta, []);
      input.removeAttribute('aria-invalid');
      updateAll();
      return;
    }

    const res = E.lookup('cpu', raw);
    if (res.status === 'valid') {
      const c = res.item;
      state.cpu.item = c;
      state.cpu.status = 'valid';
      state.cpu.detected = false;
      setStatus(statusEl, 'valid', c.model);
      setCard('cpu-card', 'valid');
      setChips(meta, [
        { text: c.cores + ' cores / ' + c.threads + ' threads', tone: 'accent' },
        { text: D.meta.sockets[c.socket] || c.socket },
        { text: c.tdp + ' W' },
        { text: c.buyable ? 'Current' : 'Legacy' }
      ]);
      if (opts.pick || !$('#cpu-cores').value) $('#cpu-cores').value = c.cores;
      if (opts.pick || !$('#cpu-threads').value) $('#cpu-threads').value = c.threads;
      input.removeAttribute('aria-invalid');
    } else if (res.status === 'partial') {
      state.cpu.status = 'partial';
      setStatus(statusEl, 'partial', 'Close: ' + (res.candidate ? res.candidate.model : 'unknown'));
      setCard('cpu-card', 'partial');
      setChips(meta, [{ text: 'Pick a listed match to continue', tone: 'warn' }]);
      input.removeAttribute('aria-invalid');
    } else if (opts.detected) {
      state.cpu.status = 'detected';
      setStatus(statusEl, 'detected', 'Detected · not in catalog');
      setCard('cpu-card', 'partial');
      setChips(meta, [{ text: 'Detected on this PC. Pick the closest match', tone: 'warn' }]);
      input.removeAttribute('aria-invalid');
    } else {
      state.cpu.status = 'unknown';
      setStatus(statusEl, 'unknown', 'Not recognized');
      setCard('cpu-card', 'unknown');
      setChips(meta, [{ text: 'No CPU match. Try the model number only', tone: 'bad' }]);
      input.setAttribute('aria-invalid', 'true');
    }
    updateAll();
  }

  // ------------------------------------------------------------------- GPU
  function validateGPU(opts) {
    opts = opts || {};
    const input = $('#gpu-model');
    const raw = input.value.trim();
    const statusEl = $('#gpu-status');
    const meta = $('#gpu-meta');
    const vendorSel = $('#gpu-vendor');
    state.gpu.item = null;

    if (!raw) {
      state.gpu.status = 'empty';
      setStatus(statusEl, 'idle', 'Not set');
      setCard('gpu-card', '');
      setChips(meta, []);
      input.removeAttribute('aria-invalid');
      updateAll();
      return;
    }

    const res = E.lookup('gpu', raw);
    if (res.status === 'valid') {
      const g = res.item;
      state.gpu.item = g;
      state.gpu.status = 'valid';
      state.gpu.detected = false;
      setStatus(statusEl, 'valid', g.model);
      setCard('gpu-card', 'valid');
      setChips(meta, [
        { text: g.brand, tone: 'accent' },
        { text: g.vram + ' GB VRAM' },
        { text: g.tdp + ' W' },
        { text: g.buyable ? 'Current' : 'Legacy' }
      ]);
      vendorSel.value = g.brand;
      input.removeAttribute('aria-invalid');
    } else if (res.status === 'partial') {
      state.gpu.status = 'partial';
      setStatus(statusEl, 'partial', 'Close: ' + (res.candidate ? res.candidate.model : 'unknown'));
      setCard('gpu-card', 'partial');
      setChips(meta, [{ text: 'Pick a listed match to continue', tone: 'warn' }]);
      input.removeAttribute('aria-invalid');
    } else if (opts.detected) {
      state.gpu.status = 'detected';
      setStatus(statusEl, 'detected', 'Detected · not in catalog');
      setCard('gpu-card', 'partial');
      setChips(meta, [{ text: 'Detected on this PC. Pick the closest match', tone: 'warn' }]);
      input.removeAttribute('aria-invalid');
    } else {
      state.gpu.status = 'unknown';
      setStatus(statusEl, 'unknown', 'Not recognized');
      setCard('gpu-card', 'unknown');
      setChips(meta, [{ text: 'No GPU match. Try the model number only', tone: 'bad' }]);
      input.setAttribute('aria-invalid', 'true');
    }
    updateAll();
  }

  // ------------------------------------------------------------------- RAM
  function validateRAM() {
    const sizeRaw = parseFloat($('#ram-size').value);
    const size = isFinite(sizeRaw) && sizeRaw > 0 ? sizeRaw : 0;
    const typeText = $('#ram-type').value.trim();
    const used = clampInt($('#ram-slots-used').value, 1, 8, 2);
    const total = clampInt($('#ram-slots-total').value, 1, 8, 4);
    const statusEl = $('#ram-status');
    const meta = $('#ram-meta');
    const parsed = E.parseRam(typeText);
    const cpuDdr = state.cpu.item ? state.cpu.item.ddr : null;

    state.ram.totalGB = size;
    state.ram.slotsUsed = Math.min(used, total);
    state.ram.slotsTotal = total;
    state.ram.kit = parsed.kit || null;
    state.ram.gen = parsed.gen || cpuDdr || null;
    state.ram.speed = parsed.speed || null;

    if (!size) {
      state.ram.status = 'empty';
      setStatus(statusEl, 'idle', 'Not set');
      setCard('ram-card', '');
      setChips(meta, []);
      updateAll();
      return;
    }

    if (used > total) {
      state.ram.status = 'partial';
      setStatus(statusEl, 'partial', 'Slots used exceeds total');
      setCard('ram-card', 'partial');
      setChips(meta, [{ text: 'Check installed / total slots', tone: 'warn' }]);
      updateAll();
      return;
    }

    const chips = [
      { text: size + ' GB', tone: 'accent' },
      { text: state.ram.gen || 'type unknown' },
      { text: state.ram.speed ? state.ram.speed + ' MT/s' : 'speed unknown' },
      { text: used + ' / ' + total + ' slots' }
    ];

    if (parsed.gen && parsed.speed) {
      state.ram.status = 'valid';
      setStatus(statusEl, 'valid', `${state.ram.gen}-${state.ram.speed} · ${size} GB`);
      setCard('ram-card', 'valid');
      setChips(meta, chips);
    } else if (typeText && !parsed.gen && !parsed.speed) {
      state.ram.status = 'unknown';
      setStatus(statusEl, 'unknown', 'RAM type not recognized');
      setCard('ram-card', 'unknown');
      setChips(meta, chips.concat([{ text: 'Try “DDR5-6000”', tone: 'bad' }]));
    } else if (!typeText && cpuDdr) {
      state.ram.status = 'partial';
      setStatus(statusEl, 'partial', 'Type inferred from CPU');
      setCard('ram-card', 'partial');
      setChips(meta, chips);
    } else {
      state.ram.status = 'partial';
      setStatus(statusEl, 'partial', parsed.gen ? 'Speed unknown' : 'Add RAM type');
      setCard('ram-card', 'partial');
      setChips(meta, chips);
    }
    updateAll();
  }

  function clampInt(value, lo, hi, fallback) {
    const n = parseInt(value, 10);
    if (!isFinite(n)) return fallback;
    return Math.min(hi, Math.max(lo, n));
  }

  // --------------------------------------------------------------- storage
  function renderDrives() {
    const list = $('#drive-list');
    list.innerHTML = '';
    const template = $('#drive-template');
    state.drives.forEach((drive, index) => {
      const fragment = template.content.cloneNode(true);
      const row = $('.drive-row', fragment);
      const modelInput = $('.drive-model', row);
      const capInput = $('.drive-cap', row);
      const removeBtn = $('.remove-drive', row);
      const meta = $('.drive-meta', row);

      modelInput.id = 'drive-model-' + index;
      modelInput.value = drive.model || '';
      modelInput.placeholder = index === 0 ? 'e.g. Samsung 990 PRO 2TB' : 'Optional second drive';
      const label = $('label', row);
      if (label) label.setAttribute('for', modelInput.id);
      capInput.value = drive.capacityGB || '';
      capInput.id = 'drive-cap-' + index;
      const capLabel = capInput.closest('.field').querySelector('label');
      if (capLabel) capLabel.setAttribute('for', capInput.id);

      attachCombo(modelInput, 'storage', (item) => {
        drive.item = item;
        drive.model = item.model;
        modelInput.value = item.model;
        drive.capacityGB = item.capacity;
        capInput.value = item.capacity;
        paintDriveMeta(meta, drive);
        updateStorageStatus();
        updateAll();
      });

      modelInput.addEventListener('input', () => {
        drive.model = modelInput.value;
        const res = modelInput.value.trim() ? E.lookup('storage', modelInput.value) : null;
        drive.item = res && res.status === 'valid' ? res.item : null;
        drive.status = !modelInput.value.trim() ? 'empty' : res && res.status === 'valid' ? 'valid' : res && res.status === 'partial' ? 'partial' : 'unknown';
        paintDriveMeta(meta, drive);
        updateStorageStatus();
      });

      capInput.addEventListener('input', () => {
        drive.capacityGB = Math.max(0, parseFloat(capInput.value) || 0);
        updateStorageStatus();
        updateAll();
      });

      removeBtn.disabled = state.drives.length <= 1;
      removeBtn.addEventListener('click', () => {
        if (state.drives.length <= 1) return;
        state.drives.splice(index, 1);
        renderDrives();
        updateStorageStatus();
        updateAll();
      });

      if (drive.item) {
        drive.status = 'valid';
        paintDriveMeta(meta, drive);
      } else if (drive.model) {
        const res = E.lookup('storage', drive.model);
        drive.item = res.status === 'valid' ? res.item : null;
        drive.status = res.status;
        paintDriveMeta(meta, drive);
      } else {
        setChips(meta, drive.capacityGB ? [{ text: 'Model optional', tone: 'warn' }] : []);
        drive.status = drive.capacityGB ? 'partial' : 'empty';
      }

      list.appendChild(row);
    });
    updateStorageStatus();
  }

  function paintDriveMeta(meta, drive) {
    if (drive.item) {
      setChips(meta, [
        { text: drive.item.kind, tone: 'accent' },
        { text: Math.round(drive.item.capacity / 1000) + ' TB' },
        { text: drive.item.read.toLocaleString() + ' MB/s' }
      ]);
      return;
    }
    if (!drive.model) {
      setChips(meta, drive.capacityGB ? [{ text: 'Model optional', tone: 'warn' }] : []);
      return;
    }
    if (drive.status === 'partial') {
      setChips(meta, [{ text: 'Close match only', tone: 'warn' }]);
    } else {
      setChips(meta, [{ text: 'Unrecognized model. Capacity still counts', tone: 'bad' }]);
    }
  }

  function updateStorageStatus() {
    const statusEl = $('#storage-status');
    const valid = state.drives.filter((d) => d.item);
    const withCap = state.drives.filter((d) => d.capacityGB > 0);
    const totalGB = withCap.reduce((sum, d) => sum + d.capacityGB, 0);
    if (!state.drives.some((d) => d.model || d.capacityGB > 0)) {
      setStatus(statusEl, 'idle', 'Optional');
      setCard('storage-card', '');
      return;
    }
    if (valid.length) {
      setStatus(statusEl, 'valid', `${valid.length} drive${valid.length > 1 ? 's' : ''} · ${(totalGB / 1000).toFixed(totalGB >= 10000 ? 0 : 1)} TB`);
      setCard('storage-card', 'valid');
    } else if (withCap.length) {
      setStatus(statusEl, 'partial', `${(totalGB / 1000).toFixed(1)} TB noted`);
      setCard('storage-card', 'partial');
    } else {
      setStatus(statusEl, 'unknown', 'No capacity');
      setCard('storage-card', 'unknown');
    }
  }

  // ------------------------------------------------------------------- PSU
  function validatePSU(opts) {
    opts = opts || {};
    const modelInput = $('#psu-model');
    const wattInput = $('#psu-wattage');
    const statusEl = $('#psu-status');
    const meta = $('#psu-meta');
    const raw = modelInput.value.trim();
    state.psu.item = null;

    if (!raw && !wattInput.value) {
      state.psu.status = 'empty';
      state.psu.wattage = null;
      setStatus(statusEl, 'idle', 'Optional');
      setCard('psu-card', '');
      setChips(meta, [{ text: 'Not software-detectable. Read the label', tone: 'warn' }]);
      updateAll();
      return;
    }

    const res = raw ? E.lookup('psu', raw) : { status: 'unknown' };
    if (res.status === 'valid') {
      const p = res.item;
      state.psu.item = p;
      state.psu.status = 'valid';
      state.psu.wattage = p.wattage;
      setStatus(statusEl, 'valid', `${p.wattage} W · ${p.rating}`);
      setCard('psu-card', 'valid');
      setChips(meta, [
        { text: p.brand, tone: 'accent' },
        { text: p.wattage + ' W' },
        { text: p.rating },
        { text: p.atx31 ? 'ATX 3.1' : 'Older standard' }
      ]);
      if (!wattInput.value || opts.pick) wattInput.value = p.wattage;
      modelInput.removeAttribute('aria-invalid');
    } else if (wattInput.value) {
      const w = parseFloat(wattInput.value) || 0;
      state.psu.wattage = w;
      state.psu.status = 'partial';
      setStatus(statusEl, 'partial', raw ? 'Model unknown · ' + w + ' W noted' : w + ' W noted');
      setCard('psu-card', 'partial');
      setChips(meta, [{ text: 'Wattage is enough to plan with', tone: 'warn' }]);
    } else {
      state.psu.status = 'unknown';
      setStatus(statusEl, 'unknown', 'PSU not recognized');
      setCard('psu-card', 'unknown');
      setChips(meta, [{ text: 'Pick a match or just enter wattage', tone: 'bad' }]);
      modelInput.setAttribute('aria-invalid', 'true');
    }
    updateAll();
  }

  // ---------------------------------------------------------------- updates
  function updateAll() {
    updateReadiness();
    updateReadout();
  }

  function currentRamForScore() {
    return {
      capacityGB: state.ram.totalGB,
      gen: state.ram.gen,
      speed: state.ram.speed,
      modules: state.ram.slotsUsed
    };
  }

  function primaryDrive() {
    const valid = state.drives.filter((d) => d.item);
    if (valid.length) return valid.slice().sort((a, b) => E.storageScore(b.item) - E.storageScore(a.item))[0];
    return state.drives.find((d) => d.capacityGB > 0) || null;
  }

  function canSearch() {
    return Boolean(
      state.cpu.item &&
      state.gpu.item &&
      state.ram.totalGB > 0 &&
      state.ram.slotsUsed <= state.ram.slotsTotal &&
      state.budget >= 100
    );
  }

  function updateReadiness() {
    const btn = $('#find-btn');
    const wrap = $('#readiness');
    const text = $('#readiness-text');
    const missing = [];
    if (!state.cpu.item) missing.push('CPU');
    if (!state.gpu.item) missing.push('GPU');
    if (!state.ram.totalGB) missing.push('memory capacity');
    if (state.ram.slotsUsed > state.ram.slotsTotal) missing.push('valid slot count');
    if (!(state.budget >= 100)) missing.push('budget');

    const ready = missing.length === 0;
    btn.disabled = !ready;
    wrap.dataset.ready = String(ready);
    if (ready) {
      const profile = D.profiles[state.profile] || D.profiles.balanced;
      text.textContent = 'Ready. Using the ' + profile.label + ' profile.';
    } else {
      text.textContent = 'Still needed: ' + missing.join(', ') + '.';
    }
  }

  function updateReadout() {
    const host = $('#readout');
    if (!host) return;
    const rows = [];
    if (state.cpu.item) {
      rows.push({ label: 'CPU', name: state.cpu.item.model, score: E.cpuScore(state.cpu.item, D.profiles[state.profile]) });
    }
    if (state.gpu.item) {
      rows.push({ label: 'GPU', name: state.gpu.item.model, score: E.gpuScore(state.gpu.item, D.profiles[state.profile]) });
    }
    if (state.ram.totalGB) {
      rows.push({ label: 'Memory', name: state.ram.totalGB + ' GB ' + (state.ram.gen || '') + (state.ram.speed ? '-' + state.ram.speed : ''), score: E.ramScore(currentRamForScore(), D.profiles[state.profile]) });
    }
    const primary = primaryDrive();
    if (primary) {
      const score = primary.item ? E.storageScore(primary.item) : E.storageScore({ kind: 'SATA SSD', capacityGB: primary.capacityGB });
      rows.push({ label: 'Storage', name: primary.item ? primary.item.model : Math.round(primary.capacityGB / 1000) + ' TB drive', score });
    }
    if (!rows.length) {
      host.innerHTML = '<p class="part-help">Enter parts to see their relative scores.</p>';
      return;
    }
    host.innerHTML = rows
      .map(
        (r) => `<div class="readout-row">
          <span class="r-label">${esc(r.label)}</span>
          <span class="r-name" title="${esc(r.name)}">${esc(r.name)}</span>
          <span class="r-score">${r.score == null ? 'n/a' : Math.round(r.score)}</span>
          <span class="r-bar"><i style="width:${Math.max(3, Math.min(100, Math.round(r.score || 0)))}%"></i></span>
        </div>`
      )
      .join('') + '<p class="readout-foot">Scores are 0 to 100 within this catalog and are weighted for the selected use. They are for comparison, not benchmark results.</p>';
  }

  // ------------------------------------------------------------------ budget
  function setBudget(value) {
    let n = Math.round(Number(value) || 0);
    if (!n) n = 1000;
    n = Math.min(20000, Math.max(100, n));
    state.budget = n;
    $('#budget').value = n;
    const slider = $('#budget-slider');
    slider.value = Math.min(n, Number(slider.max) || 5000);
    $$('.preset').forEach((p) => p.classList.toggle('is-active', Number(p.dataset.budget) === n));
    updateReadiness();
  }

  // --------------------------------------------------------------- results
  function buildSnapshot() {
    const cpu = state.cpu.item;
    const gpu = state.gpu.item;
    const primary = primaryDrive();
    return {
      cpu: { item: cpu, cores: Number($('#cpu-cores').value) || (cpu ? cpu.cores : null), threads: Number($('#cpu-threads').value) || (cpu ? cpu.threads : null) },
      gpu: { item: gpu, vendor: $('#gpu-vendor').value || (gpu ? gpu.brand : '') },
      ram: {
        totalGB: state.ram.totalGB,
        gen: state.ram.gen,
        speed: state.ram.speed,
        slotsUsed: state.ram.slotsUsed,
        slotsTotal: state.ram.slotsTotal
      },
      drives: state.drives
        .filter((d) => d.capacityGB > 0)
        .map((d) => ({ item: d.item, capacityGB: d.capacityGB, kind: d.item ? d.item.kind : 'SATA SSD' })),
      primary,
      psu: { item: state.psu.item, wattage: state.psu.wattage }
    };
  }

  function runSearch() {
    if (!canSearch()) return;
    combos.forEach((combo) => combo.close());
    const btn = $('#find-btn');
    const label = btn.innerHTML;
    btn.disabled = true;
    btn.classList.add('is-busy');
    btn.textContent = 'Finding parts...';

    // Let the button state paint before planning.
    setTimeout(() => {
      const result = E.recommend(buildSnapshot(), state.budget, state.profile);
      renderResults(result);
      btn.innerHTML = label;
      btn.classList.remove('is-busy');
      updateReadiness();
      const section = $('#results');
      section.hidden = false;
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }

  function renderResults(result) {
    const plan = result.plan || [];
    const hasPlan = plan.length > 0;
    $('#results-meta').textContent = D.profiles[state.profile].label + ' · ' + E.money(result.budget) + ' budget · prices checked ' + D.meta.priceCheckedShort;
    $('#results-heading').textContent = 'Upgrade plan';
    $('#results-empty').hidden = hasPlan;
    $('#upgrade-table').hidden = !hasPlan;

    const m = result.metrics;
    const tiles = [
      { label: 'Parts total', value: E.money(m.total), sub: 'of ' + E.money(m.budget) + ' · before tax', accent: true },
      { label: 'Estimated gain', value: hasPlan ? '+' + m.uplift + '%' : '0%', sub: D.profiles[state.profile].label + ' profile' },
      { label: 'Budget left', value: E.money(Math.max(0, m.remaining)), sub: hasPlan ? (m.remaining > 0 ? 'kept in reserve' : 'fully used') : 'nothing committed' },
      {
        label: 'Estimated power draw',
        value: Math.round(m.draw) + ' W',
        sub: m.psuHeadroom != null ? (m.psuHeadroom >= 0 ? '~' + Math.round(m.psuHeadroom) + ' W PSU headroom' : 'PSU may be short') : 'PSU wattage unknown'
      }
    ];
    $('#result-metrics').innerHTML = tiles
      .map((t) => `<div class="metric ${t.accent ? 'is-accent' : ''}">
        <div class="m-label">${esc(t.label)}</div>
        <div class="m-value">${esc(t.value)}</div>
        <div class="m-sub">${esc(t.sub)}</div>
      </div>`)
      .join('');

    const priceSub = 'GPU, CPU and memory checked ' + D.meta.priceCheckedShort + '; storage and PSU are estimates';
    $('#table-sub').textContent = hasPlan ? plan.length + ' part' + (plan.length > 1 ? 's' : '') + ' · ' + priceSub : priceSub + '.';

    if (hasPlan) {
      $('#upgrade-body').innerHTML = plan.map(rowHtml).join('');
      $('#upgrade-foot').innerHTML = `<tr>
        <td colspan="3" class="total-label">Parts total</td>
        <td colspan="2" class="num total-value">${E.money(m.total)}</td>
      </tr>`;
    } else {
      $('#upgrade-body').innerHTML = '';
      $('#upgrade-foot').innerHTML = '';
      $('#results-empty-text').textContent = result.verdict;
    }

    $('#result-verdict').textContent = result.verdict;

    const notes = result.notes || [];
    $('#result-notes').innerHTML = notes.length
      ? notes.map((n) => `<li>${esc(n)}</li>`).join('')
      : '<li>Nothing flagged. Check case clearance and PSU connectors before ordering.</li>';
    $('#notes-card').hidden = false;

    const holds = result.holds || [];
    $('#result-holds').innerHTML = holds.length
      ? holds.map((h) => `<div class="hold"><b>${esc(h.label)}</b><span>${esc(h.reason)}</span></div>`).join('')
      : '<p class="part-help">Every category moved.</p>';
    $('#holds-card').hidden = false;

    $('#result-disclaimer').textContent = D.meta.note;
  }

  function badgeFor(kind, item) {
    if (kind === 'cpu') return item.cores + 'C / ' + item.threads + 'T';
    if (kind === 'gpu') return item.vram + ' GB';
    if (kind === 'ram') return item.capacity + ' GB';
    if (kind === 'storage') return item.kind;
    if (kind === 'psu') return item.wattage + ' W';
    return '';
  }

  function rowHtml(row) {
    const u = row.upgrade;
    let currentSpec = '';
    if (row.key === 'cpu' && row.current) currentSpec = `${row.current.cores}C/${row.current.threads}T · ${D.meta.sockets[row.current.socket] || row.current.socket}`;
    if (row.key === 'gpu' && row.current) currentSpec = `${row.current.brand} · ${row.current.vram} GB · ${row.current.tdp} W`;
    if (row.key === 'ram') currentSpec = '';
    if (row.key === 'storage' && row.current) currentSpec = row.current.item ? row.current.item.kind : 'Capacity only';
    if (row.key === 'psu') currentSpec = 'Existing unit';

    const gain = row.gain > 0
      ? `<span class="gain">+${Math.round(row.gain * 100)}%</span><span class="gain-bar"><i style="width:${Math.round(row.gain * 100)}%"></i></span>`
      : '<span class="gain" style="color:var(--color-muted)">supports</span>';

    const alt = row.alt
      ? `<span class="alt">Value alternative: <a href="${esc(listingUrl(row.alt.item.model))}" target="_blank" rel="noopener noreferrer">${esc(row.alt.item.model)}</a>, ${E.money(row.alt.price)}</span>`
      : '';

    return `<tr>
      <td data-label="Component"><span class="row-part">${esc(row.label)}</span></td>
      <td data-label="You have"><span class="current-model">${esc(row.currentText)}</span><span class="row-sub">${esc(currentSpec)}</span></td>
      <td data-label="Upgrade to">
        <div class="rec-line"><span class="rec-model">${esc(u.model)}</span><span class="rec-badge">${esc(badgeFor(row.key, u))}</span></div>
        <span class="row-sub">${esc(specLine(row.key, u))}</span>
        <span class="why">${esc(row.why)}</span>
        ${alt}
      </td>
      <td data-label="Est. gain" class="num">${gain}</td>
      <td data-label="Price" class="num"><a class="price-val price-link" href="${esc(listingUrl(u.model))}" target="_blank" rel="noopener noreferrer" title="Check current listings for ${esc(u.model)}">${E.money(row.price)}</a><span class="row-sub price-note">${u.priceChecked ? 'checked ' + D.meta.priceCheckedShort + ' · Newegg' : 'estimate · check listings'}</span></td>
    </tr>`;
  }

  // ----------------------------------------------------------- desktop scan
  function setScan(text, stateName) {
    const line = $('#scan-line');
    const label = $('#scan-text');
    if (!line || !label) return;
    label.textContent = text;
    line.dataset.state = stateName || '';
  }

  async function scanHardware() {
    if (!desktop) return;
    const btn = $('#scan-btn');
    const hadPlan = !$('#results').hidden;
    if (hadPlan) $('#results').hidden = true;
    if (btn) btn.disabled = true;
    setScan('Reading hardware…', 'busy');
    try {
      const hw = await desktop.getHardware();
      applyHardware(hw);
      const count = hw.summaryCount || 0;
      setScan('Scanned in ' + (hw.elapsedMs || 0) + ' ms · ' + count + ' device' + (count === 1 ? '' : 's') + ' found' + (hw.psuAvailable ? '' : ' · PSU needs manual entry'), 'ok');
    } catch (err) {
      setScan('Hardware scan failed. Enter parts below.', 'err');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function applyHardware(hw) {
    if (!hw) return;
    if (hw.cpu && hw.cpu.model) {
      $('#cpu-model').value = hw.cpu.model;
      validateCPU({ detected: true });
      if (hw.cpu.cores) $('#cpu-cores').value = hw.cpu.cores;
      if (hw.cpu.threads) $('#cpu-threads').value = hw.cpu.threads;
    }
    if (hw.gpu && hw.gpu.model) {
      $('#gpu-model').value = hw.gpu.model;
      validateGPU({ detected: true });
    }
    if (hw.ram) {
      if (hw.ram.totalGB) $('#ram-size').value = hw.ram.totalGB;
      if (hw.ram.gen) $('#ram-type').value = hw.ram.gen + (hw.ram.speed ? '-' + hw.ram.speed : '');
      if (hw.ram.slotsUsed) $('#ram-slots-used').value = hw.ram.slotsUsed;
      if (hw.ram.slotsTotal) $('#ram-slots-total').value = hw.ram.slotsTotal;
      validateRAM();
    }
    if (hw.storage && hw.storage.length) {
      state.drives = hw.storage.slice(0, MAX_DRIVES).map((d, i) => {
        const res = E.lookup('storage', d.model || '');
        const item = res.status === 'valid' ? res.item : null;
        return {
          model: d.model || '',
          capacityGB: Math.round(d.capacityGB || (item ? item.capacity : 0)),
          item,
          status: item ? 'valid' : d.model ? 'unknown' : 'partial'
        };
      });
      renderDrives();
    }
    if (hw.psu && hw.psu.wattage) {
      $('#psu-wattage').value = hw.psu.wattage;
      if (hw.psu.model) $('#psu-model').value = hw.psu.model;
      validatePSU();
    }
    validateRAM();
    updateAll();
  }

  function applyPriceData(priceData) {
    if (!priceData || !priceData.prices) return;
    const parts = D.cpus.concat(D.gpus, D.ramKits, D.storage, D.psus);
    parts.forEach((item) => {
      const price = priceData.prices[item.id];
      if (Number.isFinite(price)) {
        item.price = price;
        item.priceChecked = true;
      }
    });

    if (priceData.checked) {
      const date = new Date(priceData.checked + 'T12:00:00Z');
      D.meta.priceChecked = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
      D.meta.priceCheckedShort = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
      D.meta.updated = D.meta.priceChecked;
      D.meta.note = 'GPU, CPU and memory prices are checked Newegg listings for ' + D.meta.priceChecked + '. Storage and PSU figures are estimates. Prices change often, so open a listing before buying.';
    }
    if (priceData.source) {
      D.meta.priceSource = priceData.source;
      D.meta.priceSourceUrl = priceData.sourceUrl || '';
    }
    updateAll();
    if (!$('#results').hidden && canSearch()) {
      renderResults(E.recommend(buildSnapshot(), state.budget, state.profile));
    }
  }

  async function refreshDesktopPrices() {
    if (!desktop || !desktop.getPrices) return;
    try {
      const data = await desktop.getPrices();
      applyPriceData(data);
    } catch (error) {
      // Keep the bundled or cached snapshot if the refresh fails.
    }
  }

  // ------------------------------------------------------------------- init
  function initDesktop() {
    if (!desktop) return;
    document.body.classList.add('is-desktop');
    const mode = $('#mode-tag');
    if (mode) mode.textContent = 'desktop';
    // Root-relative links are meaningless inside the packaged app.
    $$('a[href^="/"]').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('//')) return;
      a.href = 'https://spencerboggs.github.io' + href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });
    const scanBtn = $('#scan-btn');
    if (scanBtn) scanBtn.addEventListener('click', scanHardware);
    scanHardware();
    refreshDesktopPrices();
  }

  function init() {
    const cpuCount = $('#cpu-count');
    const gpuCount = $('#gpu-count');
    if (cpuCount) cpuCount.textContent = D.cpus.length;
    if (gpuCount) gpuCount.textContent = D.gpus.length;

    // CPU
    const cpuInput = $('#cpu-model');
    attachCombo(cpuInput, 'cpu', (item) => {
      validateCPU({ pick: true });
      $('#cpu-cores').value = item.cores;
      $('#cpu-threads').value = item.threads;
      validateRAM();
    });
    cpuInput.addEventListener('input', () => { validateCPU(); });
    $('#cpu-cores').addEventListener('input', updateAll);
    $('#cpu-threads').addEventListener('input', updateAll);

    // GPU
    const gpuInput = $('#gpu-model');
    attachCombo(gpuInput, 'gpu', () => validateGPU({ pick: true }));
    gpuInput.addEventListener('input', () => validateGPU());
    $('#gpu-vendor').addEventListener('change', (e) => {
      state.gpu.vendor = e.target.value;
    });

    // RAM
    const ramType = $('#ram-type');
    attachCombo(ramType, 'ram', (kit) => {
      ramType.value = kit.gen + '-' + kit.speed;
      if (!$('#ram-size').value) $('#ram-size').value = kit.capacity;
      validateRAM();
    });
    $$('#ram-size, #ram-type, #ram-slots-used, #ram-slots-total').forEach((el) => {
      el.addEventListener('input', validateRAM);
    });

    // Storage
    state.drives = [{ model: '', capacityGB: 0, item: null, status: 'empty' }];
    renderDrives();
    $('#add-drive').addEventListener('click', () => {
      if (state.drives.length >= MAX_DRIVES) return;
      state.drives.push({ model: '', capacityGB: 0, item: null, status: 'empty' });
      renderDrives();
      const inputs = $$('#drive-list .drive-model');
      const last = inputs[inputs.length - 1];
      if (last) last.focus();
      updateAll();
    });

    // PSU
    const psuInput = $('#psu-model');
    attachCombo(psuInput, 'psu', () => validatePSU({ pick: true }));
    psuInput.addEventListener('input', () => validatePSU());
    $('#psu-wattage').addEventListener('input', () => validatePSU());

    // Budget
    const budgetInput = $('#budget');
    budgetInput.addEventListener('change', () => setBudget(budgetInput.value));
    budgetInput.addEventListener('blur', () => setBudget(budgetInput.value));
    budgetInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { setBudget(budgetInput.value); budgetInput.blur(); }
    });
    $('#budget-slider').addEventListener('input', (e) => setBudget(e.target.value));
    $$('.preset').forEach((btn) => {
      btn.addEventListener('click', () => setBudget(btn.dataset.budget));
    });

    // Priority
    $$('input[name="profile"]').forEach((radio) => {
      const profile = D.profiles[radio.value];
      const label = radio.closest('label');
      const note = label && label.querySelector('.choice-note');
      if (profile && note) note.textContent = profile.detail || profile.desc;
      radio.addEventListener('change', () => {
        if (!radio.checked) return;
        state.profile = radio.value;
        updateReadout();
        updateReadiness();
      });
    });

    $('#find-btn').addEventListener('click', runSearch);

    // Initial pass
    validatePSU();
    validateRAM();
    setBudget(1000);
    updateReadiness();
    updateReadout();
    initDesktop();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.PCAdvisor = { state, scanHardware, applyHardware };
})();
