/**
 * Accordion.
 *
 * Um item aberto por vez. A altura é animada pelo CSS
 * (grid-template-rows: 0fr → 1fr); aqui só cuidamos do estado e
 * dos atributos ARIA, para que quem usa leitor de tela ouça que
 * a pergunta expandiu.
 */

export function initAccordion(root = document) {
  const accordions = [...root.querySelectorAll('[data-accordion]')];

  accordions.forEach((acc) => {
    const items = [...acc.querySelectorAll('[data-acc-item]')];

    items.forEach((item) => {
      const trigger = item.querySelector('[data-acc-trigger]');
      const panel = item.querySelector('[data-acc-panel]');
      if (!trigger || !panel) return;

      trigger.addEventListener('click', () => {
        const willOpen = item.dataset.open !== 'true';

        items.forEach((other) => {
          const otherTrigger = other.querySelector('[data-acc-trigger]');
          const otherPanel = other.querySelector('[data-acc-panel]');
          const open = other === item && willOpen;
          other.dataset.open = String(open);
          otherTrigger?.setAttribute('aria-expanded', String(open));
          otherPanel?.toggleAttribute('inert', !open);
        });
      });
    });
  });
}
