package middlewares

import (
	"context"
	"net/http"
	"product-inventory/configs"
	"product-inventory/utils"
	"strings"
)

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		if r.URL.Path == "/api/login" {
			next.ServeHTTP(w, r)
			return
		}

		// Ambil token dari header "Authorization"
		
		if authHeader == "" {
			utils.RespondError(w, http.StatusUnauthorized, "Mana Tokennya?")
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			utils.RespondError(w, http.StatusUnauthorized, "Format tokennya ngga valid loh ya")
			return
		}

		tokenString := parts[1]

		// Verifikasi keabsahan JWT Token menggunakan utils.ValidateToken()
		// 1. Coba verifikasi apakah token tersebut JWT yang valid
		
		if err == nil {
			username := claims.Username

			// Jika ini adalah token API (Long-Lived JWT), pastikan ia belum di-revoke (dihapus) di DB!
			if strings.HasSuffix(username, "_api") {
				if configs.DB != nil {
					var count int
					// Buat variabel errDB untuk melihat API Token yang ada & kondisi jika telah dihapus

				}
				username = strings.TrimSuffix(username, "_api")
			} else {
				referer := r.Header.Get("Referer")
				origin := r.Header.Get("Origin")

				if referer == "" && origin == "" {
					// BUKAN dari Web UI -> Wajib pakai API Token untuk endpoint operasional
					if strings.HasPrefix(r.URL.Path, "/api/products") || strings.HasPrefix(r.URL.Path, "/api/transactions") {
						utils.RespondError(w, http.StatusForbidden, "Akses ditolak! Request API operasional dari luar wajib menggunakan API Token.")
						return
					}
				}
			}

			// JWT Valid: masukkan username dan role ke context request
			ctx := context.WithValue(r.Context(), "username", username)
			ctx = context.WithValue(ctx, "role", claims.Role)
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		// 2. Jika bukan JWT valid, mungkin itu adalah API Token pihak ketiga (Long-lived Token)
		// Cek DB, apakah token tersebut ada di kolom api_token (Pastikan DB tidak nil saat testing)
		if configs.DB != nil {
			var username, role string
			errDB := configs.DB.QueryRow("SELECT username, role FROM users WHERE api_token = ?", tokenString).Scan(&username, &role)

			if errDB == nil {
				// API Token Valid: jalankan request

			}
		}

		// Jika kedua cara verifikasi gagal
		utils.RespondError(w, http.StatusUnauthorized, "Token salah atau expired")
	})
}
