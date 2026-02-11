// Theme initialization — runs before first paint to prevent flash
// Must stay synchronous and minimal
(function () {
  try {
    var theme = localStorage.getItem('amd_theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch (_e) {}
})();
