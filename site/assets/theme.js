/* PC Upgrade Advisor theme persistence. */
(function () {
  var palettes = {
    dark: {
      bg: '#0f141c',
      bgElevated: '#161d28',
      surface: '#1f2836',
      text: '#e6edf5',
      muted: '#8fa0b5',
      accent: '#5b8fd4',
      accentDim: '#3f6eaa',
      line: '#2a3444',
      wash: 'rgba(91, 143, 212, 0.14)'
    },
    light: {
      bg: '#f4efe4',
      bgElevated: '#ebe3d4',
      surface: '#e0d5c2',
      text: '#241f1a',
      muted: '#6f6458',
      accent: '#b85c38',
      accentDim: '#8f4529',
      line: '#d2c4ae',
      wash: 'rgba(184, 92, 56, 0.14)'
    }
  };
  var KEY = 'pc-advisor-theme';

  function read() {
    try {
      var v = localStorage.getItem(KEY);
      return v === 'light' ? 'light' : 'dark';
    } catch (e) {
      return 'dark';
    }
  }

  function apply(mode) {
    var c = palettes[mode] || palettes.dark;
    var root = document.documentElement;
    root.dataset.themeMode = mode;
    root.style.setProperty('--color-bg', c.bg);
    root.style.setProperty('--color-bg-elevated', c.bgElevated);
    root.style.setProperty('--color-surface', c.surface);
    root.style.setProperty('--color-text', c.text);
    root.style.setProperty('--color-muted', c.muted);
    root.style.setProperty('--color-accent', c.accent);
    root.style.setProperty('--color-accent-dim', c.accentDim);
    root.style.setProperty('--color-line', c.line);
    root.style.setProperty('--color-wash', c.wash);
    root.style.colorScheme = mode;
    document.querySelectorAll('[data-theme-icon]').forEach(function (el) {
      el.hidden = el.dataset.themeIcon !== (mode === 'dark' ? 'sun' : 'moon');
    });
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.setAttribute('aria-label', mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }

  window.PCTheme = {
    get: read,
    set: function (mode) {
      try { localStorage.setItem(KEY, mode); } catch (e) {}
      apply(mode);
    },
    toggle: function () {
      window.PCTheme.set(read() === 'dark' ? 'light' : 'dark');
    }
  };

  apply(read());

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', function () { window.PCTheme.toggle(); });
    apply(read());
  });
})();
