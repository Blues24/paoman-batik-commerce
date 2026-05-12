(() => {
const CART_KEY = "batikPaomanCart";

// Data statis sebagai fallback kalau backend belum jalan.
const produkBatikFallback = [
    { id: 1, nama: "Kain Batik Motif Ganggeng Pesisir", kategori: "kain", harga: 75000, tag: "Produk Terlaris", image: "../img/batik1.jpg", detail_batik_id: 1 },
    { id: 2, nama: "Kain Batik Motif Jarot Asem", kategori: "kain", harga: 50000, tag: "", image: "../img/batik2.jpg", detail_batik_id: 2 },
    { id: 3, nama: "Kain Batik Motif Kapal Kandas", kategori: "kain", harga: 65000, tag: "", image: "../img/batik3.jpg", detail_batik_id: 3 },
    { id: 4, nama: "Kain Batik Motif Kembang Gunda", kategori: "kain", harga: 65000, tag: "", image: "../img/batik4.jpg", detail_batik_id: 4 },
    { id: 5, nama: "Kain Batik Motif Banji Tepak", kategori: "kain", harga: 70000, tag: "", image: "../img/batik5.jpg", detail_batik_id: 5 },
    { id: 6, nama: "Kain Batik Motif Lokcan", kategori: "kain", harga: 85000, tag: "", image: "../img/batik6.jpg", detail_batik_id: 6 },
    { id: 7, nama: "Kain Batik Motif Lasem Urang", kategori: "kain", harga: 90000, tag: "", image: "../img/batik7.jpg", detail_batik_id: 7 },
    { id: 8, nama: "Kain Batik Motif Kembang Gunda Premium", kategori: "kain", harga: 85000, tag: "", image: "../img/batik8.jpg", detail_batik_id: 8 },
    { id: 9, nama: "Kain Batik Motif Iwak Etong", kategori: "kain", harga: 95000, tag: "", image: "../img/batik9.jpg", detail_batik_id: 9 },
    { id: 10, nama: "Kain Batik Motif Kapal Laju", kategori: "kain", harga: 100000, tag: "", image: "../img/batik10.jpg", detail_batik_id: 10 },
    { id: 11, nama: "Baju Batik Motif Kembang Kapas", kategori: "pakaian", harga: 100000, tag: "Produk Baru", image: "../img/baju1.png", detail_batik_id: 11 },
    { id: 12, nama: "Kemeja Batik Motif Iwak Etong", kategori: "pakaian", harga: 100000, tag: "", image: "../img/baju2.png", detail_batik_id: 12 },
    { id: 13, nama: "Blus Batik Motif Kembang Karang", kategori: "pakaian", harga: 120000, tag: "", image: "../img/baju3.png", detail_batik_id: 13 },
    { id: 14, nama: "Kemeja Batik Motif Kapal Laju", kategori: "pakaian", harga: 135000, tag: "", image: "../img/baju4.png", detail_batik_id: 14 },
    { id: 15, nama: "Outer Batik Motif Jarot Asem", kategori: "pakaian", harga: 95000, tag: "", image: "../img/baju5.png", detail_batik_id: 15 },
    { id: 16, nama: "Tunik Batik Motif Kembang Kapas", kategori: "pakaian", harga: 95000, tag: "", image: "../img/baju6.png", detail_batik_id: 16 },
    { id: 17, nama: "Dress Batik Motif Kapal Kandas", kategori: "pakaian", harga: 150000, tag: "", image: "../img/baju7.png", detail_batik_id: 17 }
];

let produkBatik = [...produkBatikFallback];

const DEFAULT_API_BASE = "http://localhost/paoman-batik/backend/public/api";
const API_URL = window.API_URL || DEFAULT_API_BASE;

const legacyImageByName = {
    "Kain Batik Motif Ganggeng Pesisir": "../img/batik1.jpg",
    "Kain Batik Motif Jarot Asem": "../img/batik2.jpg",
    "Kain Batik Motif Kapal Kandas": "../img/batik3.jpg",
    "Kain Batik Motif Kembang Gunda": "../img/batik4.jpg",
    "Kain Batik Motif Banji Tepak": "../img/batik5.jpg",
    "Kain Batik Motif Lokcan": "../img/batik6.jpg",
    "Kain Batik Motif Lasem Urang": "../img/batik7.jpg",
    "Kain Batik Motif Kembang Gunda Premium": "../img/batik8.jpg",
    "Kain Batik Motif Iwak Etong": "../img/batik9.jpg",
    "Kain Batik Motif Kapal Laju": "../img/batik10.jpg",
    "Baju Batik Motif Kembang Kapas": "../img/baju1.png",
    "Kemeja Batik Motif Iwak Etong": "../img/baju2.png",
    "Blus Batik Motif Kembang Karang": "../img/baju3.png",
    "Kemeja Batik Motif Kapal Laju": "../img/baju4.png",
    "Outer Batik Motif Jarot Asem": "../img/baju5.png",
    "Tunik Batik Motif Kembang Kapas": "../img/baju6.png",
    "Dress Batik Motif Kapal Kandas": "../img/baju7.png"
};
const imageByName = new Map([
    ...Object.entries(legacyImageByName),
    ...produkBatikFallback.map((item) => [item.nama, item.image])
]);
const canonicalProductByName = new Map(produkBatikFallback.map((item) => [item.nama, item]));

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

        // Ambil detail untuk mendapatkan varian/harga terbaru
        const detailResults = await Promise.allSettled(
            list.map((produk) => apiGetJson(`/produk/${produk.produk_id}`))
        );

        const mapped = list.map((produk, idx) => {
            const detail = detailResults[idx];
            const detailData = detail?.status === "fulfilled" && detail.value?.data?.success
                ? detail.value.data.data
                : null;

            const varian = Array.isArray(detailData?.varian) ? detailData.varian : [];
            const defaultVarian = varian[0] || null;

            // Penentuan Harga
            const harga = defaultVarian?.harga != null
                ? Number(defaultVarian.harga)
                : Number(produk.harga_mulai || 0);

            // Penentuan Kategori
            const canonical = canonicalProductByName.get(produk.nama_produk);
            const kategori = canonical?.kategori || guessKategoriFromNama(produk.nama_produk);

            const finalImage = normalizeProductImage(produk.gambar_produk || "", canonical?.image || "../img/batik1.jpg");

            return {
                id: Number(produk.produk_id),
                detail_batik_id: defaultVarian ? Number(defaultVarian.detail_batik_id) : Number(produk.produk_id),
                stok: Number(produk.total_stok || 0),
                nama: produk.nama_produk,
                kategori,
                harga: Number.isFinite(harga) ? harga : 0,
                tag: Number(produk.total_stok) <= 0 ? "Habis" : "",
                image: finalImage
            };
        });

        const apiByName = new Map();
        mapped.forEach((item) => {
            if (!apiByName.has(item.nama)) apiByName.set(item.nama, item);
        });

        const mergedFallbacks = produkBatikFallback.map((fallback) => ({
            ...fallback,
            ...(apiByName.get(fallback.nama) || {})
        })).sort((a, b) => {
            const orderA = canonicalProductByName.get(a.nama)?.id || 999;
            const orderB = canonicalProductByName.get(b.nama)?.id || 999;
            return orderA - orderB;
        });

        const newProducts = mapped
            .filter(item => !canonicalProductByName.has(item.nama))
            .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));

        // Produk baru dari admin ditaruh paling depan agar langsung terlihat di halaman user.
        produkBatik = [...newProducts, ...mergedFallbacks];
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
const prevPageButton = document.getElementById("prevPage");
const nextPageButton = document.getElementById("nextPage");
const catalogPagination = document.getElementById("catalogPagination");
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

