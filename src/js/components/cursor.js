/**
 * Cursor customizado.
 *
 * Só liga em ponteiro fino (mouse/trackpad). Em toque ele não
 * existe, e em teclado ele não atrapalha: o anel é
 * pointer-events:none e o foco continua sendo desenhado pelo
 * :focus-visible do reset.
 *
 * O anel persegue o ponteiro com interpolação — o atraso é o que
 * dá a sensação de peso. Sem ele, é só um segundo cursor.
 */

import { lerp, prefersReducedMotion } from '../utils/motion.js';

export function initCursor() {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!fine || prefersReducedMotion()) return;

  const cursor = document.querySelector('[data-cursor-root]');
  if (!cursor) return;

  const label = cursor.querySelector('[data-cursor-label]');
  document.documentElement.classList.add('has-cursor');

  let tx = window.innerWidth / 2;
  let ty = window.innerHeight / 2;
  let cx = tx;
  let cy = ty;
  let active = false;

  window.addEventListener('mousemove', (e) => {
    tx = e.clientX;
    ty = e.clientY;
    if (!active) {
      active = true;
      cx = tx; cy = ty; // primeiro quadro sem voo desde o canto
      cursor.dataset.state = '';
      requestAnimationFrame(loop);
    }
  }, { passive: true });

  function loop() {
    cx = lerp(cx, tx, 0.18);
    cy = lerp(cy, ty, 0.18);
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(loop);
  }

  // Qualquer coisa clicável engorda o anel; [data-cursor] troca o
  // rótulo por um verbo ("agendar", "ver", "arrastar").
  const hoverables = 'a, button, [data-cursor], input, label';

  document.addEventListener('mouseover', (e) => {
    const hit = e.target.closest(hoverables);
    if (!hit) return;
    cursor.dataset.state = 'hover';
    if (label) label.textContent = hit.dataset.cursor || '';
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverables) && !e.relatedTarget?.closest(hoverables)) {
      cursor.dataset.state = '';
      if (label) label.textContent = '';
    }
  });

  document.addEventListener('mouseleave', () => { cursor.dataset.state = 'hidden'; });
  document.addEventListener('mouseenter', () => { cursor.dataset.state = ''; });
}
