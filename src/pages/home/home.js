/**
 * Comportamento exclusivo da home.
 *
 * Tudo que é reutilizável (nav, cursor, reveal, marquee, accordion)
 * mora em src/js/components. Aqui ficam só as peças que existem
 * nesta página e em nenhuma outra.
 */

import { clamp, prefersReducedMotion } from '../../js/utils/motion.js';
import { getScroll } from '../../js/libs/gsap-setup.js';

/* -------------------------------------------------------------
   JORNADA — a seção prende e os cards passam um a um

   Mecanismo tirado do site de referência, sem timeline nenhuma:

     1. cada etapa mora numa tela de 100vh, em fluxo normal;
     2. cada uma dessas telas é presa no topo (pin) desde o próprio
        topo até a ÚLTIMA tela chegar ao topo, com pinSpacing: false;
     3. o card que ficou preso tomba para trás enquanto a tela
        seguinte sobe.

   O detalhe que faz tudo funcionar é o pinSpacing: false. Como o pin
   não acrescenta espaço, a altura do documento continua sendo
   5 x 100vh — e é a rolagem natural dessas cinco telas que empilha
   os cards. A tela presa fica parada, a de baixo continua subindo e
   passa por cima dela. Nada é interpolado: o movimento é 1:1 com o
   dedo ou a roda.
   ------------------------------------------------------------- */

/* Estado final da carta que tomba (os mesmos ângulos da referência). */
const OUT_ROTATE = 4;   // graus no plano da tela
const OUT_TILT = 34;    // graus de tombo para trás
const OUT_SCALE = 0.2;  // o quanto encolhe

function initJourney() {
  const section = document.querySelector('[data-journey]');
  if (!section) return;

  const cards = document.querySelector('[data-cards]');
  const wraps = [...section.querySelectorAll('[data-wrap]')];
  const bar = section.querySelector('[data-journey-progress]');
  const count = section.querySelector('[data-journey-count]');
  if (wraps.length < 2) return;

  const motor = getScroll();
  if (!motor) return;

  const { gsap, ScrollTrigger } = motor;
  const ultima = wraps[wraps.length - 1];
  const total = wraps.length;
  const pad = (n) => String(n).padStart(2, '0');

  // O tombo é enfeite; prender e trocar é estrutura. Por isso só o
  // tombo respeita prefers-reduced-motion — desligar o resto deixaria
  // a seção sem o comportamento que carrega o conteúdo.
  const comTombo = !prefersReducedMotion();

  // matchMedia do GSAP: monta em telas largas, desmonta sozinho ao
  // estreitar, e refaz as medidas na volta. Sem ele, girar o aparelho
  // deixaria pins presos em posições calculadas para outra largura.
  const mm = gsap.matchMedia();

  mm.add('(min-width: 1001px)', () => {
    wraps.forEach((wrap, i) => {
      // 1. cada tela fica presa no topo até a última chegar lá
      ScrollTrigger.create({
        trigger: wrap,
        start: 'top top',
        endTrigger: ultima,
        end: 'top top',
        pin: true,
        pinSpacing: false,
        invalidateOnRefresh: true,
      });

      // 2. o card tomba enquanto a tela seguinte sobe por cima
      if (i === total - 1 || !comTombo) return;

      const card = wrap.querySelector('[data-card]');
      ScrollTrigger.create({
        trigger: wraps[i + 1],
        start: 'top bottom',
        end: 'top top',
        scrub: 0.5,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const t = self.progress;
          gsap.set(card, {
            rotate: OUT_ROTATE * t,
            rotateX: OUT_TILT * t,
            scale: 1 - OUT_SCALE * t,
          });
        },
      });
    });

    // 3. contador e barra, lendo o mesmo curso das telas presas
    const medidor = ScrollTrigger.create({
      trigger: cards,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        if (bar) bar.style.setProperty('--p', String(self.progress));
        if (!count) return;
        const atual = Math.min(total, Math.round(self.progress * (total - 1)) + 1);
        count.textContent = pad(atual) + ' / ' + pad(total);
      },
    });

    // Ao sair da faixa larga o matchMedia limpa tudo, inclusive as
    // transformações que o scrub deixou escritas no style dos cards.
    return () => {
      medidor.kill();
      gsap.set(wraps.map((w) => w.querySelector('[data-card]')), { clearProps: 'transform' });
    };
  });
}

/* -------------------------------------------------------------
   CONDIÇÕES — alternador Clínica / Cirúrgica
   Padrão de tabs da WAI-ARIA: setas navegam, Home/End vão às
   pontas, e o painel escondido usa [hidden] de verdade, para não
   ficar um bloco invisível roubando clique e leitura de tela.
   ------------------------------------------------------------- */
