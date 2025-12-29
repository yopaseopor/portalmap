import { LanguageSelector } from './components/LanguageSelector.js';

// Wait for DOM content to be loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize language selector
    const languageSelectorContainer = document.getElementById('language-selector-container');
    if (languageSelectorContainer) {
        const languageSelector = new LanguageSelector(languageSelectorContainer);
        console.log('Language selector initialized successfully');
    } else {
        console.error('Language selector container not found');
    }
}); 