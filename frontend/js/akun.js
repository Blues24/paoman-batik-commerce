function showAccountMessage(message, type = "success") {
    const messageBox = document.getElementById("accountMessage");

    if (!messageBox) {
        return;
    }

    messageBox.textContent = message;
    messageBox.className = `account-message ${type}`;
}

function fillAccountSummary(user) {
    if (!user) {
        return;
    }

    document.getElementById("summaryAvatar").textContent = user.nama.trim().charAt(0).toUpperCase();
    document.getElementById("summaryName").textContent = user.nama;
    document.getElementById("summaryEmail").textContent = user.email;
    document.getElementById("summaryUsername").textContent = `@${user.username}`;
    document.getElementById("summaryPhone").textContent = user.noHp || "Belum diisi";
    document.getElementById("resetEmailLabel").textContent = `Email reset akan dikirim ke ${user.email}.`;

    document.getElementById("profileNama").value = user.nama || "";
    document.getElementById("profileUsername").value = user.username || "";
    document.getElementById("profileEmail").value = user.email || "";
    document.getElementById("profilePhone").value = user.noHp || "";
    document.getElementById("profileAlamat").value = user.alamat || "";
}

function formatDate(dateString) {
    if (!dateString) {
        return "Tanggal belum tersedia";
    }

    return new Date(dateString).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatRupiah(amount) {
    return `Rp.${Number(amount || 0).toLocaleString("id-ID")}`;
}

function getOrderStatusClass(status) {
    const normalizedStatus = (status || "").toLowerCase();

    if (normalizedStatus === "selesai" || normalizedStatus === "siap diambil") {
        return "ready";
    }

    if (normalizedStatus === "diproses" || normalizedStatus === "dikirim") {
        return "progress";
    }

    if (normalizedStatus === "dibatalkan" || normalizedStatus === "cancelled" || normalizedStatus === "canceled") {
        return "cancelled";
    }

    return "waiting";
}

function getPaymentStatusClass(status) {
    const normalizedStatus = (status || "").toLowerCase();
    return normalizedStatus === "dibayar" || normalizedStatus === "bayar_di_tempat" ? "paid" : "unpaid";
}

function formatPaymentStatus(status, method) {
    const normalizedStatus = String(status || "").toLowerCase();
    const normalizedMethod = String(method || "").toLowerCase();

    if (normalizedStatus === "bayar_di_tempat" || normalizedMethod === "cod") {
        return "COD";
    }

    if (normalizedStatus === "menunggu_konfirmasi") {
        return "Menunggu Konfirmasi";
    }

    if (normalizedStatus === "dibayar") {
        return "Dibayar";
    }

    return "Belum Dibayar";
}

function formatPaymentMethod(method) {
    const map = {
        qris: "QRIS",
        ewallet: "E-Wallet",
        cod: "COD"
    };

    return map[String(method || "").toLowerCase()] || "QRIS";
}

function getPaymentGuide(method) {
    const normalized = String(method || "").toLowerCase();
    if (normalized === "ewallet") {
        return {
            title: "Bayar via E-Wallet",
            rows: ["DANA 0819-1131-5662", "GoPay 0819-8842-1107", "OVO/ShopeePay 0819-7720-4521"]
        };
    }

    if (normalized === "cod") {
        return {
            title: "COD / Bayar di Tempat",
            rows: ["Bayar saat pesanan diterima atau saat ambil di toko."]
        };
    }

    return {
        title: "Bayar via QRIS",
        rows: ["Merchant Batik Paoman Indramayu", "ID QRIS 9360-0218-PAOMAN"]
    };
}

function renderPaymentGuide(order, canUploadPayment) {
    const method = order.metode_pembayaran || order.paymentMethod || "qris";
    const guide = getPaymentGuide(method);
    const isQris = String(method).toLowerCase() === "qris";

    return `
        <div class="account-payment-guide">
            <div>
                <strong>${guide.title}</strong>
                ${guide.rows.map((row) => `<span>${row}</span>`).join("")}
                ${canUploadPayment ? `<em>Upload bukti setelah transfer supaya admin bisa konfirmasi.</em>` : ""}
            </div>
            ${isQris ? `<div class="mini-qris" aria-label="Barcode QRIS simulasi"><span></span><span></span><span></span></div>` : ""}
        </div>
    `;
}

function requireLoggedInUser() {
    const currentUser = window.UserSession.getCurrentUser();

    if (!currentUser) {
        window.location.href = "auth.html?redirect=akun.html";
        return null;
    }

    return currentUser;
}

function getOrderItemCount(order) {
    return order.total_jumlah || order.quantity || order.items?.reduce((sum, item) => sum + (item.jumlah || 0), 0) || 0;
}

const orderImageByName = {
    "Kain Batik Motif Biru Pesisir": "../img/batik1.jpg",
    "Kain Batik Motif Ganggeng Pesisir": "../img/batik1.jpg",
    "Kain Batik Motif Godong Asem": "../img/batik2.jpg",
    "Kain Batik Motif Jarot Asem": "../img/batik2.jpg",
    "Baju Batik Motif Kentangan": "../img/baju1.png",
    "Baju Batik Motif Kembang Kapas": "../img/baju1.png",
    "Kain Batik Motif Mangga Bambu": "../img/batik4.jpg",
    "Kain Batik Motif Kapal Kandas": "../img/batik4.jpg",
    "Kain Batik Motif Kembang Gunda": "../img/batik5.jpg",
    "Kemeja Batik Motif Kembang Paoman": "../img/baju2.png",
    "Kemeja Batik Motif Iwak Etong": "../img/baju2.png",
    "Kain Batik Motif Lereng Paoman": "../img/batik7.jpg",
    "Kain Batik Motif Banji Tepak": "../img/batik7.jpg",
    "Blus Batik Motif Pesisir Laut": "../img/baju3.png",
    "Blus Batik Motif Kembang Karang": "../img/baju3.png",
    "Kain Batik Motif Daun Nila": "../img/batik9.jpg",
    "Kain Batik Motif Lokcan": "../img/batik9.jpg",
    "Kemeja Batik Motif Kawung Laut": "../img/baju4.png",
    "Kemeja Batik Motif Kapal Laju": "../img/baju4.png",
    "Kain Batik Motif Biru Pesisir Premium": "../img/batik1.jpg",
    "Kain Batik Motif Lasem Urang": "../img/batik10.jpg",
    "Outer Batik Motif Godong Asem": "../img/baju5.png",
    "Outer Batik Motif Jarot Asem": "../img/baju5.png",
    "Tunik Batik Motif Kentangan": "../img/baju6.png",
    "Tunik Batik Motif Kembang Kapas": "../img/baju6.png",
    "Dress Batik Motif Mangga Bambu": "../img/baju7.png",
    "Dress Batik Motif Kapal Kandas": "../img/baju7.png",
    "Kain Batik Motif Kembang Gunda Premium": "../img/batik5.jpg"
};

function getOrderPrimaryImage(order) {
    const explicit = order.productImage || order.gambar_produk || order.items?.[0]?.image || order.items?.[0]?.gambar_produk || "";
    if (explicit) return normalizeImagePath(explicit);

    const name = getOrderPrimaryName(order);
    return orderImageByName[name] || "";
}

function normalizeImagePath(path) {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    if (path.includes("uploads/")) return `../img/uploads/${path.split("/").pop()}`;
    return path;
}

function getOrderPrimaryName(order) {
    return order.productName || order.nama_produk || order.items?.[0]?.nama_produk || "Pesanan";
}

function getOrderPrimaryCategory(order) {
    return order.productCategory || order.kategori || order.items?.[0]?.kategori || "Produk Batik";
}

let selectedProductForReview = null;
let cancelOrderResolver = null;

function openCancelOrderAlert() {
    const alertOverlay = document.getElementById("cancelOrderAlert");

    if (!alertOverlay) {
        return Promise.resolve(confirm("Batalkan pesanan ini? Jika dibatalkan, stok akan dikembalikan."));
    }

    alertOverlay.classList.remove("d-none");

    return new Promise((resolve) => {
        cancelOrderResolver = resolve;
    });
}

function closeCancelOrderAlert(isConfirmed = false) {
    const alertOverlay = document.getElementById("cancelOrderAlert");

    if (alertOverlay) {
        alertOverlay.classList.add("d-none");
    }

    if (cancelOrderResolver) {
        cancelOrderResolver(isConfirmed);
        cancelOrderResolver = null;
    }
}

async function renderOrderHistory() {
    const response = await window.UserSession.getCurrentUserOrders();
    const list = document.getElementById("orderHistoryList");
    const emptyState = document.getElementById("orderHistoryEmpty");

    list.innerHTML = "";

    if (!response.success) {
        emptyState.textContent = response.message || "Riwayat pesanan belum bisa dimuat.";
        emptyState.classList.remove("d-none");
        return;
    }

    const orders = response.data || [];

    if (orders.length === 0) {
        emptyState.textContent = "Belum ada pesanan yang masuk ke akun ini. Buat pesanan dulu dari halaman pemesanan.";
        emptyState.classList.remove("d-none");
        return;
    }

    emptyState.classList.add("d-none");

    orders.forEach((order) => {
        const orderStatus = order.status_pesanan || order.orderStatus || "Menunggu";
        const paymentStatus = order.payment_status || order.paymentStatus || "Belum Dibayar";
        const paymentMethod = order.metode_pembayaran || order.paymentMethod || "";
        const orderId = order.pesanan_id || order.id;
        const image = getOrderPrimaryImage(order);
        const isCompleted = ["selesai", "siap diambil"].includes(String(orderStatus).toLowerCase());
        const isPending = String(orderStatus).toLowerCase() === "pending";
        const canUploadPayment = ["qris", "ewallet"].includes(String(paymentMethod).toLowerCase())
            && !["dibayar", "bayar_di_tempat"].includes(String(paymentStatus).toLowerCase());
        const proofUrl = normalizeImagePath(order.bukti_pembayaran || "");

        list.innerHTML += `
            <article class="order-item-card">
                <div class="order-item-media">
                    ${image ? `<img src="${image}" alt="${getOrderPrimaryName(order)}" class="order-item-image">` : `<div class="order-item-fallback">Produk</div>`}
                </div>
                <div class="order-item-body">
                    <div class="order-item-top">
                        <div>
                            <p class="order-code">${orderId}</p>
                            <h3>${getOrderPrimaryName(order)}</h3>
                        </div>
                        <span class="status-pill ${getOrderStatusClass(orderStatus)}">${orderStatus}</span>
                    </div>
                    <p class="order-meta">${getOrderPrimaryCategory(order)} | ${getOrderItemCount(order)} item | ${formatDate(order.tanggal_pesanan || order.createdAt)}</p>
                    <p class="order-meta">Pembayaran: ${formatPaymentMethod(paymentMethod)}</p>
                    ${renderPaymentGuide(order, canUploadPayment)}
                    ${order.catatan ? `<p class="order-meta">${order.catatan}</p>` : ""}
                    ${proofUrl ? `<p class="order-meta"><a href="${proofUrl}" target="_blank">Lihat bukti pembayaran</a></p>` : ""}
                    <div class="order-item-bottom">
                        <strong>${formatRupiah(order.total_harga || order.totalPrice)}</strong>
                        <span class="payment-pill ${getPaymentStatusClass(paymentStatus)}">${formatPaymentStatus(paymentStatus, paymentMethod)}</span>
                        ${canUploadPayment ? `<button type="button" class="review-btn" onclick="uploadMyPaymentProof(${orderId})">
                            <i class="bi bi-upload"></i> Bayar / Upload Bukti
                        </button>` : ""}
                        ${isCompleted ? `<button type="button" class="review-btn" onclick="openReviewModal(${orderId})">
                            <i class="bi bi-star-fill"></i> Beri Ulasan
                        </button>` : ""}
                        ${isPending ? `<button type="button" class="review-btn" onclick="cancelMyOrder(${orderId})">
                            <i class="bi bi-x-circle"></i> Batalkan
                        </button>` : ""}
                    </div>
                    ${order.notes ? `<p class="order-notes">${order.notes}</p>` : ""}
                </div>
            </article>
        `;
    });
}

async function uploadMyPaymentProof(pesananId) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.pdf";
    input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        const detail = prompt("Rincian pembayaran (contoh: DANA 08xxxxxxxx / nama pengirim):") || "";
        const result = await window.UserSession.uploadPaymentProof(pesananId, file, detail.trim());
        showAccountMessage(result.message, result.success ? "success" : "error");
        if (result.success) {
            await renderOrderHistory();
        }
    };
    input.click();
}

