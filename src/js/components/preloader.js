/**
 * Preloader.
 *
 * Acompanha o carregamento real das imagens marcadas com
 * [data-preload] — nada de temporizador fingindo progresso. Em
 * conexão rápida a cortina sai quase imediatamente; em conexão
 * ruim ela segura a página até a primeira tela estar pronta.
 * Uma trava de 6 s impede que um asset travado prenda o site.
 */

const MAX_WAIT = 6000;

export function initPreloader(onDone = () => {}) {
  const loader = document.querySelector('[data-loader]');
  if (!loader) {
    onDone();
    return;
  }

  const bar = loader.querySelector('[data-loader-bar]');
  const count = loader.querySelector('[data-loader-count]');
  const images = [...document.querySelectorAll('img[data-preload]')];

  document.body.classList.add('is-locked');

  let loaded = 0;
  const total = images.length || 1;

  const paint = () => {
    const pct = Math.round((loaded / total) * 100);
    if (bar) bar.style.transform = `scaleX(${loaded / total})`;
    if (count) count.textContent = String(pct).padStart(3, '0');
  };

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    loaded = total;
    paint();

    // Um respiro curto para a barra chegar visualmente a 100%
    // antes da cortina subir.
    setTimeout(() => {
      loader.dataset.done = 'true';
      document.body.classList.remove('is-locked');
      document.documentElement.classList.add('is-ready');
      onDone();
      // Depois da transição a cortina sai do caminho de vez —
      // um elemento fixo em tela inteira, mesmo transparente, é
      // um candidato a roubar clique.
      setTimeout(() => { loader.style.visibility = 'hidden'; }, 1100);
    }, 260);
  };

  const bump = () => {
    loaded += 1;
    paint();
    if (loaded >= total) finish();
  };

  paint();

  if (!images.length) {
    finish();
  } else {
    images.forEach((img) => {
      if (img.complete && img.naturalWidth) bump();
      else {
        img.addEventListener('load', bump, { once: true });
        img.addEventListener('error', bump, { once: true });
      }
    });
  }

  setTimeout(finish, MAX_WAIT);
}
