import fs from 'fs/promises';

const sourceFiles = ['index.html', 'admin.html', 'Badmin.html'];
const targets = [
  { lang: 'en', suffix: '.en.html' },
  { lang: 'ja', suffix: '.ja.html' },
  { lang: 'zh-TW', suffix: '.zh-TW.html' },
];

function extractChinesePhrases(text) {
  const re = /[\u4e00-\u9FFF]{2,}(?:[\u4e00-\u9FFF\u3002\uff0c\uff01\uff1f\u201c\u201d\u3001\uff1a\uff1b\uFF08\uFF09\sA-Za-z0-9]*)?/g;
  const set = new Set();
  let m;
  while ((m = re.exec(text)) !== null) {
    const phrase = m[0].trim();
    if (phrase && phrase.length >= 2) set.add(phrase);
  }
  return Array.from(set).sort((a,b)=>b.length-a.length);
}

async function translate(phrase, to) {
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=' + encodeURIComponent(to) + '&dt=t&q=' + encodeURIComponent(phrase);
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  // data[0] is array of [translated, original, ...]
  let out = '';
  for (const seg of data[0]) out += seg[0];
  return out;
}

async function translateAll(phrases, lang) {
  const map = new Map();
  for (const p of phrases) {
    try {
      const tr = await translate(p, lang);
      map.set(p, tr);
      // polite delay to avoid rate limit
      await new Promise(r=>setTimeout(r, 150));
    } catch (e) {
      console.error('Translate failed for', p.slice(0,40), '->', lang, e.message);
    }
  }
  return map;
}

function applyReplacements(content, dict) {
  // Replace longer phrases first
  const entries = Array.from(dict.entries()).sort((a,b)=>b[0].length-a[0].length);
  for (const [src, dst] of entries) {
    const re = new RegExp(src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    content = content.replace(re, dst);
  }
  return content;
}

async function main() {
  for (const file of sourceFiles) {
    const content = await fs.readFile(file, 'utf8');
    const phrases = extractChinesePhrases(content);
    console.log(file, 'found phrases:', phrases.length);
    for (const { lang, suffix } of targets) {
      console.log('Translating to', lang, '...');
      const dict = await translateAll(phrases, lang);
      let out = content;
      out = out.replace(/<html lang="zh-CN"/,'<html lang="'+lang+'"');
      out = applyReplacements(out, dict);
      await fs.writeFile(file.replace('.html', suffix), out, 'utf8');
      console.log('Wrote', file.replace('.html', suffix));
    }
  }
}

main().catch(err=>{ console.error(err); process.exit(1); });