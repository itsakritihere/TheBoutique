
const state = {
    items: [],
    activeCategory: "all",
    searchTerm: "",
    isLoading: true
};

const grid = document.querySelector(".lookbook-grid");
const emptyState = document.querySelector(".empty-state");
const searchInput = document.getElementById("search");
const filterButtons = document.querySelectorAll(".filter-button");
const clearSearchBtn = document.querySelector(".empty-state .button");
const cardTemplate = document.getElementById("card-template");
const loadingState = document.querySelector(".loading-state");
const searchForm = document.getElementById("search-form");
function imageClassFor(category) {
    const map = {
        jackets: "image-jacket",
        coats: "image-coat",
        dresses: "image-dress",
        denim: "image-jeans",
    };
    return map[category] || "image-coat";
}


function formatPrice(price) {
    return `${price.toLocaleString("en-IN")}`;
}
function buildCard(item) {
    const card = cardTemplate.content.cloneNode(true);

    const article = card.querySelector(".clothing-card");
    article.dataset.category = item.category;

    const imageWrap = card.querySelector(".card-image");
    imageWrap.classList.add(imageClassFor(item.category));

    const img = card.querySelector("img");
    img.src = item.image;
    img.alt = item.alt;

    card.querySelector(".item-number").textContent = item.number;
    card.querySelector(".meta-category").textContent = item.displayCategory;
    card.querySelector(".card-title").textContent = item.name;
    card.querySelector(".card-description").textContent = item.description;
    card.querySelector(".card-price").textContent = formatPrice(item.price);
    const button = card.querySelector(".details-button");
    button.setAttribute("aria-label", `View details of ${item.name}`);

    return card;
}

function getFilteredItems() {
    return state.items.filter((item) => {
        const matchesCategory =
        state.activeCategory === "all" ||
            item.category === state.activeCategory;

        const matchesSearch = item.name
            .toLowerCase()
            .includes(state.searchTerm.toLowerCase());

        return matchesCategory && matchesSearch;
    });
}

function render() {
    if(state.isLoading){
        grid.hidden = true;
        emptyState.hidden = true;
        loadingState.hidden = false;
        return;
    }
    loadingState.hidden= true;

    const filtered = getFilteredItems();

    if (filtered.length > 0) {
       

   
    emptyState.hidden = true;
        grid.hidden = false;
    grid.innerHTML = "";

    filtered.forEach((item) => {
        grid.appendChild(buildCard(item));
    });
    return;
}
grid.hidden = true;
    emptyState.hidden = false;
}

function setActiveFilter(category, clickedButton) {
    state.activeCategory = category;

    filterButtons.forEach((btn) => {
        const isActive = btn === clickedButton;
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-pressed", String(isActive));
    });

    render();
}

async function loadItems() {
    try {
        state.isLoading =true;
        render();

        const response = await fetch("../assets/data/data.json");
        if (!response.ok) {
            throw new Error(`Failed to load items.json: ${response.status}`);
        }
        state.items = await response.json();
        state.isLoading = false;
        render();
    } catch (error) {
        console.error("Could not load lookbook items:", error);
        state.isLoading = false;
        grid.hidden = true;
        loadingState.hidden = true;
        emptyState.hidden = false;
    }  
}

filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        const label = btn.textContent.trim().toLowerCase();
        const category = label === "all" ? "all" : label;
        setActiveFilter(category, btn);
    });
});

searchInput.addEventListener("input", (e) => {
    state.searchTerm = e.target.value;
    render();
});

if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
        state.searchTerm = "";
        searchInput.value = "";
        setActiveFilter("all", filterButtons[0]);
    });
}

loadItems();