package models

import "time"

type StockTransaction struct {
	ID              int       `json:"id"`
	UserID          int       `json:"user_id"`
	Username        string    `json:"username,omitempty"` // for joining display
	ProductID       int       `json:"product_id"`
	ProductName     string    `json:"product_name,omitempty"` // for joining display
	TransactionType string    `json:"transaction_type"`       // 'IN' or 'OUT'
	Quantity        int       `json:"quantity"`
	CreatedAt       time.Time `json:"created_at"`
}
