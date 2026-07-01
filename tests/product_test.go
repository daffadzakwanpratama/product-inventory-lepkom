package tests

import (
	"net/http"
	"net/http/httptest"
	"product-inventory/handlers"
	"product-inventory/middlewares"
	"testing"
)

func TestGetProductsWithoutToken(t *testing.T) {
	// 1. Buat simulasi request (contoh GET /api/products)
	// Sengaja TIDAK menyertakan header Authorization
	req, err := http.NewRequest("GET", "/api/products", nil)
	if err != nil {
		t.Fatal(err)
	}

	// 2. Buat simulasi response recorder
	rr := httptest.NewRecorder()

	// 3. Kita bungkus HandleProducts dengan AuthMiddleware untuk memicu pengecekan Token
	handler := middlewares.AuthMiddleware(http.HandlerFunc(handlers.HandleProducts))

	// 4. Eksekusi handler
	handler.ServeHTTP(rr, req)

	// TODO!! Perbaiki nilai ekspektasi di bawah ini agar test LULUS!
	// Saat ini menguji "StatusOK" (200), padahal seharusnya Middleware menolak dengan "StatusUnauthorized" (401).
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Respon handler: diekspektasi %v mendapat %v", http.StatusOK, status)
	}
}
