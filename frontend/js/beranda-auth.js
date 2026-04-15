document.addEventListener("DOMContentLoaded", () => {
    const authContainer = document.getElementById("berandaAuth");
    const currentUser = window.UserSession?.getCurrentUser();

    if (!authContainer) {
        return;
    }

    if (!currentUser) {
        authContainer.innerHTML = `
            <a href="auth.html?redirect=beranda.html" class="btn-login">Login</a>
            <a href="auth.html?redirect=beranda.html&mode=register" class="btn-daftar">Daftar</a>
        `;
        return;
    }

    authContainer.innerHTML = `
        <a href="akun.html" class="btn-login">${currentUser.nama}</a>
        <a href="#" class="btn-daftar" id="berandaLogout">Keluar</a>
    `;

    document.getElementById("berandaLogout").addEventListener("click", (event) => {
        event.preventDefault();
        window.UserSession.logoutUser();
        window.location.reload();
    });
});
