import { render } from 'preact';
import './styles.css';
import './styles-overlays.css';
import { App } from './app';
import { initInstallPrompt } from './lib/pwa';

initInstallPrompt();
render(<App />, document.getElementById('app') as HTMLElement);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  const isNative = Boolean(
    (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.(),
  );
  if (!isNative) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
        /* Offline support is optional; never block the app on it. */
      });
    });
  }
}
