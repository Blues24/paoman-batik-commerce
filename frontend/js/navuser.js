(() => {
    function getCurrentPage() {
        const currentPath = window.location.pathname.toLowerCase();

        if (currentPath.includes("pembelian.html")) return "produk";
        if (currentPath.includes("pemesanan.html")) return "pemesanan";
        if (currentPath.includes("konsultasi.html")) return "konsultasi";
        if (currentPath.includes("kontak.html")) return "kontak";
        if (currentPath.includes("akun.html")) return "akun";

        return "";
    }

    function getCartTotal() {
        try {
            const items = JSON.parse(localStorage.getItem("batikPaomanCart")) || [];
            return items.reduce((sum, item) => sum + (item.qty || 0), 0);
        } catch {
            return 0;
        }
    }

    function getLoginLink() {
        const fileName = window.location.pathname.split("/").pop() || "pembelian.html";
        return `auth.html?redirect=${encodeURIComponent(fileName)}`;
    }

    function getRegisterLink() {
        const fileName = window.location.pathname.split("/").pop() || "pembelian.html";
        return `auth.html?redirect=${encodeURIComponent(fileName)}&mode=register`;
    }

    function getLoggedOutActions() {
        // Navbar sebelum login: user hanya melihat tombol daftar dan masuk.
        return `
            <div class="auth-links">
                <a class="auth-link" href="${getRegisterLink()}">Daftar</a>
                <a class="auth-link primary" href="${getLoginLink()}">Masuk</a>
            </div>
        `;
    }

    function getLoggedInActions(user) {
        const displayName = (user.nama || user.username || "User").trim();
        const displayEmail = user.email || "Email belum diisi";
        const displayPhone = user.noHp || "No. HP belum diisi";
        const initials = displayName.charAt(0).toUpperCase() || "U";

        // Navbar sesudah login: tampilkan nama user + dropdown aksi akun.
        return `
            <div class="user-menu">
                <button type="button" class="user-menu-trigger" id="userMenuTrigger" aria-expanded="false">
                    <div class="user-meta">
                        <strong>${displayName}</strong>
                        <span>${displayEmail}</span>
                    </div>
                    <div class="user-avatar">${initials}</div>
                    <i class="bi bi-chevron-down"></i>
                </button>

                <div class="user-menu-dropdown d-none" id="userMenuDropdown">
                    <div class="user-menu-header">
                        <strong>${displayName}</strong>
                        <span>${displayPhone}</span>
                    </div>
                    <a class="user-menu-link" href="akun.html">
                        <i class="bi bi-person-gear"></i>
                        Pengaturan Akun
                    </a>
                    <a class="user-menu-link" href="akun.html#security-card">
                        <i class="bi bi-shield-lock"></i>
                        Ganti Password
                    </a>
                    <button type="button" class="logout-btn" id="logoutBtn">
                        <i class="bi bi-box-arrow-right"></i>
                        Keluar
                    </button>
                </div>
            </div>
        `;
    }

    function bindUserMenu() {
        const menuTrigger = document.getElementById("userMenuTrigger");
        const menuDropdown = document.getElementById("userMenuDropdown");
        const logoutBtn = document.getElementById("logoutBtn");

        if (!menuTrigger || !menuDropdown) {
            return;
        }

        menuTrigger.addEventListener("click", () => {
            const isHidden = menuDropdown.classList.toggle("d-none");
            menuTrigger.setAttribute("aria-expanded", String(!isHidden));
        });

        document.addEventListener("click", (event) => {
            if (!event.target.closest(".user-menu")) {
                menuDropdown.classList.add("d-none");
                menuTrigger.setAttribute("aria-expanded", "false");
            }
        });

        if (logoutBtn) {
            logoutBtn.addEventListener("click", async () => {
                await window.UserSession.logoutUser();

                if (window.location.pathname.toLowerCase().includes("akun.html")) {
                    window.location.href = "auth.html?redirect=akun.html";
                    return;
                }

                window.location.reload();
            });
        }
    }

    function renderNavbar() {
        const navbarPlaceholder = document.getElementById("navbar-placeholder");

        if (!navbarPlaceholder) {
            return;
        }

        const currentPage = getCurrentPage();
        // Session login dibaca dari helper global UserSession.
        const currentUser = window.UserSession?.getCurrentUser();

        navbarPlaceholder.innerHTML = `
            <nav class="navbar navbar-expand-lg page-navbar">
                <div class="container page-shell nav-shell">
                    <div class="navbar-nav nav-menu">
                        <a class="nav-link ${currentPage === "produk" ? "active" : ""}" href="pembelian.html">Produk</a>
                        <a class="nav-link ${currentPage === "pemesanan" ? "active" : ""}" href="pemesanan.html">Pemesanan</a>
                        <a class="nav-link ${currentPage === "konsultasi" ? "active" : ""}" href="konsultasi.html">Konsultasi</a>
                        <a class="nav-link ${currentPage === "kontak" ? "active" : ""}" href="kontak.html">Kontak</a>
                    </div>

                    <div class="nav-actions">
                        <a class="cart-pill" href="pemesanan.html" aria-label="Buka keranjang dan pemesanan">
                            <i class="bi bi-cart3"></i>
                            <span>Keranjang</span>
                            <strong id="cartCount">${getCartTotal()}</strong>
                        </a>
                        ${currentUser ? getLoggedInActions(currentUser) : getLoggedOutActions()}
                    </div>
                </div>
            </nav>
        `;

        bindUserMenu();
    }

    renderNavbar();
})();
