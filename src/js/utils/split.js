/**
 * Fatia texto em palavras mascaradas para a animação de entrada.
 *
 * Por que palavra e não linha: fatiar por linha exige medir onde o
 * navegador quebrou o texto e refazer tudo a cada redimensionamento,
 * e destrói qualquer <em>, <mark> ou <a> no meio da frase. Fatiando
 * palavra por palavra, a marcação original continua intacta e o
 * resultado sobrevive a qualquer largura de tela.
 */

const WORD = /(\s+)/;

function wrapTextNode(node) {
  const parts = node.textContent.split(WORD);
  const frag = document.createDocumentFragment();

  for (const part of parts) {
    if (part === '') continue;
    // Espaço em branco volta como está: envolvê-lo criaria uma
    // janela vazia que colapsa e come o espaço entre palavras.
    if (!part.trim()) {
      frag.appendChild(document.createTextNode(part));
      continue;
    }
    const outer = document.createElement('span');
    outer.className = 'w';
    const inner = document.createElement('span');
    inner.className = 'w__in';
    inner.textContent = part;
    outer.appendChild(inner);
    frag.appendChild(outer);
  }

  node.replaceWith(frag);
}

function walk(el) {
  // Cópia estática: vamos trocar nós enquanto percorremos.
  for (const node of [...el.childNodes]) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.trim()) wrapTextNode(node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.classList.contains('w')) continue; // já fatiado
      walk(node);
    }
  }
}

/**
 * @param {Element} el         elemento com [data-split]
 * @param {number}  step       atraso entre palavras, em segundos
 * @param {number}  maxDelay   teto do atraso, para frases longas não
 *                             levarem três segundos para aparecer
 */
export function splitWords(el, step = 0.028, maxDelay = 0.6) {
  if (el.dataset.splitDone === 'true') return;
  walk(el);
  el.dataset.splitDone = 'true';

  el.querySelectorAll('.w__in').forEach((inner, i) => {
    inner.style.transitionDelay = `${Math.min(i * step, maxDelay)}s`;
  });
}