async function cancelMyOrder(pesananId) {
    const ok = await openCancelOrderAlert();
    if (!ok) return;

    try {
        const result = await window.UserSession.cancelOrder(pesananId);
        showAccountMessage(result.message, result.success ? "success" : "error");
        if (result.success) {
            await renderOrderHistory();
        }
    } catch (e) {
        showAccountMessage("Gagal membatalkan pesanan. Coba lagi.", "error");
    }
}

async function openReviewModal(pesananId) {
    const response = await window.UserSession.getOrderDetail(pesananId);

    if (!response.success || !response.data?.items?.length) {
        showAccountMessage(response.message || "Detail pesanan belum bisa dimuat.", "error");
        return;
    }

    const firstItem = response.data.items[0];
    selectedProductForReview = {
        ...firstItem,
        pesanan_id: pesananId
    };

    document.getElementById("reviewProductName").textContent = firstItem.nama_produk || "Produk";
    document.getElementById("reviewProductPesananId").textContent = `Pesanan #${pesananId}`;
    document.getElementById("reviewForm").reset();
    document.getElementById("reviewRating").value = "";
    document.getElementById("ratingLabel").textContent = "";
    document.querySelectorAll(".star-btn").forEach((button) => button.classList.remove("active"));
    document.getElementById("reviewModal").classList.remove("d-none");
}

