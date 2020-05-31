window.L = {
    storage: {
        saveLanguage(obj) {
            const local = { ...JSON.parse(window.localStorage.getItem('language') || '{}'), ...obj };
            window.localStorage.setItem('language', JSON.stringify(local));
            return local;
        },
        getDefaultLanguage() {
            const local = JSON.parse(window.localStorage.getItem('language'));
            return local ? local.default : null;
        },
        getResultLanguage() {
            const local = JSON.parse(window.localStorage.getItem('language'));
            return local ? local.results : null;
        },
        getMultiLanguage() {
            const local = JSON.parse(window.localStorage.getItem('language'));
            return local ? local.multi : null;
        },
    },

    /**
     * Update all data-translate
     * 
     * @param {Object} language - list of all key values of language
     * @returns {NodeList}
     * 
     * @example
     * const language = { key: 'value' }
     * window.L.updateSnap(language);
     * // will end up updating all data-translate containing {{ key }} to value
     */
    updateSnap(language) {
        // get elements by data-translate
        const elements = document.querySelectorAll('[data-translate]');
        
        // map them
        elements.forEach(e => {
            // get text from dataset if exists or innerText
            const text = e.dataset.translate || e.innerText;

            // set text into dataset if don't exists
            if (e.dataset.translate === '') e.dataset.translate = e.innerText;
            // set text into innerText if dataset exists
            else e.innerText = e.dataset.translate;

            // try to match brackets style
            const match = text.match(/\{\{(.*?)\}\}/g);

            if (!match) return;

            const { length } = match;

            // loop all results in match
            for (let i = 0; i < length; i++) {
                // get current match
                const currentMatch = text.match(/\{\{(.*?)\}\}/);

                // get full result of match
                const full = currentMatch[0];
                // get key result of match
                const key = currentMatch[1].trim().toLowerCase().split('.');

                // get translation from match
                const translation = language.reference(key);

                // set text to new translation
                e.innerText = e.innerText.replace(full, translation);
            }
        });

        return elements;
    },
};

window.T.L = window.L;