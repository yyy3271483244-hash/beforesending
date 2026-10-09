import { createContext, useContext, useLayoutEffect, useMemo, useState } from 'react';
import { messages } from './messages';

const LanguageContext = createContext(null);
const KEY = 'before-sending-language-v1';

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem(KEY) === 'en' ? 'en' : 'zh'; } catch { return 'zh'; }
  });
  const value = useMemo(() => ({
    language, locale: language === 'en' ? 'en-GB' : 'zh-CN',
    t: (key, ...args) => {
      const text = language === 'en' ? messages[key] ?? key : key;
      return String(text).replace(/\{(\d+)\}/g, (match, index) => args[index] ?? match);
    },
    setLanguage,
  }), [language]);
  useLayoutEffect(() => {
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    document.documentElement.dataset.language = language;
    try { localStorage.setItem(KEY, language); } catch {}
    window.dispatchEvent(new Event('before-sending-languagechange'));
  }, [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() { return useContext(LanguageContext); }

export function LanguageSwitch({className = 'language-switch'}) {
  const { language, setLanguage, t } = useI18n();
  return <nav className={className} aria-label={t('界面语言')}>
    <button lang="zh-CN" aria-pressed={language === 'zh'} onClick={() => setLanguage('zh')}>中</button>
    <span aria-hidden="true">/</span>
    <button lang="en" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button>
  </nav>;
}
