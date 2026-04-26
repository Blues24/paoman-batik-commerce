const CART_KEY = "batikPaomanCart";
// Fallback gambar kalau ada item keranjang lama yang belum membawa properti image.
const productImageMap = {
    1: "../img/batik1.jpg",
    2: "../img/batik2.jpg",
    3: "../img/baju1.png",
    4: "../img/batik4.jpg",
    5: "../img/batik5.jpg",
    6: "../img/baju2.png",
    7: "../img/batik7.jpg",
    8: "../img/baju3.png",
    9: "../img/batik9.jpg",
    10: "../img/baju4.png",
    11: "../img/batik1.jpg",
    12: "../img/baju5.png",
    13: "../img/baju6.png",
    14: "../img/baju7.png",
    15: "../img/batik5.jpg"
};

const productPicker = document.getElementById("productPicker");
const cartEmptyState = document.getElementById("cartEmptyState");
const cartCount = document.getElementById("cartCount");
const selectedProductName = document.getElementById("selectedProductName");
const selectedProductCategory = document.getElementById("selectedProductCategory");
const selectedProductPrice = document.getElementById("selectedProductPrice");
const selectedProductImage = document.getElementById("selectedProductImage");
const qtyInput = document.getElementById("qtyInput");
const qtyMinus = document.getElementById("qtyMinus");
const qtyPlus = document.getElementById("qtyPlus");
const submitButton = document.querySelector(".submit-btn");
const orderForm = document.querySelector(".order-form");
const kainFields = document.getElementById("kainFields");
const pakaianFields = document.getElementById("pakaianFields");
const orderNoticeOverlay = document.getElementById("orderNoticeOverlay");
const orderNoticeIcon = document.getElementById("orderNoticeIcon");
const orderNoticeTitle = document.getElementById("orderNoticeTitle");
const orderNoticeMessage = document.getElementById("orderNoticeMessage");
const orderNoticeActions = document.getElementById("orderNoticeActions");
const orderNoticePrimary = document.getElementById("orderNoticePrimary");
const orderNoticeSecondary = document.getElementById("orderNoticeSecondary");
let noticePrimaryHandler = null;
let noticeSecondaryHandler = null;