function closeReviewModal() {
    document.getElementById("reviewModal").classList.add("d-none");
    selectedProductForReview = null;
}

function initCancelOrderAlert() {
    const alertOverlay = document.getElementById("cancelOrderAlert");
    const dismissButton = document.getElementById("cancelAlertDismissBtn");
    const confirmButton = document.getElementById("cancelAlertConfirmBtn");

    if (!alertOverlay || !dismissButton || !confirmButton) {
        return;
    }

    dismissButton.addEventListener("click", () => closeCancelOrderAlert(false));
    confirmButton.addEventListener("click", () => closeCancelOrderAlert(true));
    alertOverlay.addEventListener("click", (event) => {
        if (event.target === alertOverlay) {
            closeCancelOrderAlert(false);
        }
    });
}

function initStarRating() {
    const starButtons = document.querySelectorAll(".star-btn");
    const ratingInput = document.getElementById("reviewRating");
    const ratingLabel = document.getElementById("ratingLabel");
    const labels = ["Buruk", "Cukup", "Baik", "Sangat Baik", "Istimewa"];

    starButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.preventDefault();

            const rating = Number(button.dataset.rating);
            ratingInput.value = rating;

            starButtons.forEach((starButton) => {
                starButton.classList.toggle("active", Number(starButton.dataset.rating) <= rating);
            });

            ratingLabel.textContent = `${rating} bintang - ${labels[rating - 1]}`;
        });
    });
}

