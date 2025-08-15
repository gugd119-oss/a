(function() {
  'use strict';

  const supportedLanguages = {
    'zh-CN': '简体中文',
    'zh-TW': '繁體中文',
    'en': 'English',
    'ja': '日本語'
  };

  function mapToSupportedLanguage(lang) {
    if (!lang) return 'zh-CN';
    lang = String(lang).replace('_', '-');
    const lower = lang.toLowerCase();

    if (lower.startsWith('zh')) {
      if (lower.includes('hant') || lower.endsWith('-hk') || lower.endsWith('-mo') || lower.endsWith('-tw')) {
        return 'zh-TW';
      }
      return 'zh-CN';
    }
    if (lower.startsWith('en')) return 'en';
    if (lower.startsWith('ja') || lower.startsWith('jp')) return 'ja';
    return 'zh-CN';
  }

  function detectPreferredLanguage() {
    const langs = Array.isArray(navigator.languages) && navigator.languages.length
      ? navigator.languages
      : [navigator.language || navigator.userLanguage || 'zh-CN'];
    for (const l of langs) {
      const mapped = mapToSupportedLanguage(l);
      if (supportedLanguages[mapped]) return mapped;
    }
    return 'zh-CN';
  }

  function readCookie(name) {
    const nameEQ = name + '=';
    const parts = document.cookie.split(';');
    for (let i = 0; i < parts.length; i++) {
      let c = parts[i];
      while (c.charAt(0) === ' ') c = c.substring(1);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length));
    }
    return null;
  }

  function writeCookie(name, value, days, domain) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = 'expires=' + d.toUTCString();
    const domainPart = domain ? '; domain=' + domain : '';
    document.cookie = name + '=' + encodeURIComponent(value) + '; ' + expires + '; path=/' + domainPart;
  }

  function deleteCookie(name, domain) {
    const d = new Date(0);
    const expires = 'expires=' + d.toUTCString();
    const domainPart = domain ? '; domain=' + domain : '';
    document.cookie = name + '=; ' + expires + '; path=/' + domainPart;
  }

  function setGoogTrans(value) {
    const host = window.location.hostname;
    writeCookie('googtrans', value, 365);
    if (host) {
      try { writeCookie('googtrans', value, 365, host); } catch (e) {}
      if (host.includes('.')) {
        const parts = host.split('.');
        const top = '.' + parts.slice(-2).join('.');
        try { writeCookie('googtrans', value, 365, top); } catch (e) {}
      }
    }
  }

  function clearGoogTrans() {
    const host = window.location.hostname;
    deleteCookie('googtrans');
    if (host) {
      try { deleteCookie('googtrans', host); } catch (e) {}
      if (host.includes('.')) {
        const parts = host.split('.');
        const top = '.' + parts.slice(-2).join('.');
        try { deleteCookie('googtrans', top); } catch (e) {}
      }
    }
  }

  function currentTranslatedTarget() {
    const v = readCookie('googtrans');
    if (!v) return null;
    const parts = v.split('/');
    if (parts.length >= 3) return parts[2] || null;
    return null;
  }

  function ensureStylesAndContainers() {
    const style = document.createElement('style');
    style.setAttribute('data-i18n', 'true');
    style.textContent = `
      .goog-te-banner-frame.skiptranslate { display: none !important; }
      body { top: 0 !important; }
      #google_translate_element { display: none; height: 0; overflow: hidden; }
      #lang-switcher { position: fixed; top: 12px; right: 12px; z-index: 2147483647; backdrop-filter: blur(6px); background: rgba(0,0,0,0.4); padding: 6px 8px; border-radius: 8px; }
      #lang-switcher select { margin-left: 6px; background: rgba(255,255,255,0.9); border: 1px solid rgba(0,0,0,0.15); border-radius: 6px; padding: 4px 6px; font-size: 12px; }
      #lang-switcher label { color: #fff; font-size: 12px; }
    `;
    document.head.appendChild(style);

    let gadget = document.getElementById('google_translate_element');
    if (!gadget) {
      gadget = document.createElement('div');
      gadget.id = 'google_translate_element';
      document.body.appendChild(gadget);
    }

    let switcher = document.getElementById('lang-switcher');
    if (!switcher) {
      switcher = document.createElement('div');
      switcher.id = 'lang-switcher';
      const label = document.createElement('label');
      label.htmlFor = 'langSelector';
      label.textContent = '语言 Language';
      const select = document.createElement('select');
      select.id = 'langSelector';
      for (const [code, name] of Object.entries(supportedLanguages)) {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = name;
        select.appendChild(option);
      }
      select.addEventListener('change', function() {
        applyLanguage(this.value, true);
      });
      switcher.appendChild(label);
      switcher.appendChild(select);
      document.body.appendChild(switcher);
    }
  }

  function loadGoogleScriptOnce() {
    if (window.google && window.google.translate && window.google.translate.TranslateElement) return;
    if (document.getElementById('google-translate-script')) return;
    const s = document.createElement('script');
    s.id = 'google-translate-script';
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.body.appendChild(s);
  }

  window.googleTranslateElementInit = function() {
    new google.translate.TranslateElement({
      pageLanguage: 'zh-CN',
      includedLanguages: Object.keys(supportedLanguages).join(','),
      autoDisplay: false
    }, 'google_translate_element');
    const select = document.getElementById('langSelector');
    if (select) {
      const cur = currentTranslatedTarget() || 'zh-CN';
      select.value = cur;
    }
  };

  function applyLanguage(target, persist) {
    document.documentElement.setAttribute('lang', target);
    if (target === 'zh-CN') {
      clearGoogTrans();
    } else {
      setGoogTrans('/zh-CN/' + target);
    }
    if (persist) {
      try { localStorage.setItem('preferred_language', target); } catch (e) {}
      window.location.reload();
    } else {
      const combo = document.querySelector('select.goog-te-combo');
      if (combo) {
        combo.value = target;
        combo.dispatchEvent(new Event('change'));
      }
    }
  }

  function init() {
    ensureStylesAndContainers();
    loadGoogleScriptOnce();

    const stored = (function() { try { return localStorage.getItem('preferred_language'); } catch (e) { return null; } })();
    const cookieTarget = currentTranslatedTarget();
    const detected = detectPreferredLanguage();
    const initial = stored || cookieTarget || detected;

    const onceFlagKey = 'i18n_auto_applied';
    const hasAppliedInThisSession = sessionStorage.getItem(onceFlagKey) === '1';

    const select = document.getElementById('langSelector');
    if (select) select.value = initial;

    document.documentElement.setAttribute('lang', initial);

    const desiredCookie = initial === 'zh-CN' ? null : '/zh-CN/' + initial;
    const cookieVal = readCookie('googtrans');
    const cookieAligned = (!desiredCookie && !cookieVal) || (desiredCookie && cookieVal === desiredCookie);

    if (!cookieAligned && !hasAppliedInThisSession) {
      sessionStorage.setItem(onceFlagKey, '1');
      applyLanguage(initial, true);
      return;
    }

    sessionStorage.setItem(onceFlagKey, '1');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();