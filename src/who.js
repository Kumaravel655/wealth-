// "Who we work with": one card at a time, chosen from the buttons. Without this file the six cards
// stay a plain grid and the buttons stay hidden.
export function initWho() {
  const pick = document.querySelector('.who-pick');
  if (!pick) return;
  const list = document.querySelector('.ind-cards');
  const cards = [...list.children];
  const buttons = [...pick.querySelectorAll('button')];

  const show = (i) => {
    buttons.forEach((b, n) => b.setAttribute('aria-pressed', String(n === i)));
    cards.forEach((c, n) => { c.hidden = n !== i; });
  };

  buttons.forEach((b, i) => b.addEventListener('click', () => show(i)));
  list.classList.add('is-picker');
  list.setAttribute('aria-live', 'polite');
  pick.hidden = false;
  show(0);
}
