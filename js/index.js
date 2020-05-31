window.T = window.T || {};

window.T = {
    ...window.T,

    L: window.L,

    mods: [],
    noMods: {},

    options: {
        name: {
            threshold: 0.2,
            keys: [
                'name',
            ],
        },
        ingredients: {
            threshold: 0.2,
            keys: [
                'ingredients.item',
            ],
        },
    },

    elements: {
        input: document.querySelector('.search'),
        name: document.querySelector('.results'),
        ingredients: document.querySelector('.results-ing'),
        number: document.querySelector('.number'),
        mods: document.querySelector('.mods'),
    },

    /**
     * Will initialize language, recipes and search
     */
    init() {
        // get all supported languages
        this.languageList = Object.keys(this.language).filter(e => e !== 'default');

        // map recipes to add keys by supported languages
        this.recipes = this.baseRecipes = this.baseRecipes.map(e => {
            this.languageList.forEach(l => {
                e[l] = this.language[l].recipes[e.name]
            });

            e.ingredients = e.ingredients.map(i => {
                this.languageList.forEach(l => {
                    i[l] = this.language[l].recipes[i.item];
                });

                return i;
            });

            return e;
        }).sort((a, b) => {
            if (a.name < b.name) { return -1; }
            if (a.name > b.name) { return 1; }
            return 0;
        });

        this.preloadImages();

        // define all mods
        this.mods = this.getMods();
        this.noMods = this.storage.getNoMods() || {};

        // set results languages to default
        this.language.results = this.language.default.id;

        // focus to search tab
        this.elements.input.focus();
        this.resetRecipes();

        // update all language related
        this.initialize = true;

        this.updateLightMod();

        this.initialize = false;

        this.filterModRecipes();

        this.initialize = true;


        this.updateMultiLanguage();
        this.updateDefaultLanguage();
        this.updateResultLanguage();

        this.displayMods();

        this.initialize = false;
    },

    preloadImages() {
        this.recipes.forEach(e => {
            const names = [ e.name, e.ingredients[0].item, e.ingredients[1].item ];

            names.forEach(n => {
                const img = new Image();
                img.src = `img/${n}.png`;
            })
        });
    },

    storage: {
        saveMods(obj) {
            const local = { ...JSON.parse(window.localStorage.getItem('mods') || '{}'), ...obj };
            window.localStorage.setItem('mods', JSON.stringify(local));
    
            return local;
        },
        getNoMods() {
            const local = JSON.parse(window.localStorage.getItem('mods'));
            return local ? local.noMods : null;
        },
        getLightMod() {
            const local = JSON.parse(window.localStorage.getItem('mods'));
            return local ? local.lightMod : null;
        },
    },

    resetRecipes() {
        this.elements.number.innerHTML = `${this.recipes.length} <span data-translate>{{ success.recipes }}</span>`;
    },

    getMods() {
        return Object.keys(this.baseRecipes.reduce((obj, e) => ({ ...obj, [e.mod]: e.mod }), {}));
    },

    getDisabledMods() {
        return Object.entries(this.noMods).map(e => e[1] && e[0]);
    },

    handleNoMods(element, mod) {
        const value = window.T.noMods[mod] !== undefined ? !window.T.noMods[mod] : true;
        window.T.noMods[mod] = value;

        element.querySelector('input').checked = value;

        window.T.storage.saveMods({ noMods: window.T.noMods });

        window.T.filterModRecipes();
    },

    filterModRecipes() {
        this.recipes = this.baseRecipes.filter(e => this.getDisabledMods().indexOf(e.mod.toLowerCase()) === -1);
        this.createFuses(this.options);
        this.resetRecipes();
        this.display(this.value, this.type)
    },

    displayMods() {
        this.elements.mods.innerHTML = '';

        this.mods.forEach(e => {
            element = `<div class="mod-checkbox" onclick="window.T.handleNoMods(this, '${e.toLowerCase()}')">
                <input type="checkbox" ${this.noMods[e.toLowerCase()] ? 'checked' : ''} data-mod="${e.toLowerCase()}" class="mod">
                <label>${e}</label>
            </div>`

            this.elements.mods.innerHTML += element;
        });
    },

    /**
     * Set lightmod search to on/off
     * 
     * @param {boolean} bool 
     * @returns {boolean}
     * @example updateLightMod(true); // set lightmod on
     */
    updateLightMod(bool) {
        bool = (bool !== undefined) ? bool.toString() : null || this.storage.getLightMod() || true;
        this.storage.saveMods({ lightMod: bool, });
        // define last used multilanguage
        this.lightmod = bool;
        
        // update all elements to set hover
        const elements = document.querySelectorAll('[data-lightmod]');

        elements.forEach(e => {
            if (e.dataset.lightmod === bool.toString()) e.classList.add('hover');
            else e.classList.remove('hover');
        });

        // re render with last known value
        this.display(this.value);

        return bool;
    },

    /**
     * Set multilanguage search to on/off
     * 
     * @param {boolean} bool 
     * @returns {boolean}
     * @example updateMultiLanguage(true); // set multilanguage on
     */
    updateMultiLanguage(bool) {
        bool = (bool !== undefined) ? bool.toString() : null || this.L.storage.getMultiLanguage() || true;
        this.L.storage.saveLanguage({ multi: bool, });
        // define last used multilanguage
        this.multiLanguage = bool;

        // set languages to default languageList or to default and results lang
        const languages = (bool) ? this.languageList : [this.language.default.id, this.language.results];

        this.options = {
            name: {
                threshold: 0.2,
                keys: languages,
            },
            ingredients: {
                threshold: 0.2,
                keys: languages.map(e => `ingredients.${e}`),
            },
        };
        
        // update all elements to set hover
        const elements = document.querySelectorAll('[data-multilanguage]');

        elements.forEach(e => {
            if (e.dataset.multilanguage === bool.toString()) e.classList.add('hover');
            else e.classList.remove('hover');
        });

        // create new Fuses with new options 
        this.createFuses(this.options);
        // re render with last known value
        this.display(this.value);

        return bool;
    },

    /**
     * Update the default language of the page
     * 
     * @param {string} code - language code
     * @returns {NodeList}
     * @example updateDefaultLanguage('en-EN'); // will update all elements to language en-EN
     */
    updateDefaultLanguage(code) {
        // set default language to code or default or en-EN
        code = code || this.L.storage.getDefaultLanguage() || this.language.default.id || 'en-EN'
        this.language.default = this.language[code];
        this.L.storage.saveLanguage({ default: code, });

        // update all elements to set hover
        const elements = document.querySelectorAll('[data-defaultlanguage]');

        elements.forEach(e => {
            if (e.dataset.defaultlanguage === this.language.default.id) e.classList.add('hover');
            else e.classList.remove('hover');
        });

        return this.L.updateSnap(this.language.default.elements);
    },

    /**
     * Update the results language of the page
     * @param {string} code 
     * @returns {string}
     */
    updateResultLanguage(code) {
        // set results language to code or current
        this.language.results = code || this.L.storage.getResultLanguage() || this.language.results;
        this.L.storage.saveLanguage({ results: this.language.results, });

        // update all elements to set hover
        const elements = document.querySelectorAll('[data-resultlanguage]');

        elements.forEach(e => {
            if (e.dataset.resultlanguage === this.language.results) e.classList.add('hover');
            else e.classList.remove('hover');
        });

        return this.display(this.value);
    },

    /**
     * 
     * @param {Object} options - Object of object fuses options
     * @example createFuses({
            name: {
                threshold: 0.2,
                keys: ['example'],
            },
            ingredients: {
                threshold: 0.2,
                keys: ['example'],
            },
        })
     */
    createFuses(options) {
        // initialize fuses items
        this.fuses = {};

        // set fuses item by options
        this.fuses.name = new Fuse(this.recipes, options.name);
        this.fuses.ingredients = new Fuse(this.recipes, options.ingredients);

        return this.fuses;
    },

    /**
     * Display list of items
     * 
     * @param {string} value - searched value
     * @param {string} type - displays return (could be 'all', 'name', 'ingredients')
     * @returns {string}
     * @example display('plank', 'name'); // will display all "name" by keyword "plank"
     */
    display(value, type = 'all') {
        if (this.initialize) return;
        // define last used var
        this.type = type;
        this.value = value;

        // check if fuses exists
        if (!this.fuses) return console.error('Tools not initialized, run `T.init()` to initialize it');

        if (type === 'name') {
            this.displayName(value);
        } else if (type === 'ingredients') {
            this.displayIngredients(value);
        } else {
            this.displayName(value);
            this.displayIngredients(value);
        }

        // update language on elements
        this.L.updateSnap(this.language.default.elements);

        return value;
    },

    /**
     * Display list of items by name
     * 
     * @param {string} value - searched value
     * @returns {Element}
     * @example displayName('plank'); // will display all "name" by keyword "plank"
     */
    displayName(value) {
        // search results from fuses or all recipes
        const obj = value ? this.fuses.name.search(value) : this.recipes;

        // reset element name
        this.elements.name.innerHTML = '';

        // display error if no results found
        if (obj.length < 1) return this.elements.name.innerHTML = '<h2 class="mb-1" data-translate>{{ error.by_name }}</h2>';

        // display results
        this.elements.name.innerHTML = '<h2 class="mb-1" data-translate>{{ success.by_name }}</h2>';

        this.elements.name.innerHTML += `<div>
            <div class="mod">
                <span class="fw-400" data-translate>{{ success.mod }}</span>
            </div>
            <div>
                <span data-translate>{{ success.name }}</span>
                <span class="divider">></span>
                <span class="width-550" data-translate>{{ success.ingredients }}</span>
            </div>
        </div>`;

        // set code to results language
        const code = this.language.results;
        const lightmod = this.lightmod === 'true';

        // create table from objects returned in search
        obj.forEach(e => {
            this.elements.name.innerHTML += `<div>
                <div class="mod">${e.mod !== 'Vanilla' ? `<span title="${e.mod}">M</span>` : ''}</div>
                <div>
                    <span>${this.language[code].recipes[e.name]}${!lightmod ? `<br><img src="img/${e.name}.png"/>` : ''}</span>
                    <span class="divider">></span>
                    <span>${e.ingredients[0].quantity} ${this.language[code].recipes[e.ingredients[0].item]}${!lightmod ? `<br><img src="img/${e.ingredients[0].item}.png"/>` : ''}</span>
                    <span class="divider">+</span>
                    <span>${e.ingredients[1].quantity} ${this.language[code].recipes[e.ingredients[1].item]}${!lightmod ? `<br><img src="img/${e.ingredients[1].item}.png"/>` : ''}</span>
                </div>
            </div>`;
        });

        return this.elements.name;
    },

    /**
     * Display list of items by ingredients
     * 
     * @param {string} value - searched value
     * @returns {Element}
     * @example displayIngredients('plank'); // will display all "ingredients" by keyword "plank"
     */
    displayIngredients(value) {
        // search results from fuses or all recipes
        const obj = value ? this.fuses.ingredients.search(value) : this.recipes;

        // reset element ingredients
        this.elements.ingredients.innerHTML = '';

        // display error if no results found
        if (obj.length < 1) return this.elements.ingredients.innerHTML = '<h2 class="mb-1" data-translate>{{ error.by_ingredients }}</h2>';

        // display results
        this.elements.ingredients.innerHTML = '<h2 class="mb-1" data-translate>{{ success.by_ingredients }}</h2>';

        this.elements.ingredients.innerHTML += `<div>
            <div class="mod">
                <span class="fw-400" data-translate>{{ success.mod }}</span>
            </div>
            <div>
                <span class="width-550" data-translate>{{ success.ingredients }}</span>
                <span class="divider"><</span>
                <span data-translate>{{ success.name }}</span>
            </div>
        </div>`;

        // set code to results language
        const code = this.language.results;
        const lightmod = this.lightmod === 'true';

        // create table from objects returned in search
        obj.forEach(e => {
            this.elements.ingredients.innerHTML += `<div>
                <div class="mod">
                    ${e.mod !== 'Vanilla' ? `<span title="${e.mod}">M</span>` : ''}
                </div>
                <div>
                    <span>${e.ingredients[0].quantity} ${this.language[code].recipes[e.ingredients[0].item]}${!lightmod ? `<br><img src="img/${e.ingredients[0].item}.png"/>` : ''}</span>
                    <span class="divider">+</span>
                    <span>${e.ingredients[1].quantity} ${this.language[code].recipes[e.ingredients[1].item]}${!lightmod ? `<br><img src="img/${e.ingredients[1].item}.png"/>` : ''}</span>
                    <span class="divider"><</span>
                    <span>${this.language[code].recipes[e.name]}${!lightmod ? `<br><img src="img/${e.name}.png"/>` : ''}</span>
                </div>
            </div>`;
        });

        return this.elements.ingredients;
    },
};

let timeout;

T.elements.input.oninput = (e) => {
    const value = e.target.value;

    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
        T.display(value, 'all');
    }, 500);
};

T.init();

