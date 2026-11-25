"use client";

/** the cart button in the header */
const cartButton = () => document.querySelector<HTMLElement>("[data-cart-toggle]");

const BAG_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><path d="M4.5 8h15l-1 12a1.5 1.5 0 0 1-1.5 1.4H7a1.5 1.5 0 0 1-1.5-1.4Z"/><path d="M8.5 10.5V7a3.5 3.5 0 0 1 7 0v3.5"/></svg>';

/** the cart button pops (something just landed in it) */
export function bumpCart() {
  cartButton()?.animate?.([{ transform: "scale(1)" }, { transform: "scale(1.28)" }, { transform: "scale(.94)" }, { transform: "scale(1)" }], {
    duration: 420,
    easing: "ease-out",
  });
}

/**
 * Add-to-cart effect: the pressed button shrinks into a brown bubble with a bag that arcs into the header cart,
 * then the cart pops. With "reduce motion" the flight is shorter and straight.
 */
export function flyToCart(el: HTMLElement | null | undefined) {
  const target = cartButton();
  if (!el || !target || !document.body.animate) return bumpCart();
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const r = el.getBoundingClientRect();
  const q = target.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const tx = q.left + q.width / 2;
  const ty = q.top + q.height / 2;
  const mx = cx + (tx - cx) * 0.55;
  const my = calm ? cy + (ty - cy) * 0.55 : Math.min(cy, ty) + (cy - ty) * 0.35 - 80;
  const box = (x: number, y: number, w: number, h: number) => ({ left: `${x - w / 2}px`, top: `${y - h / 2}px`, width: `${w}px`, height: `${h}px` });

  const bubble = document.createElement("div");
  bubble.setAttribute("aria-hidden", "true");
  bubble.innerHTML = BAG_SVG;
  Object.assign(bubble.style, {
    position: "fixed",
    zIndex: "90",
    pointerEvents: "none",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    background: "linear-gradient(180deg, var(--color-brown-2), var(--color-brown))",
    color: "#fff",
    boxShadow: "0 8px 20px rgba(58,33,23,.35)",
    ...box(cx, cy, r.width, r.height),
  });
  document.body.append(bubble);

  el.animate([{ transform: "scale(1)" }, { transform: "scale(.92)" }, { transform: "scale(1)" }], { duration: 280 });
  const flight = bubble.animate(
    [
      { ...box(cx, cy, r.width, r.height), borderRadius: getComputedStyle(el).borderRadius, opacity: 1, offset: 0 },
      { ...box(cx, cy, 48, 48), borderRadius: "50%", opacity: 1, offset: 0.3 },
      { ...box(mx, my, 40, 40), borderRadius: "50%", opacity: 1, offset: 0.65 },
      { ...box(tx, ty, 14, 14), borderRadius: "50%", opacity: 0.5, offset: 1 },
    ],
    { duration: calm ? 550 : 850, easing: "cubic-bezier(.45,0,.35,1)", fill: "forwards" },
  );
  flight.onfinish = flight.oncancel = () => {
    bubble.remove();
    bumpCart();
  };
}
