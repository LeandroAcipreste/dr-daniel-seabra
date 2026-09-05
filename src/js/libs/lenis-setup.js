/**
 * Smooth scroll (Lenis).
 *
 * Carregado por CDN e opcional de propósito: se o script não vier, a
 * página rola nativamente e nada quebra. Um site de consultório não
 * pode depender de terceiro para funcionar.
 *
 * Desligado quando a pessoa pediu menos movimento, e em toque — onde
 * o scroll nativo do sistema já é melhor do que qualquer interpolação
 * em JS.
 *
 * Quem avança o Lenis a cada quadro é o ticker do GSAP (ver
 * gsap-setup.js), não um rAF próprio: dois laços disputando o mesmo
 * scroll produzem tremor. Sem GSAP na página, o laço interno é ligado
 * aqui mesmo.
 */

import { prefersReducedMotion } from '../utils/motion.js';

export function createLenis() {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (prefersReducedMotion() || coarse || typeof window.Lenis !== 'function') {
    return null;
  }

  const lenis = new window.Lenis({
    duration: 1.05,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.9,
  });

  // Âncoras internas passam pelo Lenis para não haver dois scrolls
  // competindo (o nativo instantâneo e o suave).
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -80 });
  });

  if (typeof window.gsap === 'undefined') {
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  return lenis;
}
