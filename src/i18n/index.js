//import { an } from './an.js';
//import { ar } from './ar.js';
//import { ast } from './ast.js';
//import { bn } from './bn.js';
import { ca } from './ca.js';
//import { da } from './da.js';
//import { de } from './de.js';
import { en } from './en.js';
import { es } from './es.js';
//import { eu } from './eu.js';
//import { fi } from './fi.js';
//import { fr } from './fr.js';
//import { gl } from './gl.js';
//import { hi } from './hi.js';
//import { it } from './it.js';
//import { ja } from './ja.js';
//import { ko } from './ko.js';
//import { nl } from './nl.js';
//import { no } from './no.js';
//import { pl } from './pl.js';
//import { pt } from './pt.js';
//import { ru } from './ru.js';
//import { sv } from './sv.js';
//import { uk } from './uk.js';
//import { vi } from './vi.js';
//import { zh } from './zh.js';
//import { bg } from './bg.js';
//import { cs } from './cs.js';
//import { el } from './el.js';
//import { hr } from './hr.js';
//import { hu } from './hu.js';
//import { ro } from './ro.js';
//import { sk } from './sk.js';
//import { sr } from './sr.js';

// Create a sorted and formatted languages object
export const languages = (() => {
    const langEntries = [
        { code: 'ca', native: 'Català', en: 'Catalan', translations: ca },
        { code: 'en', native: 'English', en: 'English', translations: en },
        { code: 'es', native: 'Español', en: 'Spanish', translations: es }
    ];

    // Sort by English name
    langEntries.sort((a, b) => a.en.localeCompare(b.en));

    // Convert to object with formatted names
    return langEntries.reduce((acc, { code, native, en, translations, rtl }) => {
        acc[code] = {
            name: `${native} (${en}) (AI-IA)`,
            translations,
            ...(rtl ? { rtl } : {})
        };
        return acc;
    }, {});
})();

let currentLanguage = 'en';

export function setLanguage(lang, updateURL = true) {
    if (languages[lang]) {
        currentLanguage = lang;
        // Update the HTML lang attribute
        document.documentElement.lang = lang;
        // Update all text elements with the new translations
        updateTranslations();
        // Re-initialize overlays with translations for the new language
        if (window.getAllOverlays) {
            window.allOverlays = window.getAllOverlays();
            window.dispatchEvent(new CustomEvent('overlaysUpdated', { detail: window.allOverlays }));
        }
        // Update config i18n if it exists
        if (window.config && window.config.i18n) {
            Object.keys(window.config.i18n).forEach(key => {
                window.config.i18n[key] = getTranslation(key);
            });
        }
        // Update URL if requested
        if (updateURL) {
            updateLanguageInURL(lang);
        }
        // Dispatch language changed event
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
    }
}

export function getCurrentLanguage() {
    return currentLanguage;
}

export function getTranslation(key) {
    // First try to get translation from the module system
    const moduleTranslation = languages[currentLanguage].translations[key];
    if (moduleTranslation) return moduleTranslation;
    
    // Then try to get it from config if available
    if (window.config && window.config.i18n && window.config.i18n[key]) {
        return window.config.i18n[key];
    }
    
    // Finally return the key itself if no translation found
    return key;
}

export function updateTranslations() {
    console.log('🔄 updateTranslations called');
    // Find all elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    console.log('🔄 Found', elements.length, 'elements with data-i18n');

    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = getTranslation(key);
        console.log('🔄 Translating', key, '->', translation);

        if (element.tagName === 'INPUT' && element.type === 'text') {
            element.placeholder = translation;
        } else if (element.tagName === 'OPTION') {
            element.textContent = translation;
        } else if (element.tagName === 'LABEL') {
            // Special handling for labels to preserve input elements
            const input = element.querySelector('input[type="checkbox"]');
            if (input) {
                // Preserve the input and only replace text content
                const textNodes = Array.from(element.childNodes).filter(node => node.nodeType === 3);
                textNodes.forEach(textNode => textNode.textContent = translation);
            } else {
                element.textContent = translation;
            }
        } else if (translation.includes('<')) {
            // Handle HTML content in translations for any element
            element.innerHTML = translation;
        } else {
            element.textContent = translation;
        }
    });
}

function getLanguageFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    return languages[langParam] ? langParam : null;
}

export function updateLanguageInURL(lang) {
    if (!lang || !languages[lang]) return;
    
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    
    // Only update if the language is different
    if (params.get('lang') !== lang) {
        params.set('lang', lang);
        url.search = params.toString();
        
        // Use replaceState to avoid adding to browser history
        window.history.replaceState({}, '', url);
        
        // Update the current language
        currentLanguage = lang;
        
        // Dispatch language changed event
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
    }
}

// Handle URL changes
window.addEventListener('popstate', () => {
    const urlLang = getLanguageFromURL();
    if (urlLang) {
        setLanguage(urlLang, false);
    }
});

// Expose updateTranslations globally for overlays/layers re-render
window.updateTranslations = updateTranslations;

// Make getTranslation available globally
window.getTranslation = getTranslation;

// Initialize translations when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 Initializing translations...');

    // First check URL for language parameter
    const urlLang = getLanguageFromURL();
    if (urlLang) {
        console.log('🔧 URL language parameter found:', urlLang);
        setLanguage(urlLang, false);
        return;
    }

    // If no URL parameter, use browser language
    const browserLang = navigator.language.split('-')[0];
    const supportedLangs = ['en', 'es', 'ca'];
    const initialLang = supportedLangs.includes(browserLang) ? browserLang : 'en';
    console.log('🔧 Setting initial language to:', initialLang, 'based on browser language:', browserLang);
    setLanguage(initialLang, true);

    // Dispatch event when translations are initialized
    window.dispatchEvent(new CustomEvent('translationsInitialized'));
    console.log('🔧 Translations initialized and event dispatched');

    // Force update translations for static elements after initialization
    setTimeout(() => {
        console.log('🔄 Forcing translation update for static elements');
        const startTime = performance.now();
        updateTranslations();
        console.log(`🔄 updateTranslations took ${performance.now() - startTime}ms`);

        // Also translate element type filter checkboxes specifically
        // translateElementTypeCheckboxes(); // Not needed since data-i18n system handles it automatically
    }, 100);
});

function translateElementTypeCheckboxes() {
    console.log('🔄 Translating element type checkboxes');
    const startTime = performance.now();
    // Translate the label text for element type checkboxes
    $('.element-type-filter label').each(function() {
        const $label = $(this);
        const $input = $label.find('input[type="checkbox"]');

        if ($input.length > 0) {
            const value = $input.val();

            // Map values to translation keys
            let translationKey;
            switch(value) {
                case 'node':
                    translationKey = 'nodesCheckbox';
                    break;
                case 'way':
                    translationKey = 'waysCheckbox';
                    break;
                case 'relation':
                    translationKey = 'relationsCheckbox';
                    break;
                default:
                    return;
            }

            const translation = getTranslation(translationKey);
            console.log(`🔄 Translating checkbox ${value} -> ${translation}`);

            // Simply replace the text content of the label
            const originalText = $label.text();
            console.log(`🔄 Label text before: "${originalText}"`);
            $label.text(translation);
            console.log(`🔄 Label text after: "${$label.text()}"`);
        }
    });
} 