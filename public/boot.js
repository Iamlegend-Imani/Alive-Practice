(() => {
  let preferences = {};
  try { preferences = JSON.parse(localStorage.getItem('alive-practice.preferences.v1')) || {}; } catch { /* Use system defaults when storage is unavailable. */ }
  const choice = ['light', 'dark', 'system'].includes(preferences.theme) ? preferences.theme : 'system';
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = choice === 'system' ? (dark ? 'dark' : 'light') : choice;
  document.documentElement.dataset.atmosphere = ['grounded', 'dawn', 'dusk'].includes(preferences.atmosphere) ? preferences.atmosphere : 'grounded';
  document.documentElement.dataset.motion = preferences.motion === false || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'off' : 'on';
})();
