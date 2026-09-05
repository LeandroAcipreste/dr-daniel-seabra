/**
 * Utilidades de movimento.
 *
 * Uma única fonte de verdade para "esta pessoa quer animação?".
 * O CSS já responde a prefers-reduced-motion, mas o JS precisa da
 * mesma resposta para NÃO montar timelines de scroll — animação
 * desligada no CSS e ligada no JS é o jeito mais rápido de fazer
 * a página tremer sem ninguém entender por quê.
 */

const query = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Se o site desliga as animações quando o sistema pede menos movimento.
 *
 * Está FALSE por decisão do cliente. O motivo prático: no Windows,
 * "Mostrar animações no Windows" desmarcado (Facilidade de Acesso →
 * Exibição) já liga essa preferência, e a maioria das pessoas nem sabe
 * que pediu isso. Com true, o site chegava completamente parado para
 * elas — e o movimento aqui É a apresentação do consultório.
 *
 * O que isso custa: quem realmente pediu menos movimento por
 * desconforto vestibular vai ver as animações mesmo assim. Nenhuma
 * delas é piscante, de alto contraste ou de amplitude grande, mas a
 * escolha é essa e está registrada.
 *
 * Para voltar ao comportamento padrão da web, basta trocar para true:
 * todo o resto do código já lê daqui.
 */
const RESPEITAR_MOVIMENTO_REDUZIDO = false;

export const prefersReducedMotion = () =>
  RESPEITAR_MOVIMENTO_REDUZIDO && query.matches;

/** Executa `fn` agora e sempre que a preferência mudar. */
export function onMotionChange(fn) {
  fn(query.matches);
  query.addEventListener('change', (e) => fn(e.matches));
}

export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export const lerp = (a, b, t) => a + (b - a) * t;

/** Agrupa leituras de scroll num único rAF por quadro. */
export function rafLoop(fn) {
  let running = false;
  let frame = 0;
  const tick = () => {
    fn();
    frame = requestAnimationFrame(tick);
  };
  return {
    start() {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(frame);
    },
  };
}
