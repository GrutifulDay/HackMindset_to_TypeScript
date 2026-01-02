import { DEV_MODE } from "../config.js";

/**
 * 🔧 Přehled logovací logiky (frontend verze):
 * - DEV_MODE=true → loguje vždy (všechny úrovně)
 * - DEV_MODE=false + URL obsahuje "localhost" → loguje jen INFO, WARN, ERROR
 * - DEV_MODE=false + URL neobsahuje "localhost" → loguje pouze WARN a ERROR
 */

const NODE_ENV = location.hostname.includes("localhost")
  ? "development"
  : "production";

// 🎨 Stylování výpisů v konzoli
const styles = {
  debug: "color:#B980FF; font-weight:bold;",
  info: "color:#00AEEF; font-weight:bold;",
  warn: "color:#E7B416; font-weight:bold;",
  error: "color:#FF4F4F; font-weight:bold;",
  valueTrue: "color:#FFD700",
  valueFalse: "color:#FF6666",
  valueNull: "color:#999",
};

// 🎨 Pomocná funkce pro zvýraznění hodnot
function colorizeValue(val) {
  if (val === true) return ["%ctrue", styles.valueTrue];
  if (val === false) return ["%cfalse", styles.valueFalse];
  if (val === null) return ["%cnull", styles.valueNull];
  return [val, ""];
}

// 🧩 Helper pro formátování argumentů
function formatArgs(args) {
  const formatted = [];
  args.forEach((arg) => {
    if (typeof arg === "object") {
      try {
        formatted.push(JSON.stringify(arg, null, 2));
      } catch {
        formatted.push(String(arg));
      }
    } else {
      const [val, style] = colorizeValue(arg);
      formatted.push(val, style);
    }
  });
  return formatted;
}

// 🧠 Debug – loguje jen pokud je DEV_MODE=true
export function debug(...args) {
  if (DEV_MODE === true) {
    console.log(`%c[DEBUG]`, styles.debug, ...formatArgs(args));
  }
}

// ℹ️ Info – loguje mimo produkci, nebo pokud je DEV_MODE=true
export function info(...args) {
  if (DEV_MODE === true || NODE_ENV !== "production") {
    console.log(`%c[INFO]`, styles.info, ...formatArgs(args));
  }
}

// ⚠️ Warning – loguje vždy
export function warn(...args) {
  console.warn(`%c[WARN]`, styles.warn, ...formatArgs(args));
}

// 💥 Error – loguje vždy
export function error(...args) {
  console.error(`%c[ERROR]`, styles.error, ...formatArgs(args));
}
