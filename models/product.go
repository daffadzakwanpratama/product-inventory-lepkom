package models

// Buat struct Product
type Product struct {
	ID		int		`json:"id"`
	Name	string	`json:"name"`
	Stock	int		`json:"stock"`
	Price	float64	`json:"price"`
}