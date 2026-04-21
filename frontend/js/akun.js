//const API_URL = 'http://localhost:8000/api'; // Kena error  redefinition

// =========== EXISTING FUNCTIONS ===========

function showAccountMessage(message, type = "success") {
    const messageBox = document.getElementById("accountMessage");
    messageBox.textContent = message;
    messageBox.className = `account-message ${type}`;
}

function fillAccountSummary(user) {
    // Sinkronkan data summary dan form profil dengan akun yang sedang login.
    if (!user) return;

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
    return new Date(dateString).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatRupiah(amount) {
    return `Rp.${Number(amount).toLocaleString("id-ID")}`;
}

function getOrderStatusClass(status) {
    // Map backend status ke class
    if (status === "selesai") return "ready";
    if (status === "diproses") return "progress";
    if (status === "dikirim") return "progress";
    return "waiting";
}

function getPaymentStatusClass(status) {
    return status === "dibayar" ? "paid" : "unpaid";
}

function requireLoggedInUser() {
    const currentUser = window.UserSession.getCurrentUser();

    if (!currentUser) {
        window.location.href = "auth.html?redirect=akun.html";
        return null;
    }

    return currentUser;
}

// =========== NEW: REVIEW SYSTEM FUNCTIONS ===========

let selectedOrderForReview = null;
let selectedProductForReview = null;

async function renderOrderHistory() {
    const orders = await window.UserSession.getCurrentUserOrders();
    const list = document.getElementById("orderHistoryList");
    const emptyState = document.getElementById("orderHistoryEmpty");

    list.innerHTML = "";

    if (orders.length === 0) {
        emptyState.classList.remove("d-none");
        return;
    }

    emptyState.classList.add("d-none");

    orders.forEach((order) => {
        // Check if order status is "selesai" (completed) untuk enable review button
        const isCompleted = order.status_pesanan === 'selesai';

        list.innerHTML += `
            <article class="order-item-card">
                <div class="order-item-media">
                    ${order.items?.[0]?.detail_batik_id ? `<img src="${order.productImage || ''}" alt="${order.productName || 'Produk'}" class="order-item-image">` : `<div class="order-item-fallback">Produk</div>`}
                </div>
                <div class="order-item-body">
                    <div class="order-item-top">
                        <div>
                            <p class="order-code">${order.pesanan_id || order.id}</p>
                            <h3>${order.productName || order.items?.[0]?.nama_produk || 'Pesanan'}</h3>
                        </div>
                        <span class="status-pill ${getOrderStatusClass(order.status_pesanan || order.orderStatus)}">${order.status_pesanan || order.orderStatus}</span>
                    </div>
                    <p class="order-meta">${order.productCategory || ''} | ${order.total_jumlah || order.quantity || order.items?.reduce((sum, item) => sum + (item.jumlah || 0), 0)} item | ${formatDate(order.tanggal_pesanan || order.createdAt)}</p>
                    <div class="order-item-bottom">
                        <strong>${formatRupiah(order.total_harga || order.totalPrice)}</strong>
                        <span class="payment-pill ${getPaymentStatusClass(order.payment_status || order.paymentStatus)}">${order.payment_status || order.paymentStatus || 'Belum Dibayar'}</span>
                        ${isCompleted ? `<button type="button" class="review-btn" onclick="openReviewModal(${order.pesanan_id || order.id})">
                            <i class="bi bi-star"></i> Beri Ulasan
                        </button>` : ''}
                    </div>
                    ${order.notes ? `<p class="order-notes">${order.notes}</p>` : ""}
                </div>
            </article>
        `;
    });
}

function openReviewModal(pesananId) {
    // Fetch order detail untuk ambil product info
    fetchOrderDetail(pesananId);
}

async function fetchOrderDetail(pesananId) {
    const csrfToken = sessionStorage.getItem('csrf_token');

    try {
        const response = await fetch(`${API_URL}/pesanan/${pesananId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken || ''
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success && data.data.items && data.data.items.length > 0) {
            // Ambil item pertama untuk review
            const firstItem = data.data.items[0];
            selectedProductForReview = {
                ...firstItem,
                pesanan_id: pesananId,
            };

            // Set modal content
            document.getElementById("reviewProductName").textContent = firstItem.nama_produk || 'Produk';
            document.getElementById("reviewProductPesananId").textContent = `Pesanan #${pesananId}`;

            // Reset form
            document.getElementById("reviewForm").reset();
            document.getElementById("reviewRating").value = '';
            document.getElementById("ratingLabel").textContent = '';
            document.querySelectorAll('.star-btn').forEach(btn => btn.classList.remove('active'));

            // Show modal
            document.getElementById("reviewModal").classList.remove("d-none");
        }
    } catch (err) {
        console.error('Fetch order detail error:', err);
        showAccountMessage('Error: Tidak bisa memuat detail pesanan', 'error');
    }
}

function closeReviewModal() {
    document.getElementById("reviewModal").classList.add("d-none");
    selectedOrderForReview = null;
    selectedProductForReview = null;
}

// =========== STAR RATING INTERACTION ===========
function initStarRating() {
    const starBtns = document.querySelectorAll('.star-btn');

    starBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const rating = btn.dataset.rating;

            // Set rating value
            document.getElementById("reviewRating").value = rating;

            // Update UI
            starBtns.forEach((b, idx) => {
                b.classList.toggle('active', idx < rating);
            });

            // Update label
            const labels = ['Buruk', 'Cukup', 'Baik', 'Sangat Baik', 'Excellent'];
            document.getElementById("ratingLabel").textContent = `${rating} bintang - ${labels[rating - 1]}`;
        });
    });
}

// =========== REVIEW FORM SUBMISSION ===========
function initReviewForm() {
    const reviewForm = document.getElementById("reviewForm");
    reviewForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!selectedProductForReview) {
            showAccountMessage('Error: Produk tidak terpilih', 'error');
            return;
        }

        const rating = document.getElementById("reviewRating").value;
        const komentar = document.getElementById("reviewKomentar").value;
        const csrfToken = sessionStorage.getItem('csrf_token');

        if (!rating) {
            showAccountMessage('Rating harus dipilih', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/ulasan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken || ''
                },
                credentials: 'include',
                body: JSON.stringify({
                    produk_id: selectedProductForReview.produk_id || 1,
                    pesanan_id: selectedProductForReview.pesanan_id,
                    rating: parseInt(rating),
                    komentar: komentar || null
                })
            });

            const data = await response.json();

            if (data.success) {
                showAccountMessage('✅ Ulasan berhasil dikirim!', 'success');
                closeReviewModal();
                // Refresh order list
                await renderOrderHistory();
            } else {
                showAccountMessage(`❌ ${data.message}`, 'error');
            }
        } catch (err) {
            console.error('Submit review error:', err);
            showAccountMessage('Error: Gagal mengirim ulasan', 'error');
        }
    });
}

// =========== DOM READY ===========

document.addEventListener("DOMContentLoaded", async () => {
    const currentUser = requireLoggedInUser();

    if (!currentUser) {
        return;
    }

    fillAccountSummary(currentUser);
    await renderOrderHistory();

    // Init review system
    initStarRating();
    initReviewForm();

    // =========== EXISTING HANDLERS ===========

    document.getElementById("profileForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const currentUser = window.UserSession.getCurrentUser();
        const result = await window.UserSession.updateProfile({
            nama: document.getElementById("profileNama").value,
            username: document.getElementById("profileUsername").value,
            email: document.getElementById("profileEmail").value,
            noHp: document.getElementById("profilePhone").value,
            alamat: document.getElementById("profileAlamat").value,
            akun_id: currentUser.akun_id  
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
});