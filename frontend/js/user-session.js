(() => {
    // Kunci localStorage untuk data user, session aktif, reset password, dan riwayat pesanan.
    const USERS_KEY = "batikPaomanUsers";
    const CURRENT_USER_KEY = "batikPaomanCurrentUser";
    const RESET_REQUESTS_KEY = "batikPaomanResetRequests";
    const ORDERS_KEY = "batikPaomanOrders";

    function readJson(key, fallback) {
        try {
            return JSON.parse(localStorage.getItem(key)) ?? fallback;
        } catch {
            return fallback;
        }
    }

    function writeJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function sanitizeUser(user) {
        if (!user) {
            return null;
        }

        // Password sengaja tidak ikut dikirim ke UI.
        const { password, ...safeUser } = user;
        return safeUser;
    }

    function getUsers() {
        return readJson(USERS_KEY, []);
    }

    function saveUsers(users) {
        writeJson(USERS_KEY, users);
    }

    function getCurrentUser() {
        return readJson(CURRENT_USER_KEY, null);
    }

    function setCurrentUser(user) {
        writeJson(CURRENT_USER_KEY, sanitizeUser(user));
    }

    function registerUser(payload) {
        const users = getUsers();
        const nama = payload.nama.trim();
        const username = payload.username.trim();
        const email = payload.email.trim().toLowerCase();
        const noHp = payload.noHp.trim();
        const password = payload.password;

        // Cegah dua akun memakai username atau email yang sama.
        const duplicateUser = users.find((user) =>
            user.username.toLowerCase() === username.toLowerCase() ||
            user.email.toLowerCase() === email
        );

        if (duplicateUser) {
            return { success: false, message: "Username atau email sudah dipakai." };
        }

        const newUser = {
            id: Date.now(),
            nama,
            username,
            email,
            noHp,
            password,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers(users);
        setCurrentUser(newUser);

        return {
            success: true,
            message: "Akun berhasil dibuat.",
            user: sanitizeUser(newUser)
        };
    }

    function loginUser({ identifier, password }) {
        const users = getUsers();
        const normalizedIdentifier = identifier.trim().toLowerCase();

        // User boleh login pakai username atau email.
        const foundUser = users.find((user) =>
            user.username.toLowerCase() === normalizedIdentifier ||
            user.email.toLowerCase() === normalizedIdentifier
        );

        if (!foundUser || foundUser.password !== password) {
            return { success: false, message: "Username/email atau password salah." };
        }

        setCurrentUser(foundUser);

        return {
            success: true,
            message: "Login berhasil.",
            user: sanitizeUser(foundUser)
        };
    }

    function logoutUser() {
        localStorage.removeItem(CURRENT_USER_KEY);
    }

    function updateProfile(payload) {
        const currentUser = getCurrentUser();

        if (!currentUser) {
            return { success: false, message: "Kamu belum login." };
        }

        const users = getUsers();
        const userIndex = users.findIndex((user) => user.id === currentUser.id);

        if (userIndex < 0) {
            return { success: false, message: "Data akun tidak ditemukan." };
        }

        const email = payload.email.trim().toLowerCase();
        const username = payload.username.trim();

        // Saat edit profil, username/email tetap harus unik.
        const duplicateUser = users.find((user) =>
            user.id !== currentUser.id &&
            (user.username.toLowerCase() === username.toLowerCase() || user.email.toLowerCase() === email)
        );

        if (duplicateUser) {
            return { success: false, message: "Username atau email sudah dipakai akun lain." };
        }

        users[userIndex] = {
            ...users[userIndex],
            nama: payload.nama.trim(),
            username,
            email,
            noHp: payload.noHp.trim(),
            alamat: payload.alamat.trim()
        };

        saveUsers(users);
        setCurrentUser(users[userIndex]);

        return {
            success: true,
            message: "Profil berhasil diperbarui.",
            user: sanitizeUser(users[userIndex])
        };
    }

    function updatePassword({ currentPassword, newPassword }) {
        const currentUser = getCurrentUser();

        if (!currentUser) {
            return { success: false, message: "Kamu belum login." };
        }

        const users = getUsers();
        const userIndex = users.findIndex((user) => user.id === currentUser.id);

        if (userIndex < 0) {
            return { success: false, message: "Data akun tidak ditemukan." };
        }

        if (users[userIndex].password !== currentPassword) {
            return { success: false, message: "Password saat ini tidak sesuai." };
        }

        users[userIndex].password = newPassword;
        saveUsers(users);
        setCurrentUser(users[userIndex]);

        return { success: true, message: "Password berhasil diganti." };
    }

    function requestPasswordReset(identifier) {
        const users = getUsers();
        const normalizedIdentifier = identifier.trim().toLowerCase();

        const foundUser = users.find((user) =>
            user.username.toLowerCase() === normalizedIdentifier ||
            user.email.toLowerCase() === normalizedIdentifier
        );

        if (!foundUser) {
            return { success: false, message: "Akun tidak ditemukan." };
        }

        const requests = readJson(RESET_REQUESTS_KEY, []);
        requests.push({
            userId: foundUser.id,
            requestedAt: new Date().toISOString()
        });
        writeJson(RESET_REQUESTS_KEY, requests);

        return {
            success: true,
            message: `Simulasi reset sandi dikirim ke ${foundUser.email}.`
        };
    }

    function getOrders() {
        return readJson(ORDERS_KEY, []);
    }

    function saveOrders(orders) {
        writeJson(ORDERS_KEY, orders);
    }

    function createOrder(payload) {
        const currentUser = getCurrentUser();

        if (!currentUser) {
            return { success: false, message: "Login dulu supaya pesanan bisa masuk ke akunmu." };
        }

        // Pesanan baru langsung disimpan ke riwayat akun user yang sedang login.
        const orders = getOrders();
        const newOrder = {
            id: `ORD-${Date.now()}`,
            userId: currentUser.id,
            productId: payload.productId,
            productName: payload.productName,
            productCategory: payload.productCategory,
            productImage: payload.productImage || "",
            quantity: payload.quantity,
            totalPrice: payload.totalPrice,
            notes: payload.notes || "",
            orderStatus: "Menunggu",
            paymentStatus: "Belum Dibayar",
            createdAt: new Date().toISOString()
        };

        orders.unshift(newOrder);
        saveOrders(orders);

        return {
            success: true,
            message: "Pesanan berhasil dibuat dan masuk ke akunmu.",
            order: newOrder
        };
    }

    function getCurrentUserOrders() {
        const currentUser = getCurrentUser();

        if (!currentUser) {
            return [];
        }

        return getOrders().filter((order) => order.userId === currentUser.id);
    }

    window.UserSession = {
        // Semua helper session dipusatkan di sini supaya bisa dipakai banyak halaman.
        getUsers,
        getCurrentUser,
        registerUser,
        loginUser,
        logoutUser,
        updateProfile,
        updatePassword,
        requestPasswordReset,
        createOrder,
        getCurrentUserOrders
    };
})();