function formatRupiah(value) {
    return `Rp.${Number(value).toLocaleString("id-ID")}`;
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

function hideOrderNotice() {
    if (!orderNoticeOverlay) {
        return;
    }

    orderNoticeOverlay.classList.add("d-none");
    noticePrimaryHandler = null;
    noticeSecondaryHandler = null;
}

function showOrderNotice({
    title = "Informasi",
    message = "",
    type = "info",
    primaryLabel = "Oke",
    secondaryLabel = "Tutup",
    onPrimary = null,
    onSecondary = null,
    hideSecondary = false
}) {
    if (!orderNoticeOverlay) {
        return;
    }

    const iconMap = {
        info: "bi-info-circle",
        success: "bi-check2-circle",
        warning: "bi-exclamation-circle",
        error: "bi-x-circle"
    };

    orderNoticeTitle.textContent = title;
    orderNoticeMessage.textContent = message;
    orderNoticeIcon.className = `order-notice-icon ${type}`;
    orderNoticeIcon.innerHTML = `<i class="bi ${iconMap[type] || iconMap.info}"></i>`;
    orderNoticePrimary.textContent = primaryLabel;
    orderNoticeSecondary.textContent = secondaryLabel;
    orderNoticeSecondary.classList.toggle("d-none", hideSecondary);

    noticePrimaryHandler = onPrimary;
    noticeSecondaryHandler = onSecondary;
    orderNoticeOverlay.classList.remove("d-none");
}

function updateCartCount() {
    if (!cartCount) {
        return;
    }

    const totalItems = getCartItems().reduce((sum, item) => sum + item.qty, 0);
    cartCount.textContent = totalItems;
}

function updateFormByCategory(category) {
    // Form kain dan pakaian dibedakan supaya field yang tampil lebih relevan.
    const isKain = category.toLowerCase().includes("kain");

    kainFields.classList.toggle("d-none", !isKain);
    pakaianFields.classList.toggle("d-none", isKain);
}

function updatePreviewImage(image, productName) {
    if (!selectedProductImage) {
        return;
    }

    if (!image) {
        selectedProductImage.className = "preview-image-placeholder";
        selectedProductImage.innerHTML = "Tempat gambar produk";
        return;
    }

    selectedProductImage.className = "preview-image-shell";
    selectedProductImage.innerHTML = `<img src="${image}" alt="${productName}" class="preview-image">`;
}

function updateSelectedProduct(button) {
    const productOptions = Array.from(document.querySelectorAll(".product-option"));

    productOptions.forEach((option) => option.classList.remove("active"));
    button.classList.add("active");

    selectedProductName.textContent = button.dataset.name;
    selectedProductCategory.textContent = `${button.dataset.category} | ${button.dataset.qty} item di keranjang`;
    selectedProductPrice.textContent = formatRupiah(button.dataset.price);
    // Saat user memilih item keranjang, panel preview kiri ikut diperbarui.
    qtyInput.value = button.dataset.qty;
    updatePreviewImage(button.dataset.image, button.dataset.name);
    updateFormByCategory(button.dataset.category);
}

function removeCartItem(productId) {
    const updatedItems = getCartItems().filter((item) => item.id !== productId);
    saveCartItems(updatedItems);
    renderCartProducts();
}

function updateCartAfterOrder(productId, orderedQty) {
    const updatedItems = getCartItems()
        .map((item) => {
            if (item.id !== productId) {
                return item;
            }

            const nextQty = Math.max(0, (Number(item.qty) || 0) - orderedQty);
            return { ...item, qty: nextQty };
        })
        .filter((item) => item.qty > 0);

    saveCartItems(updatedItems);
}

function bindProductOptions() {
    const productOptions = Array.from(document.querySelectorAll(".product-option"));
    const removeButtons = Array.from(document.querySelectorAll(".remove-item-btn"));

    productOptions.forEach((button) => {
        button.addEventListener("click", () => {
            updateSelectedProduct(button);
        });
    });

    removeButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            removeCartItem(Number(button.dataset.id));
        });
    });

    if (productOptions.length > 0) {
        updateSelectedProduct(productOptions[0]);
    }
}

function renderCartProducts() {
    const cartItems = getCartItems();
    productPicker.innerHTML = "";
    updateCartCount();

    if (cartItems.length === 0) {
        cartEmptyState.classList.remove("d-none");
        selectedProductName.textContent = "Belum ada produk di keranjang";
        selectedProductCategory.textContent = "Tambahkan produk dari halaman pembelian";
        selectedProductPrice.textContent = "Rp.0";
        qtyInput.value = 1;
        updatePreviewImage("", "");
        qtyInput.disabled = true;
        qtyMinus.disabled = true;
        qtyPlus.disabled = true;
        submitButton.disabled = true;
        submitButton.textContent = "Keranjang Masih Kosong";
        kainFields.classList.add("d-none");
        pakaianFields.classList.add("d-none");
        return;
    }

    cartEmptyState.classList.add("d-none");
    qtyInput.disabled = false;
    qtyMinus.disabled = false;
    qtyPlus.disabled = false;
    submitButton.disabled = false;
    submitButton.textContent = "Pesan Sekarang";

    // Semua item yang ada di keranjang ditampilkan sebagai pilihan produk pemesanan.
    cartItems.forEach((item) => {
        const kategoriLabel = item.kategori === "kain" ? "Kain Batik" : "Pakaian";
        const imagePath = item.image || productImageMap[item.id] || "";

        productPicker.innerHTML += `
            <button
                type="button"
                class="product-option"
                data-id="${item.id}"
                data-name="${item.nama}"
                data-category="${kategoriLabel}"
                data-price="${item.harga}"
                data-qty="${item.qty}"
                data-image="${imagePath}">
                <span class="product-option-header">
                    <span class="product-option-title">${item.nama}</span>
                    <span
                        class="remove-item-btn"
                        data-id="${item.id}"
                        role="button"
                        aria-label="Hapus ${item.nama} dari keranjang">
                        <i class="bi bi-trash3"></i>
                    </span>
                </span>
                <span class="product-option-meta">${kategoriLabel} | ${item.qty} item</span>
            </button>
        `;
    });

    bindProductOptions();
}

