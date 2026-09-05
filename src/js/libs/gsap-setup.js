/**
 * Motor de scroll: GSAP + ScrollTrigger + Lenis.
 *
 * Um lugar só decide se há animação de scroll na página e devolve as
 * referências prontas. Quem precisa de scroll-scrubbing importa daqui;
 * quem só precisa disparar uma classe CSS usa `onScrollEnter`.
 *
 * Três decisões que valem explicação:
 *
 *  - GSAP e ScrollTrigger vêm por CDN e são OPCIONAIS. Se não
 *    carregarem, `getScroll()` devolve null e cada peça cai no seu
 *    caminho simples (IntersectionObserver, marquee em CSS, cards
 *    empilhados como lista). Um site de consultório não pode ficar
 *    sem conteúdo porque um CDN caiu.
 *
 *  - O Lenis não roda o próprio requestAnimationFrame: quem o
 *    adianta é o ticker do GSAP. Dois loops de rAF disputando o mesmo
 *    scroll produzem tremor, e o ScrollTrigger precisa ser atualizado
 *    no mesmo quadro em que o Lenis move a página.
 *
 *  - Redimensionar recalcula com ScrollTrigger.refresh(), nunca
 *    recarregando a página. E só quando a LARGURA muda de verdade: no
 *    celular a barra de endereço subindo e descendo altera a altura o
 *    tempo todo, e refazer as medidas a cada pixel disso faria a
 *    página pular na mão de quem está lendo.
 *
 *  - prefers-reduced-motion NÃO desliga o motor. Quem respeita a
 *    preferência é cada animação: as entradas decorativas somem, mas
 *    o que é estrutural (a seção que prende e troca os cards) segue
 *    funcionando. Do contrário uma preferência de acessibilidade
 *    esconde conteúdo em vez de acalmar o movimento — e, no Windows,
 *    ela vem ligada com "Mostrar animações" desmarcado, sem a pessoa
 *    saber que pediu isso.
 */

import { createLenis } from './lenis-setup.js';

/** Largura mínima (px) de variação para valer um refresh. */
const RESIZE_LIMITE = 180;

let engine;

export function initScrollEngine() {
  if (engine !== undefined) return engine;

  const { gsap, ScrollTrigger } = window;
  const disponivel = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';

  if (!disponivel) {
    // Um aviso explícito: sem isso, um CDN bloqueado vira "o site não
    // anima" e ninguém descobre o porquê olhando a tela.
    console.warn('[scroll] GSAP/ScrollTrigger não carregaram. A página continua funcional, sem as animações de rolagem.');
    engine = null;
    return engine;
  }

  gsap.registerPlugin(ScrollTrigger);

  const lenis = createLenis();

  if (lenis) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    // O GSAP "compensa" quedas de quadro esticando o delta; num scroll
    // interpolado isso vira solavanco. Zero desliga a compensação.
    gsap.ticker.lagSmoothing(0);
  }

  // Remedir quando o layout muda de verdade. Fonte que chega depois
  // troca a altura de todo parágrafo; imagem preguiçosa que carrega
  // empurra tudo abaixo dela. Sem esses refreshes, os gatilhos ficam
  // apontando para posições que não existem mais — e a animação
  // "falha" sem erro nenhum no console.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });

  let largura = window.innerWidth;
  let debounce;
  window.addEventListener('resize', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      if (Math.abs(window.innerWidth - largura) < RESIZE_LIMITE) return;
      largura = window.innerWidth;
      ScrollTrigger.refresh();
    }, 240);
  });

  engine = { gsap, ScrollTrigger, lenis };
  return engine;
}

/** Referências do motor, ou null quando não há animação de scroll. */
export function getScroll() {
  return engine === undefined ? initScrollEngine() : engine;
}

/**
 * Liga e desliga um estado conforme o elemento entra e sai de cena.
 *
 * Bidirecional de propósito: a animação de entrada é montada quando o
 * elemento aparece e DESMONTADA quando ele sai — por cima ou por
 * baixo. Assim ela roda de novo toda vez que a pessoa volta, em vez
 * de disparar uma vez e a seção ficar morta no resto da sessão.
 *
 * Os quatro cantos importam:
 *   onEnter      desce e o elemento aparece      -> monta
 *   onLeave      desce e ele sai por cima        -> desmonta
 *   onEnterBack  sobe e ele reaparece            -> monta
 *   onLeaveBack  sobe e ele sai por baixo        -> desmonta
 *
 * Sem GSAP, o IntersectionObserver faz o mesmo — e sem unobserve,
 * que era o que tornava o gesto irrepetível.
 *
 * @param {Element}  el
 * @param {Function} montar
 * @param {Function} desmontar
 * @param {string}   start  posição de disparo, na sintaxe do ScrollTrigger
 */
export function onScrollToggle(el, montar, desmontar, start = 'top 84%') {
  const motor = getScroll();

  if (motor) {
    motor.ScrollTrigger.create({
      trigger: el,
      start,
      end: 'bottom top',
      invalidateOnRefresh: true,
      onEnter: () => montar(el),
      onEnterBack: () => montar(el),
      onLeave: () => desmontar(el),
      onLeaveBack: () => desmontar(el),
      // Recarregar no meio da página, ou uma âncora, deixa o elemento
      // já dentro da faixa sem nenhum evento ter disparado.
      onRefresh: (self) => (self.isActive ? montar(el) : desmontar(el)),
    });
    return;
  }

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) montar(entry.target);
      else desmontar(entry.target);
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

  io.observe(el);
}
