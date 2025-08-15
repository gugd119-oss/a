(function() {
  'use strict';

  const supportedLanguages = {
    'zh-CN': '简体中文',
    'zh-TW': '繁體中文',
    'en': 'English',
    'ja': '日本語'
  };

  const dictionary = {
    'zh-CN': {
      'brand.title': '大吃小游戏',
      'nav.rooms': '房间列表',
      'nav.game': '游戏界面',
      'nav.history': '历史记录',
      'nav.help': '帮助中心',
      'nav.rules': '游戏规则',
      'nav.profit': '分润说明',
      'nav.contact': '联系我们',
      'wallet.disconnected': '未连接钱包',
      'wallet.connect': '连接钱包',
      'wallet.connectTip': '请先连接您的钱包以使用游戏功能',
      'admin.title': '三公游戏管理后台',
      'admin.subtitle': '管理费率、合伙人、管理员和系统设置',
      'admin.walletTip': '请先连接您的钱包以使用管理功能'
    },
    'zh-TW': {
      'brand.title': '大吃小遊戲',
      'nav.rooms': '房間列表',
      'nav.game': '遊戲介面',
      'nav.history': '歷史記錄',
      'nav.help': '幫助中心',
      'nav.rules': '遊戲規則',
      'nav.profit': '分潤說明',
      'nav.contact': '聯繫我們',
      'wallet.disconnected': '未連接錢包',
      'wallet.connect': '連接錢包',
      'wallet.connectTip': '請先連接您的錢包以使用遊戲功能',
      'admin.title': '三公遊戲管理後台',
      'admin.subtitle': '管理費率、合夥人、管理員和系統設置',
      'admin.walletTip': '請先連接您的錢包以使用管理功能'
    },
    'en': {
      'brand.title': 'Big-Eat Game',
      'nav.rooms': 'Rooms',
      'nav.game': 'Game',
      'nav.history': 'History',
      'nav.help': 'Help',
      'nav.rules': 'Game Rules',
      'nav.profit': 'Profit Sharing',
      'nav.contact': 'Contact Us',
      'wallet.disconnected': 'Wallet not connected',
      'wallet.connect': 'Connect Wallet',
      'wallet.connectTip': 'Please connect your wallet to use game features',
      'admin.title': 'San Gong Admin Panel',
      'admin.subtitle': 'Manage fees, partners, admins and system settings',
      'admin.walletTip': 'Please connect your wallet to use admin features'
    },
    'ja': {
      'brand.title': 'ビッグイート ゲーム',
      'nav.rooms': 'ルーム一覧',
      'nav.game': 'ゲーム',
      'nav.history': '履歴',
      'nav.help': 'ヘルプ',
      'nav.rules': 'ゲームルール',
      'nav.profit': '分配の説明',
      'nav.contact': 'お問い合わせ',
      'wallet.disconnected': 'ウォレット未接続',
      'wallet.connect': 'ウォレット接続',
      'wallet.connectTip': 'ゲーム機能を利用するにはウォレットを接続してください',
      'admin.title': 'サンゴン 管理パネル',
      'admin.subtitle': '手数料・パートナー・管理者・システム設定を管理',
      'admin.walletTip': '管理機能を利用するにはウォレットを接続してください'
    }
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
      /* Hide Google Translate rating/bubble/tooltips */
      #goog-gt-tt { display: none !important; }
      .goog-te-balloon-frame { display: none !important; }
      .goog-tooltip { display: none !important; }
      .goog-tooltip:hover { display: none !important; }
      .goog-text-highlight { background: none !important; box-shadow: none !important; }
      .goog-logo-link { display: none !important; }
      .goog-te-gadget { height: 0 !important; overflow: hidden !important; }
      .VIpgJd-ZVi9od-xl07Ob-OEVmcd { display: none !important; }
      .VIpgJd-ZVi9od-l4eHX-hSRGPd { display: none !important; }
    `;
    document.head.appendChild(style);

    let gadget = document.getElementById('google_translate_element');
    if (!gadget) {
      gadget = document.createElement('div');
      gadget.id = 'google_translate_element';
      document.body.appendChild(gadget);
    }

    // 悬浮语言选择器不再创建，避免遮挡导航入口（请使用页面内的选择器）
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
    syncSelectors(currentLanguage());
  };

  function applyLocalDictionary(lang) {
    const dict = dictionary[lang];
    if (!dict) return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = dict[key];
      if (typeof text === 'string') {
        el.textContent = text;
      }
    });
  }

  function syncSelectors(lang) {
    const ids = ['langSelector', 'langSelectorNav', 'langSelectorNavMobile', 'langSelectorAdmin', 'langSelectorBadmin'];
    ids.forEach(id => {
      const s = document.getElementById(id);
      if (s) s.value = lang;
    });
  }

  function bindSelectors() {
    const ids = ['langSelector', 'langSelectorNav', 'langSelectorNavMobile', 'langSelectorAdmin', 'langSelectorBadmin'];
    ids.forEach(id => {
      const s = document.getElementById(id);
      if (s && !s.__i18nBound) {
        s.addEventListener('change', function() { setLanguage(this.value); });
        s.__i18nBound = true;
      }
    });
  }

  function currentLanguage() {
    try {
      const stored = localStorage.getItem('preferred_language');
      if (stored && supportedLanguages[stored]) return stored;
    } catch (e) {}
    const cookieTarget = currentTranslatedTarget();
    if (cookieTarget && supportedLanguages[cookieTarget]) return cookieTarget;
    return detectPreferredLanguage();
  }

  function setLanguage(target) {
    if (!supportedLanguages[target]) target = 'zh-CN';
    document.documentElement.setAttribute('lang', target);
    try { localStorage.setItem('preferred_language', target); } catch (e) {}

    // Local dictionary (works offline, instant)
    applyLocalDictionary(target);
    syncSelectors(target);

    // Google Translate (full-page, optional if accessible)
    if (target === 'zh-CN') {
      clearGoogTrans();
    } else {
      setGoogTrans('/zh-CN/' + target);
    }

    const combo = document.querySelector('select.goog-te-combo');
    if (combo) {
      combo.value = target;
      combo.dispatchEvent(new Event('change'));
    }
  }

  function init() {
    ensureStylesAndContainers();
    loadGoogleScriptOnce();

    // Apply initial
    const initial = currentLanguage();
    setLanguage(initial);

    // Bind UI selectors
    bindSelectors();

    // Observe for dynamically added elements with data-i18n
    const mo = new MutationObserver(() => applyLocalDictionary(currentLanguage()));
    mo.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();