function normalizeProductImage(rawPath, fallbackImage = "../img/batik1.jpg") {
    if (!rawPath) return fallbackImage;
    if (rawPath.startsWith("http")) return rawPath;
    if (rawPath.startsWith("../img/")) return rawPath;
    if (rawPath.includes("uploads/")) return `../img/uploads/${rawPath.split("/").pop()}`;
    if (rawPath.startsWith("produk_")) return `../img/uploads/${rawPath}`;
    if (rawPath.startsWith("batik") || rawPath.startsWith("baju")) return `../img/${rawPath}`;
    return fallbackImage;
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

function normalizeCategorySelection(triggeredInput) {
    if (!triggeredInput.checked) {
        const checkedDetail = categoryFilters.filter((input) => input.value !== "semua" && input.checked);
        if (checkedDetail.length === 0) {
            triggeredInput.checked = true;
        }
        return;
    }

    if (triggeredInput.value === "semua") {
        categoryFilters.forEach((input) => {
            input.checked = input.value === "semua";
        });
        return;
    }

    categoryFilters.forEach((input) => {
        input.checked = input === triggeredInput;
    });
}

function getTotalPages() {
    return Math.max(1, Math.ceil(filteredProducts.length / itemPerPage));
}

function getPaginationItems(totalPages, activePage) {
    if (totalPages <= 5) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set([1, totalPages, activePage, activePage - 1, activePage + 1]);
    const validPages = Array.from(pages)
        .filter((page) => page >= 1 && page <= totalPages)
        .sort((a, b) => a - b);

    return validPages.reduce((items, page, index) => {
        if (index > 0 && page - validPages[index - 1] > 1) {
            items.push("ellipsis");
        }
        items.push(page);
        return items;
    }, []);
}

function goToPage(page, shouldScroll = true) {
    const totalPages = getTotalPages();
    const targetPage = Math.min(Math.max(Number(page) || 1, 1), totalPages);

    if (targetPage === currentPage) {
        return;
    }

    currentPage = targetPage;
    renderProduk();

    if (shouldScroll) {
        document.querySelector(".catalog-header")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function updatePagination() {
    const totalPages = getTotalPages();
    const hasMultiplePages = filteredProducts.length > itemPerPage;

    currentPage = Math.min(Math.max(currentPage, 1), totalPages);

    if (!catalogPagination) {
        return;
    }

    catalogPagination.classList.toggle("d-none", !hasMultiplePages);
    if (!hasMultiplePages) {
        return;
    }

    catalogPagination.querySelectorAll(".page-number, .page-ellipsis").forEach((item) => item.remove());

    getPaginationItems(totalPages, currentPage).forEach((item) => {
        if (item === "ellipsis") {
            const ellipsis = document.createElement("span");
            ellipsis.className = "page-ellipsis";
            ellipsis.textContent = "...";
            catalogPagination.insertBefore(ellipsis, nextPageButton);
            return;
        }

        const button = document.createElement("button");
        button.type = "button";
        button.className = "page-btn page-number";
        button.dataset.page = String(item);
        button.textContent = String(item);
        button.classList.toggle("active", item === currentPage);
        button.setAttribute("aria-label", `Halaman ${item}`);
        button.setAttribute("aria-current", item === currentPage ? "page" : "false");
        catalogPagination.insertBefore(button, nextPageButton);
    });

    if (prevPageButton) {
        prevPageButton.disabled = currentPage === 1;
    }

    if (nextPageButton) {
        nextPageButton.disabled = currentPage === totalPages;
    }
}

    function renderProduk() {
        if (!productGrid) return;
        productGrid.innerHTML = ""; // Bersihkan grid
        currentPage = Math.min(Math.max(currentPage, 1), getTotalPages());

        if (filteredProducts.length === 0) {
            if (emptyState) emptyState.classList.remove("d-none");
            updatePagination();
            return;
        }

        if (emptyState) emptyState.classList.add("d-none");

        const startIndex = (currentPage - 1) * itemPerPage;
        const visibleProducts = filteredProducts.slice(startIndex, startIndex + itemPerPage);

        visibleProducts.forEach((item) => {
            const kategoriLabel = item.kategori === "kain" ? "Kain Batik" : "Pakaian";
            const isHabis = item.stok <= 0; // Sekarang 'item' sudah terdefinisi di sini

            productGrid.innerHTML += `
            <article class="product-card ${isHabis ? 'out-of-stock' : ''}">
                <div class="product-media">
                    ${isHabis ? `<span class="product-badge bg-danger">Habis</span>` : (item.tag ? `<span class="product-badge">${item.tag}</span>` : "")}
                    <img src="${item.image}" alt="${item.nama}" class="product-image" 
                         style="${isHabis ? 'filter: grayscale(1);' : ''}"
                         onerror="this.src='../img/batik1.jpg'">
                </div>
                <div class="product-body">
                    <p class="product-category">${kategoriLabel}</p>
                    <h3 class="product-title">${item.nama}</h3>
                    <div class="product-footer">
                        <span class="product-price">${formatRupiah(item.harga)}</span>
                        <button class="cart-button" type="button" 
                                onclick="tambahKeKeranjang(${item.id})" 
                                ${isHabis ? 'disabled' : ''}>
                            <i class="bi ${isHabis ? 'bi-x-circle' : 'bi-cart'}"></i>
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
    normalizeCategorySelection(triggeredInput);
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

// Dipakai oleh onclick inline di template card.
window.tambahKeKeranjang = tambahKeKeranjang;

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

if (catalogPagination) {
    catalogPagination.addEventListener("click", (event) => {
        const button = event.target.closest(".page-number");
        if (!button || button.disabled) {
            return;
        }

        goToPage(Number(button.dataset.page));
    });
}

if (prevPageButton) {
    prevPageButton.addEventListener("click", () => {
        if (currentPage === 1) {
            return;
        }

        goToPage(currentPage - 1);
    });
}

if (nextPageButton) {
    nextPageButton.addEventListener("click", () => {
        if (currentPage === getTotalPages()) {
            return;
        }

        goToPage(currentPage + 1);
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
})();
