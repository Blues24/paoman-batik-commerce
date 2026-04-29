USE batik_store;

INSERT INTO admin(admin_id, username, password, role)
VALUES  (1, "daffa", "$2a$12$Eo7JpT4GO5HKaeuosHYd9.nnWIj41f.7icR4pEpuZzc7NV9EqyYVG", "admin"),
	(2, "hasbi", "$2a$12$Eo7JpT4GO5HKaeuosHYd9.nnWIj41f.7icR4pEpuZzc7NV9EqyYVG", "admin"),
	(3, "blues", "$2a$12$Eo7JpT4GO5HKaeuosHYd9.nnWIj41f.7icR4pEpuZzc7NV9EqyYVG", "admin");


INSERT INTO akun(akun_id, username, password_hash, status_akun)
VALUES  (1, "daffa123", "$2a$12$Eo7JpT4GO5HKaeuosHYd9.nnWIj41f.7icR4pEpuZzc7NV9EqyYVG", "aktif"),
	(2, "hasbi123", "$2a$12$Eo7JpT4GO5HKaeuosHYd9.nnWIj41f.7icR4pEpuZzc7NV9EqyYVG", "aktif"),
	(3, "lukman", "$2a$12$Eo7JpT4GO5HKaeuosHYd9.nnWIj41f.7icR4pEpuZzc7NV9EqyYVG", "aktif");

INSERT INTO pelanggan(pelanggan_id, akun_id, nama, email, no_hp, alamat)
VALUES	(1, 1, "Daffa", "daffa123@gmail.com", "081010101010", "Jalanin aja dulu, nangis belakangan"),
	(2, 2, "Hasbi", "hasbi123@gmail.com", "086767676767", "Jl.Tidur lah untuk meraih mimpi"),
	(3, 3, "Lukman", "blues@mail.archblues.io", "08696966969", "Jalan-jalan malah ketiduran");