function getActiveProductButton() {
    return document.querySelector(".product-option.active");
}

qtyMinus.addEventListener("click", () => {
    const currentValue = Number(qtyInput.value) || 1;
    qtyInput.value = Math.max(1, currentValue - 1);
});

qtyPlus.addEventListener("click", () => {
    const currentValue = Number(qtyInput.value) || 1;
    qtyInput.value = currentValue + 1;
});

qtyInput.addEventListener("input", () => {
    const currentValue = Number(qtyInput.value);

    if (!currentValue || currentValue < 1) {
        qtyInput.value = 1;
    }
});

orderForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const activeProduct = getActiveProductButton();
    const currentUser = window.UserSession?.getCurrentUser();

    if (!currentUser) {
        showOrderNotice({
            title: "Masuk Dulu",
            message: "Login dulu ya, supaya pesanan bisa masuk ke akun kamu dan statusnya bisa dipantau dari halaman akun.",
            type: "warning",
            primaryLabel: "Masuk Sekarang",
            secondaryLabel: "Nanti Saja",
            onPrimary: () => {
                window.location.href = "auth.html?redirect=pemesanan.html";
            }
        });
        return;
    }

    if (!activeProduct) {
        showOrderNotice({
            title: "Pilih Produk",
            message: "Pilih dulu produk dari keranjang supaya detail pemesanannya bisa diproses.",
            type: "info",
            hideSecondary: true
        });
        return;
    }

    const quantity = Math.max(1, Number(qtyInput.value) || 1);
    const notesField = document.querySelector(".notes-field textarea");
    const activeProductId = Number(activeProduct.dataset.id);
    const cartItems = getCartItems();
    const selectedCartItem = cartItems.find((item) => item.id === activeProductId);

    if (cartItems.length === 0 || !selectedCartItem) {
        showOrderNotice({
            title: "Keranjang Kosong",
            message: "Belum ada produk yang bisa dipesan. Tambahkan dulu produk dari halaman pembelian.",
            type: "warning",
            primaryLabel: "Buka Pembelian",
            secondaryLabel: "Tutup",
            onPrimary: () => {
                window.location.href = "pembelian.html";
            }
        });
        return;
    }

    const items = [{
        detail_batik_id: selectedCartItem.detail_batik_id || selectedCartItem.id,
        jumlah: quantity
    }];

    const result = await window.UserSession.createOrder(items);

    if (!result.success) {
        showOrderNotice({
            title: "Pesanan Belum Berhasil",
            message: result.message,
            type: "error",
            hideSecondary: true
        });
        return;
    }

    showOrderNotice({
        title: "Pesanan Berhasil",
        message: "Pesananmu sudah masuk. Kamu bisa cek status prosesnya di Pengaturan Akun.",
        type: "success",
        primaryLabel: "Lihat Akun",
        secondaryLabel: "Tutup",
        onPrimary: () => {
            window.location.href = "akun.html";
        }
    });
    updateCartAfterOrder(activeProductId, quantity);
    renderCartProducts();
    orderForm.reset();
    qtyInput.value = 1;

    if (notesField) {
        notesField.value = "";
    }
});

document.addEventListener("DOMContentLoaded", () => {
    renderCartProducts();
});

if (orderNoticePrimary) {
    orderNoticePrimary.addEventListener("click", () => {
        const handler = noticePrimaryHandler;
        hideOrderNotice();

        if (typeof handler === "function") {
            handler();
        }
    });
}

if (orderNoticeSecondary) {
    orderNoticeSecondary.addEventListener("click", () => {
        const handler = noticeSecondaryHandler;
        hideOrderNotice();

        if (typeof handler === "function") {
            handler();
        }
    });
}

if (orderNoticeOverlay) {
    orderNoticeOverlay.addEventListener("click", (event) => {
        if (event.target === orderNoticeOverlay) {
            hideOrderNotice();
        }
    });
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && orderNoticeOverlay && !orderNoticeOverlay.classList.contains("d-none")) {
        hideOrderNotice();
    }
});
