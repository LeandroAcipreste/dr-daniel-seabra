/**
 * Reveal — os gestos de entrada do site.
 *
 * A animação é toda CSS: transições declaradas em
 * components/reveal.css, ligadas pela classe `.is-in`. O GSAP entra só
 * como gatilho, via ScrollTrigger. Timing e easing ficam onde um
 * designer consegue ajustar sem abrir o JS, e o navegador anima em
 * compositor sem passar por JS a cada quadro.
 *
 * O gesto é REPETÍVEL. Cada elemento monta ao entrar em cena e
 * desmonta ao sair — por cima ou por baixo — então ele anima de novo
 * toda vez que a pessoa volta àquele trecho. Antes era `once: true`:
 * a primeira passagem gastava a animação e a seção ficava morta no
 * resto da sessão.
 */

import { prefersReducedMotion } from '../utils/motion.js';
import { splitWords } from '../utils/split.js';
import { onScrollToggle } from '../libs/gsap-setup.js';

const SELECTOR = '[data-reveal], [data-split], [data-clip], [data-rise]';

export function initReveal(root = document) {
  const targets = [...root.querySelectorAll(SELECTOR)];
  if (!targets.length) return;

  const montar = (el) => el.classList.add('is-in');
  const desmontar = (el) => el.classList.remove('is-in');

  // Preferência de movimento reduzido (hoje desligada em
  // utils/motion.js): tudo nasce no estado final, sem gatilho nenhum.
  if (prefersReducedMotion()) {
    targets.forEach(montar);
    return;
  }

  for (const el of targets) {
    if (el.hasAttribute('data-split')) splitWords(el);

    onScrollToggle(el, montar, desmontar, el.dataset.start || 'top 84%');

    // O que já está na primeira dobra entra assim que a cortina sai.
    // Deixar isso para o gatilho significaria uma faixa morta no
    // rodapé do hero, logo abaixo do limiar dele.
    if (el.getBoundingClientRect().top < window.innerHeight) montar(el);
  }
}
