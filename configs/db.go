package configs

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
)

var DB *sql.DB

func ConnectDB() {
	var err error

	DB_HOST := os.Getenv("DB_HOST")
	DB_PORT := os.Getenv("DB_PORT")
	DB_USER := os.Getenv("DB_USER")
	DB_PASSWORD := os.Getenv("DB_PASSWORD")
	DB_NAME := os.Getenv("DB_NAME")

	// Soal Isi string koneksi database menggunakan environment variable
	// Format: "username:password@tcp(host:port)/dbname"
	

	DB, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("Gagal membuka koneksi ke database:")
	}

	// Gunakan DB.Ping() untuk memverifikasi koneksi

	log.Println("Sukses terkoneksi ke database!")
}
