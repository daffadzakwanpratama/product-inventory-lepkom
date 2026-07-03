package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"product-inventory/configs"
	"product-inventory/models"
	"product-inventory/utils"
	"strconv"
	"strings"
)

func HandleProducts(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/products")
	path = strings.TrimPrefix(path, "/")

	var id int
	var err error

	if path != "" {
		id, err = strconv.Atoi(path)
		if err != nil {
			utils.RespondError(w, http.StatusBadRequest, "Invalid Product ID")
			return
		}
	}

	switch r.Method {
	case http.MethodGet:
		if id == 0 {
			getProducts(w, r)
		} else {
			getProduct(w, r, id)
		}
	case http.MethodPost:
		createProduct(w, r)
	case http.MethodPut:
		updateProduct(w, r, id)
	case http.MethodDelete:
		deleteProduct(w, r, id)
	default:
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
	}
}

func getProducts(w http.ResponseWriter, r *http.Request) {
	if configs.DB == nil {
		utils.RespondError(w, http.StatusInternalServerError, "Database belum terkoneksi")
		return
	}

	// Buat query SELECT ke tabel products
	rows, err := configs.DB.Query("SELECT id, name, stock, price FROM products")
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Gagal mengambil data produk")
		return
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var p models.Product
		// Scan hasil query ke dalam struct
		if err := rows.Scan(&p.ID, &p.Name, &p.Stock, &p.Price); err != nil {
			utils.RespondError(w, http.StatusInternalServerError, "Gagal memproses data produk")
			return
		}
		products = append(products, p)
	}

	if products == nil {
		products = []models.Product{}
	}

	utils.RespondJSON(w, http.StatusOK, products)
}

func getProduct(w http.ResponseWriter, r *http.Request, id int) {
	var p models.Product
	err := configs.DB.QueryRow("SELECT id, name, stock, price FROM products WHERE id = ?", id).
		Scan(&p.ID, &p.Name, &p.Stock, &p.Price)
	if err != nil {
		if err == sql.ErrNoRows {
			utils.RespondError(w, http.StatusNotFound, "Produk tidak ditemukan")
		} else {
			utils.RespondError(w, http.StatusInternalServerError, "Gagal mengambil data produk")
		}
		return
	}
	utils.RespondJSON(w, http.StatusOK, p)
}

func createProduct(w http.ResponseWriter, r *http.Request) {
	var p models.Product
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Payload data tidak valid")
		return
	}

	_, err := configs.DB.Exec("INSERT INTO products (name, stock, price) VALUES (?, ?, ?)", p.Name, p.Stock, p.Price)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Gagal menambahkan produk")
		return
	}

	utils.RespondJSON(w, http.StatusCreated, map[string]string{"message": "Produk berhasil ditambahkan"})
}

func updateProduct(w http.ResponseWriter, r *http.Request, id int) {
	var p models.Product
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Payload data tidak valid")
		return
	}

	result, err := configs.DB.Exec("UPDATE products SET name=?, stock=?, price=? WHERE id=?", p.Name, p.Stock, p.Price, id)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Gagal memperbarui produk")
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		utils.RespondError(w, http.StatusNotFound, "Produk tidak ditemukan")
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]string{"message": "Produk berhasil diperbarui"})
}

func deleteProduct(w http.ResponseWriter, r *http.Request, id int) {
	// Hapus history transaksi terkait terlebih dahulu agar tidak terkena Foreign Key Constraint
	_, err := configs.DB.Exec("DELETE FROM stock_transactions WHERE product_id=?", id)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Gagal membersihkan history transaksi produk")
		return
	}

	result, err := configs.DB.Exec("DELETE FROM products WHERE id=?", id)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Gagal menghapus produk")
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		utils.RespondError(w, http.StatusNotFound, "Produk tidak ditemukan")
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]string{"message": "Produk berhasil dihapus"})
}
