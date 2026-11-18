'use strict';
(() => {
  let installPrompt = null;
  let installButton = null;

  const installed = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const ios = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = () => /Android/i.test(navigator.userAgent);

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    if (installButton && !installed()) installButton.hidden = false;
  });

  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    if (installButton) installButton.hidden = true;
    const help = document.getElementById('pwa-install-help');
    if (help) help.hidden = true;
  });

  function showInstructions() {
    let help = document.getElementById('pwa-install-help');
    if (!help) {
      help = document.createElement('aside');
      help.id = 'pwa-install-help';
      help.className = 'pwa-install-help';
      help.setAttribute('role', 'status');
      help.setAttribute('aria-live', 'polite');

      const heading = document.createElement('strong');
      heading.textContent = 'ESKA Takvim’i ana ekrana ekleyin';
      const steps = document.createElement('p');
      steps.textContent = ios()
        ? 'Safari’de Paylaş simgesine (kare içinden yukarı ok) dokunun, “Ana Ekrana Ekle” seçeneğini ve ardından “Ekle”yi seçin. Sunulursa “Web Uygulaması Olarak Aç” seçeneğini açık bırakın.'
        : 'Chrome’da sağ üstteki üç nokta menüsünü açın. “Uygulamayı yükle” veya “Ana ekrana ekle” seçeneğini seçin.';
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'pwa-install-close';
      close.textContent = 'Anladım';
      close.addEventListener('click', () => {
        help.hidden = true;
        installButton?.focus();
      });

      help.append(heading, steps, close);
      document.body.appendChild(help);
    }
    help.hidden = false;
  }

  function init() {
    if (installed() || (!android() && !ios())) return;

    const anchor = document.querySelector('.mast') || document.querySelector('main');
    if (!anchor) return;

    installButton = document.createElement('button');
    installButton.type = 'button';
    installButton.className = 'pwa-install-button';
    installButton.textContent = '📲 Uygulamayı yükle';
    installButton.addEventListener('click', async () => {
      if (!installPrompt) return showInstructions();
      const prompt = installPrompt;
      installPrompt = null;
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice.outcome !== 'accepted') showInstructions();
      } catch {
        showInstructions();
      }
    });
    anchor.appendChild(installButton);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once: true});
  else init();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', {scope: '/'}).catch(() => {});
    }, {once: true});
  }
})();
