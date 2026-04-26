const CART_KEY = "batikPaomanCart";

// Data statis sebagai fallback kalau backend belum jalan.
const produkBatikFallback = [
    { id: 1, nama: "Kain Batik Motif Biru Pesisir", kategori: "kain", harga: 50000, tag: "Produk Terlaris", image: "../img/batik1.jpg", detail_batik_id: 1 },
    { id: 2, nama: "Kain Batik Motif Godong Asem", kategori: "kain", harga: 50000, tag: "", image: "../img/batik2.jpg", detail_batik_id: 2 },
    { id: 3, nama: "Baju Batik Motif Kentangan", kategori: "pakaian", harga: 100000, tag: "Produk Baru", image: "../img/baju1.png", detail_batik_id: 3 },
    { id: 4, nama: "Kain Batik Motif Mangga Bambu", kategori: "kain", harga: 65000, tag: "", image: "../img/batik4.jpg", detail_batik_id: 4 },
    { id: 5, nama: "Kain Batik Motif Kembang Gunda", kategori: "kain", harga: 65000, tag: "", image: "../img/batik5.jpg", detail_batik_id: 5 },
    { id: 6, nama: "Kemeja Batik Motif Kembang Paoman", kategori: "pakaian", harga: 100000, tag: "", image: "../img/baju2.png", detail_batik_id: 6 },
    { id: 7, nama: "Kain Batik Motif Lereng Paoman", kategori: "kain", harga: 75000, tag: "", image: "../img/batik7.jpg", detail_batik_id: 7 },
    { id: 8, nama: "Blus Batik Motif Pesisir Laut", kategori: "pakaian", harga: 120000, tag: "", image: "../img/baju3.png", detail_batik_id: 8 },
    { id: 9, nama: "Kain Batik Motif Daun Nila", kategori: "kain", harga: 85000, tag: "", image: "../img/batik9.jpg", detail_batik_id: 9 },
    { id: 10, nama: "Kemeja Batik Motif Kawung Laut", kategori: "pakaian", harga: 135000, tag: "", image: "../img/baju4.png", detail_batik_id: 10 },
    { id: 11, nama: "Kain Batik Motif Biru Pesisir Premium", kategori: "kain", harga: 90000, tag: "", image: "../img/batik1.jpg", detail_batik_id: 11 },
    { id: 12, nama: "Outer Batik Motif Godong Asem", kategori: "pakaian", harga: 145000, tag: "", image: "../img/baju5.png", detail_batik_id: 12 },
    { id: 13, nama: "Tunik Batik Motif Kentangan", kategori: "pakaian", harga: 95000, tag: "", image: "../img/baju6.png", detail_batik_id: 13 },
    { id: 14, nama: "Dress Batik Motif Mangga Bambu", kategori: "pakaian", harga: 150000, tag: "", image: "../img/baju7.png", detail_batik_id: 14 },
    { id: 15, nama: "Kain Batik Motif Kembang Gunda Premium", kategori: "kain", harga: 110000, tag: "", image: "../img/batik5.jpg", detail_batik_id: 15 }
];

let produkBatik = [...produkBatikFallback];

const API_URL = "http://localhost:8000/api";

const imageByName = new Map(produkBatikFallback.map((item) => [item.nama, item.image]));

function guessKategoriFromNama(namaProduk) {
    const nama = String(namaProduk || "").toLowerCase();
    return nama.includes("kain") ? "kain" : "pakaian";
}

async function apiGetJson(endpoint) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        }
    });
    const data = await response.json().catch(() => null);
    return { response, data };
}

async function loadProdukFromApi() {
    const { response, data } = await apiGetJson("/produk");
    if (!response.ok || !data?.success || !Array.isArray(data.data)) {
        throw new Error(data?.message || "Gagal memuat produk dari API.");
    }

    const list = data.data;

    const detailResults = await Promise.allSettled(
        list.map((produk) => apiGetJson(`/produk/${produk.produk_id}`))
    );

    produkBatik = list.map((produk, idx) => {
        const detail = detailResults[idx];
        const detailData =
            detail?.status === "fulfilled" && detail.value?.data?.success
                ? detail.value.data.data
                : null;

        const varian = Array.isArray(detailData?.varian) ? detailData.varian : [];
        const defaultVarian = varian[0] || null;

        const harga =
            defaultVarian?.harga != null
                ? Number(defaultVarian.harga)
                : Number(produk.harga_mulai || 0);

        return {
            id: Number(produk.produk_id),
            detail_batik_id: defaultVarian ? Number(defaultVarian.detail_batik_id) : Number(produk.produk_id),
            nama: produk.nama_produk,
            kategori: guessKategoriFromNama(produk.nama_produk),
            harga: Number.isFinite(harga) ? harga : 0,
            tag: "",
            image: imageByName.get(produk.nama_produk) || produkBatikFallback[idx % produkBatikFallback.length]?.image || ""
        };
    });
}

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
    if (!cartConfirmOverlay || !cartConfirmMessage) {
        return;
    }

    cartConfirmMessage.textContent = `${productName} sudah masuk ke keranjang. Mau lanjut belanja atau buka keranjang sekarang?`;
    cartConfirmOverlay.classList.remove("d-none");
}

function hideCartConfirmation() {
    if (cartConfirmOverlay) {
        cartConfirmOverlay.classList.add("d-none");
    }
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

    const cartItems = getCartItems();
    const existingItem = cartItems.find((item) => item.id === productId);

    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cartItems.push({
            id: selectedProduct.id,
            detail_batik_id: selectedProduct.detail_batik_id || selectedProduct.id,
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

if (priceRange) {
    priceRange.addEventListener("input", (event) => {
        priceValue.textContent = formatRingkas(Number(event.target.value));
        applyFilters();
    });
}

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

if (prevPageButton) {
    prevPageButton.addEventListener("click", () => {
        if (currentPage === 1) {
            return;
        }

        currentPage -= 1;
        renderProduk();
    });
}

if (nextPageButton) {
    nextPageButton.addEventListener("click", () => {
        if (currentPage === getTotalPages()) {
            return;
        }

        currentPage += 1;
        renderProduk();
    });
}

if (continueShoppingBtn) {
    continueShoppingBtn.addEventListener("click", hideCartConfirmation);
}

if (cartConfirmOverlay) {
    cartConfirmOverlay.addEventListener("click", (event) => {
        if (event.target === cartConfirmOverlay) {
            hideCartConfirmation();
        }
    });
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && cartConfirmOverlay && !cartConfirmOverlay.classList.contains("d-none")) {
        hideCartConfirmation();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    if (priceValue && priceRange) {
        priceValue.textContent = formatRingkas(Number(priceRange.value));
    }

    updateCartCount();
    (async () => {
        try {
            await loadProdukFromApi();
        } catch (err) {
            console.warn("[Produk] fallback ke data statis:", err?.message || err);
            produkBatik = [...produkBatikFallback];
        }

        // Sync state ke data terbaru.
        filteredProducts = [...produkBatik];

        if (priceRange) {
            const max = produkBatik.reduce((m, p) => Math.max(m, Number(p.harga) || 0), 0);
            if (max > 0) {
                priceRange.max = String(max);
                if (Number(priceRange.value) > max) {
                    priceRange.value = String(max);
                }
                if (priceValue) {
                    priceValue.textContent = formatRingkas(Number(priceRange.value));
                }
            }
        }

        applyFilters();
    })();
});
