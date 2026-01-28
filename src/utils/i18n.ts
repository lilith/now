/**
 * i18n utilities for translation support
 */

export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'ja', 'zh', 'it', 'sv'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_CONFIG: Record<SupportedLanguage, { name: string; nativeName: string; flag: string }> = {
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  it: { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  sv: { name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
};

/**
 * Get the collection name for a content type in a specific language
 */
export function getCollectionName(contentType: string, lang: string): string {
  if (lang === 'en') {
    return contentType;
  }
  return `${contentType}-${lang}`;
}

/**
 * Get URL path for content in a specific language
 */
export function getLocalizedPath(contentType: string, slug: string, lang: string): string {
  if (lang === 'en') {
    return `/${contentType}/${slug}/`;
  }
  return `/${lang}/${contentType}/${slug}/`;
}

/**
 * Get the base path for a content type in a specific language
 */
export function getLocalizedBasePath(contentType: string, lang: string): string {
  if (lang === 'en') {
    return `/${contentType}/`;
  }
  return `/${lang}/${contentType}/`;
}

/**
 * Parse language from URL path
 */
export function parseLanguageFromPath(path: string): { lang: SupportedLanguage; remainingPath: string } {
  const segments = path.split('/').filter(Boolean);

  if (segments.length > 0 && SUPPORTED_LANGUAGES.includes(segments[0] as SupportedLanguage)) {
    return {
      lang: segments[0] as SupportedLanguage,
      remainingPath: '/' + segments.slice(1).join('/')
    };
  }

  return {
    lang: 'en',
    remainingPath: path
  };
}

/**
 * Check if a language is the default language (English)
 */
export function isDefaultLanguage(lang: string): boolean {
  return lang === 'en';
}
