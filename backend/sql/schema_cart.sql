USE batik_store;

-- Keranjang user disimpan per pelanggan + varian produk.
CREATE TABLE IF NOT EXISTS cart_item (
    cart_item_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pelanggan_id     INT UNSIGNED NOT NULL,
    detail_batik_id  INT UNSIGNED NOT NULL,
    qty              INT UNSIGNED NOT NULL DEFAULT 1,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_cart_item (pelanggan_id, detail_batik_id),
    CONSTRAINT fk_cart_pelanggan FOREIGN KEY (pelanggan_id) REFERENCES pelanggan(pelanggan_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_cart_detail_batik FOREIGN KEY (detail_batik_id) REFERENCES detail_batik(detail_batik_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

