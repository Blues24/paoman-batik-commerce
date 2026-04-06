const CART_KEY = "batikPaomanCart";

const produkBatik = [
    { id: 1, nama: "Kain Batik Motif Tangga Istana", kategori: "kain", harga: 50000, tag: "BEST SELLER" },
    { id: 2, nama: "Kain Batik Motif Godong Asem", kategori: "kain", harga: 50000, tag: "NEW ARRIVAL" },
    { id: 3, nama: "Baju Motif Batik Kentangan", kategori: "pakaian", harga: 100000, tag: "" },
    { id: 4, nama: "Kain Batik Motif Mangga Bambu", kategori: "kain", harga: 65000, tag: "" },
    { id: 5, nama: "Kain Batik Kembang Gunda", kategori: "kain", harga: 65000, tag: "" },
    { id: 6, nama: "Kemeja Motif Batik Kembang Gunda", kategori: "pakaian", harga: 100000, tag: "" },
    { id: 7, nama: "Kain Batik Motif Lereng Paoman", kategori: "kain", harga: 75000, tag: "" },
    { id: 8, nama: "Blus Batik Motif Pesisir", kategori: "pakaian", harga: 120000, tag: "" },
    { id: 9, nama: "Kain Batik Motif Daun Nila", kategori: "kain", harga: 85000, tag: "" },
    { id: 10, nama: "Kemeja Batik Motif Kawung Laut", kategori: "pakaian", harga: 135000, tag: "" },
    { id: 11, nama: "Kain Batik Motif Mega Mendung Paoman", kategori: "kain", harga: 90000, tag: "" },
    { id: 12, nama: "Outer Batik Motif Sekar Jagad", kategori: "pakaian", harga: 145000, tag: "" },
    { id: 13, nama: "Kain Batik Motif Bunga Cengkeh", kategori: "kain", harga: 95000, tag: "" },
    { id: 14, nama: "Tunik Batik Motif Parang Kecil", kategori: "pakaian", harga: 150000, tag: "" },
    { id: 15, nama: "Kain Batik Motif Ombak Indramayu", kategori: "kain", harga: 110000, tag: "" }
];

const itemPerPage = 6;
let currentPage = 1;
let filteredProducts = [...produkBatik];

const productGrid = document.getElementById("productGrid");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchProduk");
const priceRange = document.getElementById("priceRange");
const priceValue = document.getElementById("priceValue");
const categoryFilters = Array.from(document.querySelectorAll(".category-filter"));
const pageButtons = Array.from(document.querySelectorAll(".page-number"));
const prevPageButton = document.getElementById("prevPage");
const nextPageButton = document.getElementById("nextPage");
const cartCount = document.getElementById("cartCount");
const cartConfirmOverlay = document.getElementById("cartConfirmOverlay");
const cartConfirmMessage = document.getElementById("cartConfirmMessage");
const continueShoppingBtn = document.getElementById("continueShoppingBtn");

function formatRupiah(angka) {
    return `Rp.${angka.toLocaleString("id-ID")}`;
}

function formatRingkas(angka) {
    if (angka >= 1000000) {
        return `Rp ${(angka / 1000000).toLocaleString("id-ID")}jt`;
    }

    return `Rp ${Math.round(angka / 1000)}rb`;
}

function getCartItems() {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
        return [];
    }
}

