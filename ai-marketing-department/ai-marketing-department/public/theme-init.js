// Theme initialization — runs before first paint to prevent flash
// Must stay synchronous and minimal
(function () {
  try {
    // Dark mode initialization
    var theme = localStorage.getItem('amd_theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }

    // Brand theme from localStorage (optional, for multi-brand support)
    var brandTheme = localStorage.getItem('amd-brand-theme');
    if (brandTheme) {
      document.documentElement.setAttribute('data-theme', brandTheme);
    }
  } catch (_e) {}
})();
