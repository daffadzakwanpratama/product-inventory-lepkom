CREATE DATABASE inventory;
USE inventory;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    api_token VARCHAR(255) NULL
);

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    stock INT NOT NULL,
    price DECIMAL(10,2) NOT NULL
);

CREATE TABLE stock_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    transaction_type ENUM('IN', 'OUT') NOT NULL,
    quantity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

INSERT INTO users (username, password, role) VALUES 
('admin', '$2a$10$qRRJTBNaeqi5GST5838xZuB/f02y5dlz7vNxrg8NGc04oCXY64ynS', 'admin'),
('user1', '$2a$10$qRRJTBNaeqi5GST5838xZuB/f02y5dlz7vNxrg8NGc04oCXY64ynS', 'user'); 
-- password untuk keduanya: password123

INSERT INTO products (name, stock, price) VALUES
('Laptop Asus', 50, 15000000),
('Mouse Logitech', 150, 250000),
('Keyboard Mechanical', 75, 800000);

-- Menyisipkan data awal log stok
INSERT INTO stock_transactions (user_id, product_id, transaction_type, quantity) VALUES
(1, 1, 'IN', 50),
(1, 2, 'IN', 150),
(1, 3, 'IN', 75);