function initReviewForm() {
    const reviewForm = document.getElementById("reviewForm");

    reviewForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!selectedProductForReview) {
            showAccountMessage("Produk untuk diulas belum terpilih.", "error");
            return;
        }

        const rating = Number(document.getElementById("reviewRating").value);
        const komentar = document.getElementById("reviewKomentar").value.trim();

        if (!rating) {
            showAccountMessage("Rating harus dipilih dulu.", "error");
            return;
        }

        const result = await window.UserSession.submitReview({
            produk_id: selectedProductForReview.produk_id,
            pesanan_id: selectedProductForReview.pesanan_id,
            rating,
            komentar: komentar || null
        });

        showAccountMessage(result.message, result.success ? "success" : "error");

        if (result.success) {
            closeReviewModal();
            await renderOrderHistory();
        }
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const currentUser = requireLoggedInUser();

    if (!currentUser) {
        return;
    }

    fillAccountSummary(currentUser);
    initCancelOrderAlert();
    initStarRating();
    initReviewForm();
    await renderOrderHistory();

    document.getElementById("profileForm").addEventListener("submit", async (event) => {
        event.preventDefault();

        const latestUser = window.UserSession.getCurrentUser();
        const result = await window.UserSession.updateProfile({
            nama: document.getElementById("profileNama").value,
            username: document.getElementById("profileUsername").value,
            email: document.getElementById("profileEmail").value,
            noHp: document.getElementById("profilePhone").value,
            alamat: document.getElementById("profileAlamat").value,
            akun_id: latestUser?.akun_id
        });

        showAccountMessage(result.message, result.success ? "success" : "error");

        if (result.success) {
            fillAccountSummary(result.user);
        }
    });

    document.getElementById("passwordForm").addEventListener("submit", async (event) => {
        event.preventDefault();

        const currentPassword = document.getElementById("currentPassword").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (newPassword.length < 8) {
            showAccountMessage("Password baru minimal 8 karakter.", "error");
            return;
        }

        if (newPassword !== confirmPassword) {
            showAccountMessage("Konfirmasi password baru belum sama.", "error");
            return;
        }

        const result = await window.UserSession.updatePassword({ currentPassword, newPassword });
        showAccountMessage(result.message, result.success ? "success" : "error");

        if (result.success) {
            event.target.reset();
        }
    });

    document.getElementById("resetPasswordBtn").addEventListener("click", async () => {
        const latestUser = window.UserSession.getCurrentUser();
        const result = await window.UserSession.requestPasswordReset(latestUser.email || latestUser.username);
        showAccountMessage(result.message, result.success ? "success" : "error");
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeCancelOrderAlert(false);
        }
    });
});
