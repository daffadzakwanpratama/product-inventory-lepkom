package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"product-inventory/configs"
	"product-inventory/handlers"
	"product-inventory/middlewares"
	"strconv"

	"github.com/joho/godotenv"
)

func main() {
	// Memuat variabel environment dari file .env
	err := godotenv.Load()
	if err != nil {
		log.Println("Gagal memuat isi file .env, menggunakan nilai default.")
	}

	// Initialize Database
	configs.ConnectDB()

	portStr := os.Getenv("PORT")
	if portStr == "" {
		portStr = "8080"
	}
	PORT, err := strconv.Atoi(portStr)
	if err != nil {
		PORT = 8080
	}
	mux := http.NewServeMux()

	// Frontend Static Files
	fileServer := http.FileServer(http.Dir("catalog"))
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		handlers.ServeStaticFile(w, r, "catalog", fileServer)
	})

	// Public API
	mux.HandleFunc("/api/login", handlers.Login)

	// Protected API (Users & Auth)
	mux.Handle("/api/register", middlewares.AuthMiddleware(http.HandlerFunc(handlers.Register)))
	mux.Handle("/api/users", middlewares.AuthMiddleware(http.HandlerFunc(handlers.GetUsers)))

	userActionHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		if len(path) > len("/api/users/") && path[len(path)-6:] == "/token" {
			if r.Method == http.MethodDelete {
				handlers.DeleteUserToken(w, r)
			} else {
				handlers.GenerateUserToken(w, r)
			}
		} else {
			handlers.DeleteUser(w, r)
		}
	})
	mux.Handle("/api/users/", middlewares.AuthMiddleware(userActionHandler))

	// Protected API (Products)
	// We wrap the product handler with the AuthMiddleware
	productHandler := http.HandlerFunc(handlers.HandleProducts)
	mux.Handle("/api/products", middlewares.AuthMiddleware(productHandler))
	mux.Handle("/api/products/", middlewares.AuthMiddleware(productHandler))

	// Protected API (Transactions)
	mux.Handle("/api/transactions", middlewares.AuthMiddleware(http.HandlerFunc(handlers.HandleTransactions)))

	// Admin API
	mux.Handle("/api/generate-token", middlewares.AuthMiddleware(http.HandlerFunc(handlers.GenerateAPIToken)))

	// User Self-Serve Token API
	mux.Handle("/api/user/token", middlewares.AuthMiddleware(http.HandlerFunc(handlers.GenerateOwnToken)))

	loggedMux := middlewares.LoggerMiddleware(mux)

	fmt.Printf("Server berhasil berjalan di http://localhost:%d\n", PORT)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", PORT), loggedMux))
}