function saveCartItems(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function updateCartCount() {
    const totalItems = getCartItems().reduce((sum, item) => sum + item.qty, 0);
    cartCount.textContent = totalItems;
}

function showCartConfirmation(productName) {
    cartConfirmMessage.textContent = `${productName} sudah masuk ke keranjang. Mau lanjut belanja atau buka keranjang sekarang?`;
    cartConfirmOverlay.classList.remove("d-none");
}

function hideCartConfirmation() {
    cartConfirmOverlay.classList.add("d-none");
}

function getSelectedCategories() {
    const checked = categoryFilters
        .filter((input) => input.checked)
        .map((input) => input.value);

    if (checked.includes("semua") || checked.length === 0) {
        return ["kain", "pakaian"];
    }

    return checked;
}

function getTotalPages() {
    return Math.max(1, Math.ceil(filteredProducts.length / itemPerPage));
}

function updatePagination() {
    const totalPages = getTotalPages();

    pageButtons.forEach((button) => {
        const page = Number(button.dataset.page);
        button.classList.toggle("active", page === currentPage);
        button.disabled = page > totalPages;
    });

    prevPageButton.disabled = currentPage === 1 || filteredProducts.length === 0;
    nextPageButton.disabled = currentPage === totalPages || filteredProducts.length === 0;
}

function renderProduk() {
    productGrid.innerHTML = "";

    if (filteredProducts.length === 0) {
        emptyState.classList.remove("d-none");
        updatePagination();
        return;
    }

    emptyState.classList.add("d-none");

    const startIndex = (currentPage - 1) * itemPerPage;
    const visibleProducts = filteredProducts.slice(startIndex, startIndex + itemPerPage);

    visibleProducts.forEach((item) => {
        const kategoriLabel = item.kategori === "kain" ? "Kain Batik" : "Pakaian";

        productGrid.innerHTML += `
            <article class="product-card">
                <div class="product-media">
                    ${item.tag ? `<span class="product-badge">${item.tag}</span>` : ""}
                    <div class="product-image-placeholder" aria-label="Area gambar produk kosong">
                        Tempat gambar produk
                    </div>
                </div>
                <div class="product-body">
                    <p class="product-category">${kategoriLabel}</p>
                    <h3 class="product-title">${item.nama}</h3>
                    <div class="product-footer">
                        <span class="product-price">${formatRupiah(item.harga)}</span>
                        <button class="cart-button" type="button" onclick="tambahKeKeranjang(${item.id})">
                            <i class="bi bi-cart"></i>
                        </button>
                    </div>
                </div>
            </article>
        `;
    });

    updatePagination();
}

function applyFilters() {
    const keyword = searchInput.value.trim().toLowerCase();
    const maxHarga = Number(priceRange.value);
    const selectedCategories = getSelectedCategories();

    filteredProducts = produkBatik.filter((produk) => {
        const sesuaiNama = produk.nama.toLowerCase().includes(keyword);
        const sesuaiKategori = selectedCategories.includes(produk.kategori);
        const sesuaiHarga = produk.harga <= maxHarga;

        return sesuaiNama && sesuaiKategori && sesuaiHarga;
    });

    currentPage = 1;
    renderProduk();
}

function syncSemuaProduk(triggeredInput) {
    const semuaInput = categoryFilters.find((input) => input.value === "semua");
    const detailInputs = categoryFilters.filter((input) => input.value !== "semua");

    if (triggeredInput.value === "semua") {
        detailInputs.forEach((input) => {
            input.checked = semuaInput.checked;
        });
        return;
    }

    const allChecked = detailInputs.every((input) => input.checked);
    const noneChecked = detailInputs.every((input) => !input.checked);

    semuaInput.checked = allChecked || noneChecked;

    if (noneChecked) {
        detailInputs.forEach((input) => {
            input.checked = true;
        });
        semuaInput.checked = true;
    }
}

function tambahKeKeranjang(productId) {
    const selectedProduct = produkBatik.find((product) => product.id === productId);

    if (!selectedProduct) {
        return;
    }

    const cartItems = getCartItems();
    const existingItem = cartItems.find((item) => item.id === productId);

    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cartItems.push({
            id: selectedProduct.id,
            nama: selectedProduct.nama,
            kategori: selectedProduct.kategori,
            harga: selectedProduct.harga,
            qty: 1
        });
    }

    saveCartItems(cartItems);
    updateCartCount();
    showCartConfirmation(selectedProduct.nama);
}

searchInput.addEventListener("input", applyFilters);

priceRange.addEventListener("input", (event) => {
    priceValue.textContent = formatRingkas(Number(event.target.value));
    applyFilters();
});

categoryFilters.forEach((input) => {
    input.addEventListener("change", (event) => {
        syncSemuaProduk(event.target);
        applyFilters();
    });
});

pageButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const targetPage = Number(button.dataset.page);

        if (button.disabled || targetPage === currentPage) {
            return;
        }

        currentPage = targetPage;
        renderProduk();
    });
});

prevPageButton.addEventListener("click", () => {
    if (currentPage === 1) {
        return;
    }

    currentPage -= 1;
    renderProduk();
});

nextPageButton.addEventListener("click", () => {
    if (currentPage === getTotalPages()) {
        return;
    }

    currentPage += 1;
    renderProduk();
});

continueShoppingBtn.addEventListener("click", hideCartConfirmation);

cartConfirmOverlay.addEventListener("click", (event) => {
    if (event.target === cartConfirmOverlay) {
        hideCartConfirmation();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !cartConfirmOverlay.classList.contains("d-none")) {
        hideCartConfirmation();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    priceValue.textContent = formatRingkas(Number(priceRange.value));
    updateCartCount();
    renderProduk();
});
