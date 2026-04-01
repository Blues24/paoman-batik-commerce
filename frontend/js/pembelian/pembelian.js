const searchInput = document.querySelector("[data-search-input]");
const categoryFilters = Array.from(document.querySelectorAll("[data-category-filter]"));
const priceRange = document.querySelector("[data-price-range]");
const priceValue = document.querySelector("[data-price-value]");
const productCards = Array.from(document.querySelectorAll(".product-card"));
const emptyState = document.querySelector("[data-empty-state]");

function formatRupiahShort(value) {
    if (value >= 1000000) {
        return `Rp ${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}jt`;
    }

    return `Rp ${Math.round(value / 1000)}rb`;
}

function getActiveCategory() {
    const activeFilter = categoryFilters.find((input) => input.checked);
    return activeFilter ? activeFilter.value : "all";
}

function updatePriceLabel() {
    if (!priceRange || !priceValue) return;
    priceValue.textContent = formatRupiahShort(Number(priceRange.value));
}

function filterProducts() {
    const keyword = (searchInput?.value || "").trim().toLowerCase();
    const activeCategory = getActiveCategory();
    const maxPrice = Number(priceRange?.value || 5000000);

    let visibleCount = 0;

    productCards.forEach((card) => {
        const name = (card.dataset.name || "").toLowerCase();
        const category = (card.dataset.category || "").toLowerCase();
        const price = Number(card.dataset.price || 0);

        const matchesKeyword = !keyword || name.includes(keyword);
        const matchesCategory = activeCategory === "all" || category === activeCategory;
        const matchesPrice = price <= maxPrice;
        const isVisible = matchesKeyword && matchesCategory && matchesPrice;

        card.classList.toggle("is-hidden", !isVisible);

        if (isVisible) {
            visibleCount += 1;
        }
    });

    if (emptyState) {
        emptyState.classList.toggle("is-visible", visibleCount === 0);
    }
}

categoryFilters.forEach((input) => {
    input.addEventListener("change", () => {
        categoryFilters.forEach((item) => {
            item.checked = item === input;
        });

        filterProducts();
    });
});

searchInput?.addEventListener("input", filterProducts);
priceRange?.addEventListener("input", () => {
    updatePriceLabel();
    filterProducts();
});

updatePriceLabel();
filterProducts();
