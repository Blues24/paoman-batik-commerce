const CART_KEY = "batikPaomanCart";

const productPicker = document.getElementById("productPicker");
const cartEmptyState = document.getElementById("cartEmptyState");
const cartCount = document.getElementById("cartCount");
const selectedProductName = document.getElementById("selectedProductName");
const selectedProductCategory = document.getElementById("selectedProductCategory");
const selectedProductPrice = document.getElementById("selectedProductPrice");
const qtyInput = document.getElementById("qtyInput");
const qtyMinus = document.getElementById("qtyMinus");
const qtyPlus = document.getElementById("qtyPlus");
const submitButton = document.querySelector(".submit-btn");
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
    const totalItems = getCartItems().reduce((sum, item) => sum + item.qty, 0);
    cartCount.textContent = totalItems;
}

function updateFormByCategory(category) {
    const isKain = category.toLowerCase().includes("kain");

    kainFields.classList.toggle("d-none", !isKain);
    pakaianFields.classList.toggle("d-none", isKain);
}

function updateSelectedProduct(button) {
    const productOptions = Array.from(document.querySelectorAll(".product-option"));

    productOptions.forEach((option) => option.classList.remove("active"));
    button.classList.add("active");

    selectedProductName.textContent = button.dataset.name;
    selectedProductCategory.textContent = `${button.dataset.category} | ${button.dataset.qty} item di keranjang`;
    selectedProductPrice.textContent = formatRupiah(button.dataset.price);
    qtyInput.value = button.dataset.qty;
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

    cartItems.forEach((item) => {
        const kategoriLabel = item.kategori === "kain" ? "Kain Batik" : "Pakaian";

        productPicker.innerHTML += `
            <button
                type="button"
                class="product-option"
                data-id="${item.id}"
                data-name="${item.nama}"
                data-category="${kategoriLabel}"
                data-price="${item.harga}"
                data-qty="${item.qty}">
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

document.addEventListener("DOMContentLoaded", () => {
    renderCartProducts();
});
