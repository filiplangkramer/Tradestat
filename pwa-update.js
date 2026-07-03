/* ═══════════════════════════════════════════════════════════════════
   PWA registrace + „nová verze" lišta — sdílené všemi třemi appkami.
   SW dělá network-first pro HTML, takže obsah je po deployi čerstvý;
   tahle lišta se ukáže jen když se změní samotný service worker.
   ═══════════════════════════════════════════════════════════════════ */
(function(){
  if (!('serviceWorker' in navigator)) return;

  // sw.js leží vždy vedle tohoto skriptu (root projektu), ať už
  // stránka běží v /, /tradestat/ nebo /shiftbook/
  var swUrl;
  try {
    swUrl = new URL('sw.js', document.currentScript.src).href;
  } catch (e) { return; }

  function showUpdateBar(onConfirm){
    if (document.getElementById('pwa-update-bar')) return;
    var bar = document.createElement('div');
    bar.id = 'pwa-update-bar';
    bar.style.cssText =
      'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);' +
      'z-index:100000;display:flex;align-items:center;gap:14px;' +
      'background:#1a1a1a;color:#fff;padding:12px 18px;border-radius:12px;' +
      'font-family:Inter,"Space Grotesk",system-ui,sans-serif;font-size:13px;' +
      'box-shadow:0 12px 36px rgba(0,0,0,0.35);max-width:calc(100vw - 32px);';
    bar.innerHTML =
      '<span>Je k dispozici nová verze aplikace.</span>' +
      '<button id="pwa-update-btn" style="background:#3f7a5a;color:#fff;border:none;' +
      'padding:7px 16px;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer;' +
      'font-family:inherit;white-space:nowrap;">Aktualizovat</button>';
    document.body.appendChild(bar);
    document.getElementById('pwa-update-btn').addEventListener('click', function(){
      bar.firstChild.textContent = 'Aktualizuji…';
      onConfirm();
    });
  }

  window.addEventListener('load', function(){
    navigator.serviceWorker.register(swUrl).then(function(reg){
      // nový SW čeká už teď (např. po delší době offline)
      if (reg.waiting && navigator.serviceWorker.controller){
        showUpdateBar(function(){ reg.waiting.postMessage({type:'SKIP_WAITING'}); });
      }
      reg.addEventListener('updatefound', function(){
        var nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', function(){
          if (nw.state === 'installed' && navigator.serviceWorker.controller){
            showUpdateBar(function(){ nw.postMessage({type:'SKIP_WAITING'}); });
          }
        });
      });
    }).catch(function(e){ console.warn('[PWA] registrace selhala:', e); });

    // po převzetí novým SW obnovit stránku (jen při update, ne první instalaci)
    var hadController = !!navigator.serviceWorker.controller;
    var refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', function(){
      if (!hadController || refreshing) return;
      refreshing = true;
      location.reload();
    });
  });
})();
