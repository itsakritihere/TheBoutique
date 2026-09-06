const STORAGE_KEY_ADDED = "lookbook_added_items";
const STORAGE_KEY_DELETED = "lookbook_deleted_ids";

function loadFromStorage(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        console.error(`Could not read ${key} from storage:`, error);
        return [];
    }
}

function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Could not save ${key} to storage:`, error);
    }
}

let addedItems = loadFromStorage(STORAGE_KEY_ADDED);
let deletedIds = loadFromStorage(STORAGE_KEY_DELETED);
const state = {
    items: [],
    nextId:1,
    activeCategory: "",
    activeEra: "",
    searchTerm: "",
    isLoading: true
};

const grid = document.querySelector(".lookbook-grid");
const emptyState = document.querySelector(".empty-state");
const loadingState = document.querySelector(".loading-state");
const cardTemplate = document.getElementById("card-template");
 
const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");
const eraFilter = document.getElementById("era-filter");
const clearFiltersBtn = document.getElementById("clear-filters");
const resultCount = document.getElementById("result-count");
const clearSearchBtn = emptyState ? emptyState.querySelector(".button") : null;
 
const navCatalog = document.getElementById("nav-catalog");
const navAdd = document.getElementById("nav-add");
 
const itemForm = document.getElementById("item-form");

function imageClassFor(category) {
    const map = {
        jackets: "image-jacket",
        coats: "image-coat",
        dresses: "image-dress",
        denim: "image-jeans",
        dailywear: "image-dress",
        accessories: "image-jacket"
    };
    return map[(category || "").toLowerCase()] || "image-coat";
}


function formatPrice(price) {
    const value = Number(price) || 0;
    return `\u20B9${value.toLocaleString("en-IN")}`;
}
 
function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function buildCard(item) {
    const card = cardTemplate.content.cloneNode(true);
 
    const article = card.querySelector(".clothing-card");
    article.dataset.category = (item.category || "").toLowerCase();
 
    const imageWrap = card.querySelector(".card-image");
    imageWrap.classList.add(imageClassFor(item.category));
 
    const img = card.querySelector("img");
    img.src = item.image;
    img.alt = item.alt || item.name;
    img.loading = "lazy";
    
    img.addEventListener("error", () => {
        img.remove();
    });
 
    const numberEl = card.querySelector(".item-number");
    if (numberEl) numberEl.textContent = item.number ? `No. ${item.number}` : "";
 
    const eraEl = card.querySelector(".meta-era");
    if (eraEl) eraEl.textContent = item.era || "";
 
    const categoryEl = card.querySelector(".meta-category");
    if (categoryEl) categoryEl.textContent = item.displayCategory || capitalize(item.category);
 
    card.querySelector(".card-title").textContent = item.name;
    card.querySelector(".card-description").textContent = item.description || "";
    card.querySelector(".card-price").textContent = formatPrice(item.price);
 
    const button = card.querySelector(".details-button");
    if (button) button.setAttribute("aria-label", `View details of ${item.name}`);
    const deleteButton = card.querySelector(".delete-button");
    if (deleteButton) {
        deleteButton.addEventListener("click", () => deleteItem(item.id));
    }
    return card;
}
 
function getFilteredItems() {
    const term = state.searchTerm.trim().toLowerCase();
 
    return state.items.filter((item) => {
        const matchesCategory =
            !state.activeCategory ||
            (item.category || "").toLowerCase() === state.activeCategory;
 
        const matchesEra =
            !state.activeEra ||
            (item.era || "").toLowerCase() === state.activeEra;
 
        const matchesSearch =
            !term ||
            item.name.toLowerCase().includes(term) ||
            (item.description || "").toLowerCase().includes(term) ||
            String(item.id).includes(term);
 
        return matchesCategory && matchesEra && matchesSearch;
    });
}
function deleteItem(id) {
    state.items = state.items.filter((item) => item.id !== id);

    if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        saveToStorage(STORAGE_KEY_DELETED, deletedIds);
    }

    addedItems = addedItems.filter((item) => item.id !== id);
    saveToStorage(STORAGE_KEY_ADDED, addedItems);

    populateFilters();
    render();
}
 
function updateResultCount(count) {
    if (!resultCount) return;
    resultCount.textContent = `${count} item${count === 1 ? "" : "s"} found`;
}
 
function render() {
    if (state.isLoading) {
       if (grid) {
    grid.hidden = true;
    grid.innerHTML = "";
}
if (emptyState) emptyState.hidden = false;
        if (loadingState) loadingState.hidden = false;
        return;
    }
    if (loadingState) loadingState.hidden = true;
 
    const filtered = getFilteredItems();
    updateResultCount(filtered.length);
 
    if (filtered.length > 0) {
        if (emptyState) emptyState.hidden = true;
        if (grid) {
            grid.hidden = false;
            grid.innerHTML = "";
            filtered.forEach((item) => grid.appendChild(buildCard(item)));
        }
        return;
    }
 
    if (grid) grid.hidden = true;
    if (emptyState) emptyState.hidden = false;
}
 
/* ---------- filters ---------- */
 
function populateFilters() {
    if (!categoryFilter) return;
 
    // reset to just the default option before rebuilding
    categoryFilter.length = 1;
    if (eraFilter) eraFilter.length = 1;
 
    const categories = new Map();
    const eras = new Map();
 
    state.items.forEach((item) => {
        if (item.category) {
            const key = item.category.toLowerCase();
            if (!categories.has(key)) {
                categories.set(key, item.displayCategory || capitalize(item.category));
            }
        }
        if (item.era) {
            const key = item.era.toLowerCase();
            if (!eras.has(key)) eras.set(key, item.era);
        }
    });
 
    categories.forEach((label, value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        categoryFilter.appendChild(option);
    });
 
    if (eraFilter) {
        const eraField = eraFilter.closest(".field");
        if (eras.size === 0) {
            if (eraField) eraField.hidden = true;
        } else {
            if (eraField) eraField.hidden = false;
            eras.forEach((label, value) => {
                const option = document.createElement("option");
                option.value = value;
                option.textContent = label;
                eraFilter.appendChild(option);
            });
        }
    }
}
 const searchForm = document.getElementById("search-form");

if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        state.searchTerm = searchInput.value;
        render();
    });
}
/* ---------- data loading ---------- */
 
async function loadItems() {
    try {
        state.isLoading = true;
        render();
 
        const response = await fetch("assets/data/data.json");
        if (!response.ok) {
            throw new Error(`Failed to load data.json: ${response.status}`);
        }
 
        const data = await response.json();
        const baseItems = Array.isArray(data) ? data : [];
        const merged = [...baseItems, ...addedItems].filter(
            (item) => !deletedIds.includes(item.id)
        );
        state.items = merged;
        state.nextId = state.items.reduce((max, item) =>Math.max(max, Number(item.id) || 0), 0) + 1;
 
        state.isLoading = false;
        populateFilters();
        render();
    } catch (error) {
        console.error("Could not load lookbook items:", error);
        state.isLoading = false;
        if (grid) grid.hidden = true;
        if (loadingState) loadingState.hidden = true;
        if (emptyState) emptyState.hidden = false;
    }
}
 

 
if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        state.searchTerm = e.target.value;
        render();
    });
}
 
if (categoryFilter) {
    categoryFilter.addEventListener("change", (e) => {
        state.activeCategory = e.target.value;
        render();
    });
}
 
if (eraFilter) {
    eraFilter.addEventListener("change", (e) => {
        state.activeEra = e.target.value;
        render();
    });
}
 
function clearAllFilters() {
    state.searchTerm = "";
    state.activeCategory = "";
    state.activeEra = "";
    if (searchInput) searchInput.value = "";
    if (categoryFilter) categoryFilter.value = "";
    if (eraFilter) eraFilter.value = "";
    render();
}
 
if (clearFiltersBtn) clearFiltersBtn.addEventListener("click", clearAllFilters);
if (clearSearchBtn) clearSearchBtn.addEventListener("click", clearAllFilters);

 
function setActiveNav(button) {
    [navCatalog, navAdd].forEach((btn) => {
        if (!btn) return;
        const isActive = btn === button;
        btn.classList.toggle("is-active", isActive);
        if (isActive) {
            btn.setAttribute("aria-current", "page");
        } else {
            btn.removeAttribute("aria-current");
        }
    });
}
 
if (navCatalog) {
    navCatalog.addEventListener("click", () => {
        setActiveNav(navCatalog);
        document.getElementById("lookbook")?.scrollIntoView({ behavior: "smooth" });
    });
}
 
if (navAdd) {
    navAdd.addEventListener("click", () => {
        setActiveNav(navAdd);
        document.getElementById("add-item")?.scrollIntoView({ behavior: "smooth" });
    });
}
 

 
function setFieldError(field, hasError) {
    const wrapper = field.closest(".form-field");
    if (wrapper) wrapper.classList.toggle("has-error", hasError);
}
 
if (itemForm) {
    itemForm.addEventListener("submit", (e) => {
        e.preventDefault();
 
        const nameField = document.getElementById("item-name");
        const categoryField = document.getElementById("item-category");
        const eraField = document.getElementById("item-era");
        const priceField = document.getElementById("item-price");
        const descriptionField = document.getElementById("item-description");
 
        const name = nameField.value.trim();
        const category = categoryField.value;
        const price = priceField.value;
 
        let isValid = true;
 
        setFieldError(nameField, !name);
        if (!name) isValid = false;
 
        setFieldError(categoryField, !category);
        if (!category) isValid = false;
 
        const priceIsValid = price !== "" && Number(price) >= 0;
        setFieldError(priceField, !priceIsValid);
        if (!priceIsValid) isValid = false;
 
        if (!isValid) return;
 
        const categoryLabel = categoryField.options[categoryField.selectedIndex].textContent.trim();
 
        const newItem = {
            id: state.nextId++,
            number: String(state.items.length + 1).padStart(2, "0"),
            name,
            displayCategory: categoryLabel,
            category,
            era: eraField.value.trim(),
            price: Number(price),
            image: "",
            alt: name,
            description: descriptionField.value.trim()
        };
 
        state.items.push(newItem);
        addedItems.push(newItem);
        saveToStorage(STORAGE_KEY_ADDED, addedItems);

    populateFilters();
    render();
 
        console.log("[Analytics] User interacted with Vintage Clothing Boutique Lookbook: item added");
 
        itemForm.reset();
        [nameField, categoryField, priceField].forEach((field) => setFieldError(field, false));
 
        document.getElementById("lookbook")?.scrollIntoView({ behavior: "smooth" });
        setActiveNav(navCatalog);
    });
}
 
loadItems();