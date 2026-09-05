/**
 * Navegação.
 *
 * Três comportamentos, todos com uma razão de existir:
 *  1. cápsula sólida depois do hero  → legibilidade sobre o papel;
 *  2. esconder ao descer / mostrar ao subir → devolve altura de
 *     tela na leitura sem tirar o acesso ao CTA;
 *  3. menu em tela cheia no mobile, com foco preso dentro dele.
 */

const HIDE_AFTER = 220; // px rolados antes de começar a esconder

export function initNav() {
  const nav = document.querySelector('[data-nav]');
  const menu = document.querySelector('[data-menu]');
  const burger = document.querySelector('[data-burger]');
  if (!nav) return;

  // Declarado aqui em cima porque o handler de scroll consulta o
  // estado do menu — e o scroll roda antes de o menu ser ligado.
  const isOpen = () => menu?.dataset.open === 'true';

  /* ---- 1 e 2: estado da barra conforme o scroll ---- */
  let last = window.scrollY;
  let ticking = false;

  const update = () => {
    const y = window.scrollY;
    nav.classList.toggle('nav--stuck', y > window.innerHeight * 0.72);

    const goingDown = y > last && y > HIDE_AFTER;
    // Com o menu aberto a barra nunca some: o botão de fechar
    // mora nela.
    nav.classList.toggle('nav--hidden', goingDown && !isOpen());
    last = y;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });

  update();

  /* ---- 3: menu em tela cheia ---- */
  if (!menu || !burger) return;

  const setOpen = (open) => {
    menu.dataset.open = String(open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-locked', open);
    document.documentElement.classList.toggle('is-menu-open', open);
    if (open) {
      nav.classList.remove('nav--hidden');
      menu.querySelector('a')?.focus({ preventScroll: true });
    } else {
      burger.focus({ preventScroll: true });
    }
  };

  burger.addEventListener('click', () => setOpen(!isOpen()));

  // O X dentro do menu. Existe porque o overlay cobre a barra de
  // navegação, e sem ele só restavam Esc ou clicar num link para sair.
  const fechar = menu.querySelector('[data-menu-close]');
  if (fechar) fechar.addEventListener('click', () => setOpen(false));

  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) setOpen(false);
    if (e.key !== 'Tab' || !isOpen()) return;

    // Prende o Tab dentro do menu enquanto ele está aberto — sem
    // isso o foco continua andando pela página escondida atrás.
    const focusables = [
      burger,
      ...menu.querySelectorAll('a[href], button:not([disabled])'),
    ];
    const first = focusables[0];
    const lastEl = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      lastEl.focus();
    } else if (!e.shiftKey && document.activeElement === lastEl) {
      e.preventDefault();
      first.focus();
    }
  });

  // Voltar ao desktop com o menu aberto deixaria o body travado.
  window.matchMedia('(min-width: 1101px)').addEventListener('change', (e) => {
    if (e.matches && isOpen()) setOpen(false);
  });
}