function initConditions() {
  const root = document.querySelector('[data-conditions]');
  if (!root) return;

  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panels = [...root.querySelectorAll('[role="tabpanel"]')];
  const pill = root.querySelector('[data-toggle-pill]');
  if (!tabs.length) return;

  const movePill = (tab) => {
    if (!pill) return;
    pill.style.setProperty('--pill-w', tab.offsetWidth + 'px');
    pill.style.setProperty('--pill-x', (tab.offsetLeft - tabs[0].offsetLeft) + 'px');
  };

  const select = (index, focus = true) => {
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on) {
        movePill(tab);
        if (focus) tab.focus();
      }
    });
    panels.forEach((panel, i) => { panel.hidden = i !== index; });
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i, false));
    tab.addEventListener('keydown', (e) => {
      const map = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
      const next = map[e.key];
      if (next === undefined) return;
      e.preventDefault();
      select((next + tabs.length) % tabs.length);
    });
  });

  select(0, false);

  // A pílula é posicionada em pixels, então precisa ser recalculada
  // quando a largura do rótulo muda (fonte carregada, resize).
  const reposition = () => {
    const active = tabs.find((t) => t.getAttribute('aria-selected') === 'true');
    if (active) movePill(active);
  };
  window.addEventListener('resize', reposition);
  if (document.fonts) document.fonts.ready.then(reposition);
}

/* -------------------------------------------------------------
   ABCDE — autoexame guiado
   Conta quantos critérios foram marcados e devolve UMA orientação,
   em três níveis. Nunca um diagnóstico: o texto de cada nível fala
   de conduta ("vale marcar", "procure"), nunca de doença.
   ------------------------------------------------------------- */
const ABCDE_LEVELS = [
  {
    max: 0,
    level: 1,
    title: 'Nenhum sinal de alerta marcado.',
    text: 'Siga com o autoexame mensal e mantenha a avaliação dermatológica de rotina. Pintas mudam com o tempo — o que vale é comparar a mesma lesão ao longo dos meses.',
  },
  {
    max: 2,
    level: 2,
    title: 'Vale marcar uma avaliação.',
    text: 'Um ou dois critérios não significam doença, mas indicam uma lesão que merece ser olhada de perto. Na consulta, a dermatoscopia mostra estruturas que o olho desarmado não alcança.',
  },
  {
    max: 5,
    level: 3,
    title: 'Procure avaliação com brevidade.',
    text: 'Três ou mais critérios na mesma lesão pedem exame presencial sem esperar. No câncer de pele, o diagnóstico precoce é o que muda o desfecho.',
  },
];

function initAbcde() {
  const root = document.querySelector('[data-abcde]');
  if (!root) return;

  const inputs = [...root.querySelectorAll('input[type="checkbox"]')];
  const result = root.querySelector('[data-abcde-result]');
  const title = root.querySelector('[data-abcde-title]');
  const text = root.querySelector('[data-abcde-text]');
  const meter = [...root.querySelectorAll('[data-abcde-meter] i')];
  if (!inputs.length || !result) return;

  const update = () => {
    const score = inputs.filter((i) => i.checked).length;
    const match = ABCDE_LEVELS.find((l) => score <= l.max) || ABCDE_LEVELS[ABCDE_LEVELS.length - 1];

    result.dataset.level = String(match.level);
    if (title) title.textContent = match.title;
    if (text) text.textContent = match.text;
    meter.forEach((seg, i) => seg.classList.toggle('on', i < score));
  };

  inputs.forEach((input) => input.addEventListener('change', update));
  update();
}

/* -------------------------------------------------------------
   DEPOIMENTOS — a seção prende e as falas passam uma a uma

   Mesmo princípio da jornada: enquanto a seção está presa, a rolagem
   troca o depoimento em vez de mover a página. A diferença é que aqui
   a troca é discreta (um depoimento por fatia, sem meio-termo) —
   texto atravessando a tela pela metade não se lê.

   As setas continuam funcionando: em vez de mudar um índice por
   fora, elas rolam até a fatia correspondente. Assim existe uma
   fonte de verdade só, e a barra de rolagem nunca fica dessincronizada
   do que está na tela.
   ------------------------------------------------------------- */
