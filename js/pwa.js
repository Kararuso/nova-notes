// Установка на главный экран и офлайн-режим.
export const isIosBrowser =
  /iPhone|iPad|iPod/.test(navigator.userAgent) && !navigator.standalone;

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
