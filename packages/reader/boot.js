// Inline this in <head> (before first paint) so the saved theme never flashes. ~400 bytes.
try {
  var p = JSON.parse(localStorage.getItem('legible.prefs.v1') || '{}');
  var dark = matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', p.theme && p.theme !== 'system' ? p.theme : (dark ? 'dark' : 'light'));
} catch (e) {}
