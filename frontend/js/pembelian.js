const CART_KEY = "batikPaomanCart";

// Pusat data katalog produk yang ditampilkan di halaman pembelian.
const produkBatik = [
    { id: 1, nama: "Kain Batik Motif Biru Pesisir", kategori: "kain", harga: 50000, tag: "Produk Terlaris", image: "../img/batik1.jpg" },
    { id: 2, nama: "Kain Batik Motif Godong Asem", kategori: "kain", harga: 50000, tag: "", image: "../img/batik2.jpg" },
    { id: 3, nama: "Baju Batik Motif Kentangan", kategori: "pakaian", harga: 100000, tag: "Produk Baru", image: "../img/baju1.png" },
    { id: 4, nama: "Kain Batik Motif Mangga Bambu", kategori: "kain", harga: 65000, tag: "", image: "../img/batik4.jpg" },
    { id: 5, nama: "Kain Batik Motif Kembang Gunda", kategori: "kain", harga: 65000, tag: "", image: "../img/batik5.jpg" },
    { id: 6, nama: "Kemeja Batik Motif Kembang Paoman", kategori: "pakaian", harga: 100000, tag: "", image: "../img/baju2.png" },
    { id: 7, nama: "Kain Batik Motif Lereng Paoman", kategori: "kain", harga: 75000, tag: "", image: "../img/batik7.jpg" },
    { id: 8, nama: "Blus Batik Motif Pesisir Laut", kategori: "pakaian", harga: 120000, tag: "", image: "../img/baju3.png" },
    { id: 9, nama: "Kain Batik Motif Daun Nila", kategori: "kain", harga: 85000, tag: "", image: "../img/batik9.jpg" },
    { id: 10, nama: "Kemeja Batik Motif Kawung Laut", kategori: "pakaian", harga: 135000, tag: "", image: "../img/baju4.png" },
    { id: 11, nama: "Kain Batik Motif Biru Pesisir Premium", kategori: "kain", harga: 90000, tag: "", image: "../img/batik1.jpg" },
    { id: 12, nama: "Outer Batik Motif Godong Asem", kategori: "pakaian", harga: 145000, tag: "", image: "../img/baju5.png" },
    { id: 13, nama: "Tunik Batik Motif Kentangan", kategori: "pakaian", harga: 95000, tag: "", image: "../img/baju6.png" },
    { id: 14, nama: "Dress Batik Motif Mangga Bambu", kategori: "pakaian", harga: 150000, tag: "", image: "../img/baju7.png" },
    { id: 15, nama: "Kain Batik Motif Kembang Gunda Premium", kategori: "kain", harga: 110000, tag: "", image: "../img/batik5.jpg" }
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
    if (!cartCount) {
        return;
    }

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

    // Produk dibagi per halaman supaya katalog tetap rapi.
    const startIndex = (currentPage - 1) * itemPerPage;
    const visibleProducts = filteredProducts.slice(startIndex, startIndex + itemPerPage);

    visibleProducts.forEach((item) => {
        const kategoriLabel = item.kategori === "kain" ? "Kain Batik" : "Pakaian";

        productGrid.innerHTML += `
            <article class="product-card">
                <div class="product-media">
                    ${item.tag ? `<span class="product-badge">${item.tag}</span>` : ""}
                    <img src="${item.image}" alt="${item.nama}" class="product-image">
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
    // Filter digabung dari search, kategori, dan batas harga.
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
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

    // Produk yang dipilih disimpan ke localStorage supaya bisa dibaca halaman pemesanan.
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
            image: selectedProduct.image,
            qty: 1
        });
    }

    saveCartItems(cartItems);
    updateCartCount();
    showCartConfirmation(selectedProduct.nama);
}

if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
}

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
