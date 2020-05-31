window.T = window.T || {};
window.T.language = window.T.language || {};

const language = navigator.language || navigator.userLanguage;

const savedLanguage = localStorage.getItem('language') || null;

window.T.language.default = window.T.language[savedLanguage] || window.T.language[language] || window.T.language['en-EN'];