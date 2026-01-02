// Jednoducha utilita pro pridani tooltipu k libovolnemu elementu
// Dynamicky pocita pozici kurzoru a zabranuje pretecení mimo obrazovku

export function createAddTooltip(targetElement, text) {
  if (!targetElement || !text) return;

  const tooltip = document.createElement("div");
  tooltip.className = "tooltip-box";
  tooltip.textContent = text;
  document.body.appendChild(tooltip);

  targetElement.addEventListener("mouseenter", () => {
    tooltip.style.opacity = 1;
  });

  targetElement.addEventListener("mousemove", e => {
    const offset = 12;
    const tooltipWidth = tooltip.offsetWidth;
    const pageWidth = window.innerWidth;

    // Detekce: zobrazit vlevo nebo vpravo
    const showLeft = e.pageX + tooltipWidth + offset > pageWidth;

    tooltip.style.left = showLeft
      ? e.pageX - tooltipWidth - offset + "px"
      : e.pageX + offset + "px";

    tooltip.style.top = e.pageY + offset + "px";
  });

  targetElement.addEventListener("mouseleave", () => {
    tooltip.style.opacity = 0;
  });
}
