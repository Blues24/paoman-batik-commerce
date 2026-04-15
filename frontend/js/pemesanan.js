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

orderForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const activeProduct = getActiveProductButton();
    const currentUser = window.UserSession?.getCurrentUser();

    if (!currentUser) {
        alert("Login dulu ya, supaya pesanan bisa masuk ke akun kamu.");
        window.location.href = "auth.html?redirect=pemesanan.html";
        return;
    }

    if (!activeProduct) {
        alert("Pilih produk dari keranjang dulu.");
        return;
    }

    const quantity = Math.max(1, Number(qtyInput.value) || 1);
    const price = Number(activeProduct.dataset.price);
    const notesField = document.querySelector(".notes-field textarea");

    // Pesanan yang dibuat user akan masuk ke riwayat akun.
    const result = window.UserSession.createOrder({
        productId: Number(activeProduct.dataset.id),
        productName: activeProduct.dataset.name,
        productCategory: activeProduct.dataset.category,
        productImage: activeProduct.dataset.image,
        quantity,
        totalPrice: price * quantity,
        notes: notesField ? notesField.value.trim() : ""
    });

    if (!result.success) {
        alert(result.message);
        return;
    }

    alert("Pesanan berhasil dibuat. Cek statusnya di Pengaturan Akun.");
    orderForm.reset();
    qtyInput.value = quantity;
});

document.addEventListener("DOMContentLoaded", () => {
    renderCartProducts();
});
