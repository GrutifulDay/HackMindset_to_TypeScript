import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import { debug, info, warn, error } from "../utils/logger.js";
import {
  FETCH_API_NASA,
  API_KEY_NASA,
  NASA_FALLBACK,
  NASA_ARCHIVE,
  NASA_BASE_URL,
  DEMO_MODE
} from "../config.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const demoNasa = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../demo-data/nasa.json"), "utf8")
);


// endpoint vraci denni NASA img (APOD). 
// pouziva API, fallback HTML a archiv jako zalozni zdroje,
// aby byl obsah dostupny i pri vypadku NASA sluzeb.

// cache v pameti
let nasaCache = null;
let nasaCacheDate = null;

// vypocet denniho indexu (pro archiv)
function getDailyIndex(linksLength) {
  const now = new Date();
  const year = now.getFullYear();
  const dayOfYear = Math.floor((now - new Date(year, 0, 0)) / 86400000);
  const seed = year * 1000 + dayOfYear;
  return seed % linksLength;
}

function isToday(dateString) {
  if (!dateString) return false;
  const today = new Date().toISOString().split("T")[0];
  return dateString === today;
}

export async function fetchNasaImage(req, res) {
  // 🟢 DEMO MODE → vraci demo NASA JSON
  if (DEMO_MODE) {
    return res.json(demoNasa);
  }

  const today = new Date().toISOString().slice(0, 10);

  // 🟢 Kontrola backend cache
  if (nasaCache && nasaCacheDate === today) {
    debug("⚡ NASA backend cache – posílám uložená data");
    if (req.internal) return;
    return res.json(nasaCache);
  }

  try {
    // 🌐 Pokus o přímé NASA API
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const apiUrlNasa = `${FETCH_API_NASA}${API_KEY_NASA}`;

    debug("🛰️ Fetching NASA API:", apiUrlNasa);

    const response = await fetch(apiUrlNasa, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`Chyba NASA API: ${response.status}`);

    const data = await response.json();
    // pro testy IMG presne datum
    // data.date = "2025-11-18"; 
    debug("✅ NASA API odpověď:", data.date);

    if (isToday(data.date)) {
      
      const apodHtmlPage =
        `https://apod.nasa.gov/apod/ap${data.date.replace(/-/g, "").slice(2)}.html`;

      const result =
        data.media_type === "video"
          ? {
              type: "video",
              url: data.url,
              explanation: 'Dnes je video 🎥, klikni na odkaz: "Chceš vědět víc?"',
              date: data.date,
              source: "api",
              pageUrl: apodHtmlPage
            }
          : {
              type: "image",
              url: data.url,
              explanation: data.explanation,
              date: data.date,
              source: "api",
              pageUrl: apodHtmlPage || "https://apod.nasa.gov/apod/astropix.html",
            };

      nasaCache = result;
      nasaCacheDate = today;
      return res.json(result);
    }

    warn(`⚠️ NASA API má staré datum (${data.date}) – přepínám na archiv.`);
    throw new Error("Staré datum v API");

  } catch (apiError) {
    warn("⚠️ NASA API nedostupné nebo neaktuální – zkouším fallback...");

    // Fallback HTML
    try {
      const htmlResponse = await fetch(NASA_FALLBACK);
      const html = await htmlResponse.text();
      const dom = new JSDOM(html);
      const doc = dom.window.document;

      const img = doc.querySelector("img");
      const explanation = doc.querySelector("p")?.textContent || "Bez popisu.";
      const dateText = doc.querySelector("b")?.textContent || "";
      const url = `${NASA_BASE_URL}${img?.getAttribute("src")}`;

      if (!dateText.includes(new Date().getFullYear())) {
        warn("⚠️ Fallback HTML nemá dnešní datum – archivní režim.");
        throw new Error("Fallback stale");
      }

      const result = {
        type: "image",
        url,
        explanation,
        date: dateText,
        source: "fallback"
      };

      nasaCache = result;
      nasaCacheDate = today;

      info("✅ NASA fallback použit úspěšně");
      return res.json(result);

    } catch (fallbackError) {
      // archivni rezim
      try {
        warn("⚠️ NASA fallback selhal – zkouším archiv...");

        const archiveRes = await fetch(NASA_ARCHIVE);
        const archiveHtml = await archiveRes.text();
        const archiveDom = new JSDOM(archiveHtml);
        const links = [...archiveDom.window.document.querySelectorAll("a[href^='ap']")];

        if (!links.length) throw new Error("Archivní odkazy nenalezeny");

        const index = getDailyIndex(links.length);
        const randomLink = links[index].getAttribute("href");
        const randomUrl = `${NASA_BASE_URL}${randomLink}`;

        // video test
        // const randomUrl = "https://apod.nasa.gov/apod/ap251118.html";

        debug("📂 Archivní URL:", randomUrl);

        let randomPageRes;
        let randomHtml;

        try {
          randomPageRes = await fetch(randomUrl, { timeout: 8000 });
          randomHtml = await randomPageRes.text();
        } catch (e) {
          warn("⚠️ První pokus o archiv selhal, zkouším jiný odkaz...");
          // zkusi jiny odkaz z archivu, ne ten samy
          const altIndex = (index + 5) % links.length;
          const altLink = links[altIndex].getAttribute("href");
          const altUrl = `${NASA_BASE_URL}${altLink}`;
          debug("📂 Alternativní archivní URL:", altUrl);
          randomPageRes = await fetch(altUrl, { timeout: 10000 });
          randomHtml = await randomPageRes.text();
        }

        const randomDom = new JSDOM(randomHtml);
        const randomDoc = randomDom.window.document;

        // video detekce
        const iframe = randomDoc.querySelector("iframe");
        const video = randomDoc.querySelector("video");
        const img = randomDoc.querySelector("img");


        // pokud existuje iframe (video) nebo chybi img, prepne na video hlasku
        if (iframe || video) {
          const videoUrl = iframe?.getAttribute("src") || 
                           video?.querySelector("source")?.getAttribute("src") ||
                           randomUrl;

          const result = {
            type: "video",
            url: videoUrl,
            explanation: 'Dnes je video 🎥, klikni na odkaz: "Chceš vědět víc?"',
            date: "Archivní výběr",
            source: "archive-video",
            pageUrl: randomUrl
          };
          info("🎥 NASA archivní režim – detekováno video (<iframe> nebo <video>)");
          return res.json(result);
        }

        // 🧠 text pod IMG - popis
        const paragraphs = [...randomDoc.querySelectorAll("p")];
        let explanation = "Popis není dostupný.";

        if (paragraphs.length > 0) {
          const explanationNode = paragraphs.find(p =>
            p.textContent.trim().startsWith("Explanation:")
          );

          if (explanationNode) {
            // Odstrani <b>Explanation:</b> i HTML tagy
            explanation = explanationNode.innerHTML
              .replace(/<b>\s*Explanation:\s*<\/b>/i, "")
              .replace(/^Explanation:\s*/i, "")
              .replace(/<\/?[^>]+(>|$)/g, "")
              .trim();
          } else if (paragraphs.length > 1) {
            explanation = paragraphs[1].textContent.trim();
          }
        }

        const result = {
          type: "image",
          url: `${NASA_BASE_URL}${img?.getAttribute("src")}`,
          explanation,
          date: "Archivní výběr",
          source: "archive-fixed",
          pageUrl: randomUrl
        };

        nasaCache = result;
        nasaCacheDate = today;

        info("📚 NASA archivní režim – úspěšně načteno (opravený text)");
        return res.json(result);

      } catch (archiveError) {
        error("❌ NASA archiv selhal:", archiveError.message);
        return res.status(502).json({
          error: "NASA API i archiv momentálně nedostupné."
        });
      }
    }
  }
}