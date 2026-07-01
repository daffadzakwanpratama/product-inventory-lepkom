package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"product-inventory/configs"
	"product-inventory/models"
	"product-inventory/utils"

	"golang.org/x/crypto/bcrypt"
)

func Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	roleVal := r.Context().Value("role")
	if roleVal == nil || roleVal.(string) != "admin" {
		utils.RespondError(w, http.StatusForbidden, "Hanya admin yang dapat membuat user baru")
		return
	}

	var creds models.Credentials
	err := json.NewDecoder(r.Body).Decode(&creds)
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(creds.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	_, err = configs.DB.Exec("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", creds.Username, string(hashedPassword), "user")
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Gagal membuat user baru")
		return
	}

	utils.RespondJSON(w, http.StatusCreated, map[string]string{"Sukses": "Berhasil mendaftarkan user baru"})
}

func Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var creds models.Credentials
	err := json.NewDecoder(r.Body).Decode(&creds)
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Format atau isi payload tidak valid")
		return
	}

	var user models.User
	var apiToken sql.NullString
	err = configs.DB.QueryRow("SELECT id, username, password, role, api_token FROM users WHERE username = ?", creds.Username).
		Scan(&user.ID, &user.Username, &user.Password, &user.Role, &apiToken)
	if err != nil {
		utils.RespondError(w, http.StatusUnauthorized, "Username atau password salah!")
		return
	}

	if apiToken.Valid {
		user.ApiToken = apiToken.String
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(creds.Password))
	if err != nil {
		utils.RespondError(w, http.StatusUnauthorized, "Username atau password salah!")
		return
	}

	token, err := utils.GenerateToken(creds.Username, user.Role)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Gagal membuat token")
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"token":     token,
		"role":      user.Role,
		"api_token": user.ApiToken,
	})
}

func GenerateAPIToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	usernameVal := r.Context().Value("username")
	roleVal := r.Context().Value("role")

	if usernameVal == nil || roleVal == nil {
		utils.RespondError(w, http.StatusUnauthorized, "Unauthorized context")
		return
	}

	username := usernameVal.(string)
	role := roleVal.(string)

	if role != "admin" {
		utils.RespondError(w, http.StatusForbidden, "Hanya admin yang dapat mengenerate API Token")
		return
	}

	apiToken, _ := utils.GenerateToken(username+"_api", "admin")

	_, err := configs.DB.Exec("UPDATE users SET api_token = ? WHERE username = ?", apiToken, username)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Gagal mengupdate API token")
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]string{
		"pesan":     "API Token berhasil digenerate",
		"api_token": apiToken,
	})
}

func DeleteUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	roleVal := r.Context().Value("role")
	if roleVal == nil || roleVal.(string) != "admin" {
		utils.RespondError(w, http.StatusForbidden, "Hanya admin yang dapat menghapus user")
		return
	}

	idStr := r.URL.Path[len("/api/users/"):]
	if idStr == "" {
		utils.RespondError(w, http.StatusBadRequest, "ID user diperlukan")
		return
	}

	_, err := configs.DB.Exec("DELETE FROM stock_transactions WHERE user_id = ?", idStr)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Gagal membersihkan history transaksi user")
		return
	}

	_, err = configs.DB.Exec("DELETE FROM users WHERE id = ?", idStr)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Gagal menghapus user")
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]string{"message": "User berhasil dihapus"})
}

func GetUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	roleVal := r.Context().Value("role")
	if roleVal == nil || roleVal.(string) != "admin" {
		utils.RespondError(w, http.StatusForbidden, "Hanya admin yang dapat melihat daftar user")
		return
	}

	rows, err := configs.DB.Query("SELECT id, username, role, api_token FROM users")
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Gagal mengambil data user")
		return
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		var apiToken sql.NullString
		if err := rows.Scan(&u.ID, &u.Username, &u.Role, &apiToken); err != nil {
			utils.RespondError(w, http.StatusInternalServerError, "Gagal memparsing data user")
			return
		}
		if apiToken.Valid {
			u.ApiToken = apiToken.String
		}
		users = append(users, u)
	}

	utils.RespondJSON(w, http.StatusOK, users)
}

func GenerateUserToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	roleVal := r.Context().Value("role")
	usernameVal := r.Context().Value("username")

	if roleVal == nil || usernameVal == nil {
		utils.RespondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	idStr := r.URL.Path[len("/api/users/") : len(r.URL.Path)-len("/token")]
	if idStr == "" {
		utils.RespondError(w, http.StatusBadRequest, "ID user diperlukan")
		return
	}

	var targetUsername, targetRole string
	err := configs.DB.QueryRow("SELECT username, role FROM users WHERE id = ?", idStr).Scan(&targetUsername, &targetRole)
	if err != nil {
		utils.RespondError(w, http.StatusNotFound, "User tidak ditemukan")
		return
	}

	if roleVal.(string) != "admin" && usernameVal.(string) != targetUsername {
		utils.RespondError(w, http.StatusForbidden, "Anda hanya dapat membuat token untuk akun Anda sendiri")
		return
	}

	apiToken, _ := utils.GenerateToken(targetUsername+"_api", targetRole)

	_, err = configs.DB.Exec("UPDATE users SET api_token = ? WHERE id = ?", apiToken, idStr)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Gagal mengupdate API token")
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]string{
		"pesan":     "API Token berhasil digenerate untuk " + targetUsername,
		"api_token": apiToken,
	})
}

func DeleteUserToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	roleVal := r.Context().Value("role")
	usernameVal := r.Context().Value("username")

	if roleVal == nil || usernameVal == nil {
		utils.RespondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	idStr := r.URL.Path[len("/api/users/") : len(r.URL.Path)-len("/token")]
	if idStr == "" {
		utils.RespondError(w, http.StatusBadRequest, "ID user diperlukan")
		return
	}

	var targetUsername string
	err := configs.DB.QueryRow("SELECT username FROM users WHERE id = ?", idStr).Scan(&targetUsername)
	if err != nil {
		utils.RespondError(w, http.StatusNotFound, "User tidak ditemukan")
		return
	}

	if roleVal.(string) != "admin" && usernameVal.(string) != targetUsername {
		utils.RespondError(w, http.StatusForbidden, "Anda hanya dapat menghapus token untuk akun Anda sendiri")
		return
	}

	_, err = configs.DB.Exec("UPDATE users SET api_token = NULL WHERE id = ?", idStr)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Gagal menghapus API token")
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]string{
		"message": "API Token berhasil dihapus untuk " + targetUsername,
	})
}

func GenerateOwnToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	usernameVal := r.Context().Value("username")
	roleVal := r.Context().Value("role")

	if usernameVal == nil || roleVal == nil {
		utils.RespondError(w, http.StatusUnauthorized, "Unauthorized context")
		return
	}

	username := usernameVal.(string)
	role := roleVal.(string)

	apiToken, _ := utils.GenerateToken(username+"_api", role)

	_, err := configs.DB.Exec("UPDATE users SET api_token = ? WHERE username = ?", apiToken, username)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Gagal mengupdate API token")
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]string{
		"pesan":     "API Token berhasil digenerate",
		"api_token": apiToken,
	})
}
