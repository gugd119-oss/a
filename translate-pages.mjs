import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mappings = [
  { src: 'index.html', dst: 'index.en.html', lang: 'en' },
  { src: 'index.html', dst: 'index.ja.html', lang: 'ja' },
  { src: 'index.html', dst: 'index.zh-TW.html', lang: 'zh-TW' },
  { src: 'admin.html', dst: 'admin.en.html', lang: 'en' },
  { src: 'admin.html', dst: 'admin.ja.html', lang: 'ja' },
  { src: 'admin.html', dst: 'admin.zh-TW.html', lang: 'zh-TW' },
  { src: 'Badmin.html', dst: 'Badmin.en.html', lang: 'en' },
  { src: 'Badmin.html', dst: 'Badmin.ja.html', lang: 'ja' },
  { src: 'Badmin.html', dst: 'Badmin.zh-TW.html', lang: 'zh-TW' },
];

async function sleep(ms){
  return new Promise(res=>setTimeout(res, ms));
}

async function translateFile(browser, srcPath, targetLang) {
  const page = await browser.newPage();
  await page.setBypassCSP(true);
  const fileUrl = 'file://' + srcPath;
  await page.goto(fileUrl, { waitUntil: 'load', timeout: 120000 });

  // Prepare container and callback before loading GT script
  await page.evaluate((targetLang) => {
    const el = document.createElement('div');
    el.id = 'google_translate_element';
    document.body.appendChild(el);

    // Define callback expected by Google script
    window.googleTranslateElementInit = function() {
      new google.translate.TranslateElement({
        pageLanguage: 'zh-CN',
        includedLanguages: 'en,ja,zh-TW',
        autoDisplay: false
      }, 'google_translate_element');
    };
  }, targetLang);

  // Inject Google Translate script
  await page.addScriptTag({ url: 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit' });

  // Wait for the language combo to appear
  await page.waitForSelector('select.goog-te-combo', { timeout: 60000 });

  // Switch language
  await page.evaluate((targetLang) => {
    const combo = document.querySelector('select.goog-te-combo');
    if (combo) {
      combo.value = targetLang;
      combo.dispatchEvent(new Event('change'));
    }
  }, targetLang);

  // Wait for translation to apply (heuristic)
  await sleep(7000);

  // Strip Google artifacts and set lang
  const html = await page.evaluate((targetLang) => {
    const removeAll = (sel) => document.querySelectorAll(sel).forEach((el) => el.remove());
    removeAll('#google_translate_element');
    removeAll('#goog-gt-tt');
    removeAll('.goog-te-banner-frame');
    removeAll('iframe.goog-te-banner-frame');
    removeAll('iframe.goog-te-menu-frame');
    removeAll('.goog-te-balloon-frame');
    removeAll('.skiptranslate');
    document.querySelectorAll('script[src*="translate_a/element.js"]').forEach(s=>s.remove());
    document.querySelectorAll('style').forEach(st=>{ if ((st.textContent||'').includes('goog-') || (st.textContent||'').includes('VIpgJd')) st.remove(); });

    document.documentElement.setAttribute('lang', targetLang);
    return '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
  }, targetLang);

  await page.close();
  return html;
}

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (const { src, dst, lang } of mappings) {
      const srcPath = path.resolve(__dirname, src);
      const dstPath = path.resolve(__dirname, dst);
      console.log(`Translating ${src} -> ${dst} [${lang}] ...`);
      const html = await translateFile(browser, srcPath, lang);
      await fs.writeFile(dstPath, html, 'utf8');
      console.log(`Wrote ${dst}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});