function showAccountMessage(message, type = "success") {
    const messageBox = document.getElementById("accountMessage");
    messageBox.textContent = message;
    messageBox.className = `account-message ${type}`;
}

function fillAccountSummary(user) {
    // Sinkronkan data summary dan form profil dengan akun yang sedang login.
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
    if (status === "Siap Diambil") return "ready";
    if (status === "Diproses") return "progress";
    return "waiting";
}

function getPaymentStatusClass(status) {
    return status === "Sudah Dibayar" ? "paid" : "unpaid";
}

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
                    </div>
                    ${order.notes ? `<p class="order-notes">${order.notes}</p>` : ""}
                </div>
            </article>
        `;
    });
}

function requireLoggedInUser() {
    const currentUser = window.UserSession.getCurrentUser();

    if (!currentUser) {
        window.location.href = "auth.html?redirect=akun.html";
        return null;
    }

    return currentUser;
}

document.addEventListener("DOMContentLoaded", async () => {
    const currentUser = requireLoggedInUser();

    if (!currentUser) {
        return;
    }

    fillAccountSummary(currentUser);
    await renderOrderHistory();

    document.getElementById("profileForm").addEventListener("submit", async (event) => {
        event.preventDefault();

        const result = await window.UserSession.updateProfile({
            nama: document.getElementById("profileNama").value,
            username: document.getElementById("profileUsername").value,
            email: document.getElementById("profileEmail").value,
            noHp: document.getElementById("profilePhone").value,
            alamat: document.getElementById("profileAlamat").value
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