function initVoices() {
  const root = document.querySelector('[data-voices]');
  if (!root) return;

  const slides = [...root.querySelectorAll('[data-voice]')];
  const prev = root.querySelector('[data-voice-prev]');
  const next = root.querySelector('[data-voice-next]');
  const counter = root.querySelector('[data-voice-count]');
  if (slides.length < 2) return;

  let index = 0;
  const pad = (n) => String(n).padStart(2, '0');

  const render = () => {
    slides.forEach((s, i) => {
      s.dataset.active = String(i === index);
      s.setAttribute('aria-hidden', String(i !== index));
    });
    if (counter) counter.textContent = pad(index + 1) + ' / ' + pad(slides.length);
  };

  const set = (i) => {
    const novo = Math.max(0, Math.min(slides.length - 1, i));
    if (novo === index) return;
    index = novo;
    render();
  };

  render();

  const motor = getScroll();

  /* ---- sem GSAP ou em tela estreita: carrossel comum ---- */
  const manual = () => {
    const go = (d) => set((index + d + slides.length) % slides.length);
    if (prev) prev.addEventListener('click', () => go(-1));
    if (next) next.addEventListener('click', () => go(1));
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    });
    let startX = null;
    root.addEventListener('pointerdown', (e) => { startX = e.clientX; });
    root.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1);
      startX = null;
    });
  };

  if (!motor) { manual(); return; }

  const { gsap, ScrollTrigger } = motor;
  const mm = gsap.matchMedia();

  mm.add('(min-width: 1001px)', () => {
    // Uma fatia de scroll por depoimento. 0.7 de tela por fatia é o
    // suficiente para a troca não parecer atropelada nem arrastada.
    const st = ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: () => '+=' + Math.round(slides.length * window.innerHeight * 0.7),
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        set(Math.floor(self.progress * slides.length));
      },
    });

    /** Rola até o meio da fatia do depoimento pedido. */
    const irPara = (i) => {
      const alvo = st.start + ((i + 0.5) / slides.length) * (st.end - st.start);
      if (motor.lenis) motor.lenis.scrollTo(alvo, { duration: 0.8 });
      else window.scrollTo({ top: alvo, behavior: 'smooth' });
    };

    const aoClicar = (d) => () => irPara(Math.max(0, Math.min(slides.length - 1, index + d)));
    const irAnterior = aoClicar(-1);
    const irProximo = aoClicar(1);
    const aoTeclar = (e) => {
      if (e.key === 'ArrowLeft') irAnterior();
      if (e.key === 'ArrowRight') irProximo();
    };

    if (prev) prev.addEventListener('click', irAnterior);
    if (next) next.addEventListener('click', irProximo);
    root.addEventListener('keydown', aoTeclar);

    return () => {
      st.kill();
      if (prev) prev.removeEventListener('click', irAnterior);
      if (next) next.removeEventListener('click', irProximo);
      root.removeEventListener('keydown', aoTeclar);
    };
  });

  mm.add('(max-width: 1000px)', () => { manual(); });
}

/* -------------------------------------------------------------
   PARALAXE do retrato
   Deslocamento pequeno e limitado (±4%). Paralaxe forte em foto de
   rosto distorce a percepção da pessoa; aqui ele serve só para a
   coluna fixa não parecer congelada.
   ------------------------------------------------------------- */
function initParallax() {
  const targets = [...document.querySelectorAll('[data-parallax]')];
  if (!targets.length || prefersReducedMotion()) return;

  let ticking = false;

  const update = () => {
    for (const el of targets) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
      const center = rect.top + rect.height / 2 - window.innerHeight / 2;
      const shift = clamp(center / window.innerHeight, -1, 1) * -4;
      el.style.transform = 'translate3d(0, ' + shift + '%, 0) scale(1.09)';
    }
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });

  update();
}

/* -------------------------------------------------------------
   BARRA DE CONTATO (mobile)
   Aparece depois do hero e some quando o rodapé — que já tem os
   mesmos botões — entra em cena. Dois CTAs idênticos na tela ao
   mesmo tempo é ruído.
   ------------------------------------------------------------- */
function initDock() {
  const dock = document.querySelector('[data-dock]');
  const footer = document.querySelector('[data-footer-cta]');
  if (!dock) return;

  let footerVisible = false;

  if (footer) {
    new IntersectionObserver(([entry]) => {
      footerVisible = entry.isIntersecting;
      update();
    }, { threshold: 0.15 }).observe(footer);
  }

  let ticking = false;
  function update() {
    const past = window.scrollY > window.innerHeight * 0.85;
    dock.dataset.show = String(past && !footerVisible);
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });

  update();
}

/** Contrato da skill de página: cada página exporta um init. */
export function initHome() {
  initJourney();
  initConditions();
  initAbcde();
  initVoices();
  initParallax();
  initDock();
}
