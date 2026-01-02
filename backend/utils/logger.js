import chalk from "chalk";
import util from "util";
import { DEBUG, NODE_ENV } from "../config.js";

/**
 * 🔧 Přehled logovací logiky:
 * - DEBUG=true → loguje vždy (bez ohledu na NODE_ENV)
 * - DEBUG=false + NODE_ENV=development → loguje jen INFO, WARN, ERROR
 * - NODE_ENV=production + DEBUG=false → loguje pouze WARN a ERROR
 */

// 🎨 Barvy pro JSON hodnoty
function colorizeValue(val) {
  if (val === true) return chalk.yellow("true");
  if (val === false) return chalk.red("false");
  if (val === null) return chalk.gray("null");
  return val;
}

// 🧩 Helper pro hezký výpis objektů
function formatArgs(args) {
  return args.map((arg) => {
    if (typeof arg === "object") {
      return util.inspect(arg, {
        colors: true,
        depth: null,
        maxArrayLength: 10,
      });
    }
    return colorizeValue(arg);
  });
}

// 🧠 Debug – loguje jen pokud je DEBUG=true
export function debug(...args) {
  if (DEBUG === true) {
    console.log(
      chalk.hex("#B980FF").bold("[DEBUG]"),
      chalk.magenta.bold(...formatArgs(args))
    );
  }
}

// ℹ️ Info – loguje mimo produkci, nebo pokud je DEBUG=true
export const info = (...args) => {
  if (DEBUG === true || NODE_ENV !== "production") {
    console.log(chalk.blueBright.bold("[INFO]"), chalk.white(...formatArgs(args)));
  }
};

// ⚠️ Warning – loguje vždy
export const warn = (...args) => {
  console.warn(chalk.yellow.bold("[WARN]"), chalk.yellowBright(...formatArgs(args)));
};

// 💥 Error – loguje vždy
export const error = (...args) => {
  console.error(chalk.red.bold("[ERROR]"), chalk.redBright(...formatArgs(args)));
};
