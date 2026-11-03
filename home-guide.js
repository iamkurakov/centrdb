(() => {
  const frame = document.getElementById('system-guide-frame');
  if (!frame) return;
  let observer;
  let pending = false;
  function prepare() {
    try {
      const doc = frame.contentDocument;
      const sheet = doc && doc.querySelector('.sheet');
      if (!sheet) return;
      observer?.disconnect();
      if (!doc.getElementById('home-embed-style')) {
        const style = doc.createElement('style');
        style.id = 'home-embed-style';
        style.textContent = 'html,body{margin:0;background:transparent;overflow:hidden}.toolbar{display:none!important}.sheet{margin:0;max-width:none;box-shadow:none}';
        doc.head.appendChild(style);
      }
      function fit() {
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
          pending = false;
          const height = Math.ceil(sheet.getBoundingClientRect().height) + 3;
          if (height > 0 && frame.style.height !== height + 'px') frame.style.height = height + 'px';
        });
      }
      fit();
      doc.fonts?.ready.then(fit);
      if ('ResizeObserver' in window) {
        observer = new ResizeObserver(fit);
        observer.observe(sheet);
      }
      window.addEventListener('resize', fit, {passive:true});
    } catch {
      // The separate-page link remains available if embedding is unavailable.
    }
  }
  frame.addEventListener('load', prepare);
  if (frame.contentDocument?.readyState === 'complete') prepare();
})();
