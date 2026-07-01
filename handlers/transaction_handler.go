package handlers

import (
	"encoding/json"
	"net/http"
	"product-inventory/configs"
	"product-inventory/models"
	"product-inventory/utils"
	"time"
)

func HandleTransactions(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getTransactions(w, r)
	case http.MethodPost:
		createTransaction(w, r)
	default:
		utils.RespondError(w, http.StatusMethodNotAllowed, "Method Not Allowed")
	}
}

func getTransactions(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT t.id, t.user_id, u.username, t.product_id, p.name, t.transaction_type, t.quantity, t.created_at
		FROM stock_transactions t
		JOIN users u ON t.user_id = u.id
		JOIN products p ON t.product_id = p.id
		ORDER BY t.created_at DESC
	`
	rows, err := configs.DB.Query(query)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Gagal mengambil data transaksi")
		return
	}
	defer rows.Close()

	var transactions []models.StockTransaction
	for rows.Next() {
		var t models.StockTransaction
		var createdAtBytes []byte
		if err := rows.Scan(&t.ID, &t.UserID, &t.Username, &t.ProductID, &t.ProductName, &t.TransactionType, &t.Quantity, &createdAtBytes); err != nil {
			utils.RespondError(w, http.StatusInternalServerError, "Gagal memproses data transaksi")
			return
		}

		t.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", string(createdAtBytes))
		transactions = append(transactions, t)
	}

	if transactions == nil {
		transactions = []models.StockTransaction{}
	}
	utils.RespondJSON(w, http.StatusOK, transactions)
}

func createTransaction(w http.ResponseWriter, r *http.Request) {
	var input struct {
		ProductID       int    `json:"product_id"`
		TransactionType string `json:"transaction_type"`
		Quantity        int    `json:"quantity"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Payload data tidak valid")
		return
	}

	if input.TransactionType != "IN" && input.TransactionType != "OUT" {
		utils.RespondError(w, http.StatusBadRequest, "Tipe transaksi harus IN atau OUT")
		return
	}

	if input.Quantity <= 0 {
		utils.RespondError(w, http.StatusBadRequest, "Quantity harus lebih besar dari 0")
		return
	}

	// Dapatkan username dari context auth middleware
	usernameRaw := r.Context().Value("username")
	if usernameRaw == nil {
		utils.RespondError(w, http.StatusUnauthorized, "User context tidak ditemukan")
		return
	}
	username := usernameRaw.(string)

	var userID int
	err := configs.DB.QueryRow("SELECT id FROM users WHERE username = ?", username).Scan(&userID)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Gagal melacak identitas user")
		return
	}

	tx, err := configs.DB.Begin()
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Gagal memulai transaksi DB")
		return
	}

	var currentStock int
	err = tx.QueryRow("SELECT stock FROM products WHERE id = ?", input.ProductID).Scan(&currentStock)
	if err != nil {
		tx.Rollback()
		utils.RespondError(w, http.StatusNotFound, "Produk tidak ditemukan")
		return
	}

	newStock := currentStock
	if input.TransactionType == "IN" {
		newStock += input.Quantity
	} else if input.TransactionType == "OUT" {
		if input.Quantity > currentStock {
			tx.Rollback()
			utils.RespondError(w, http.StatusBadRequest, "Stok tidak mencukupi untuk transaksi OUT")
			return
		}
		newStock -= input.Quantity
	}

	_, err = tx.Exec("UPDATE products SET stock = ? WHERE id = ?", newStock, input.ProductID)
	if err != nil {
		tx.Rollback()
		utils.RespondError(w, http.StatusInternalServerError, "Gagal memperbarui stok barang")
		return
	}

	_, err = tx.Exec("INSERT INTO stock_transactions (user_id, product_id, transaction_type, quantity) VALUES (?, ?, ?, ?)", userID, input.ProductID, input.TransactionType, input.Quantity)
	if err != nil {
		tx.Rollback()
		utils.RespondError(w, http.StatusInternalServerError, "Gagal mencatat log transaksi")
		return
	}

	if err := tx.Commit(); err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Gagal menyelesaikan komit transaksi")
		return
	}

	utils.RespondJSON(w, http.StatusCreated, map[string]string{"message": "Transaksi stok berhasil dicatat"})
}
