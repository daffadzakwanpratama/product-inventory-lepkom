package models

//  Buat Struct User
type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Password string `json:"-"`
	Role     string `json:"role"`
	ApiToken string `json:"api_token,omitempty"`
}

type Credentials struct {
	Username string `json:"username"`
	Password string `json:"password"`
}
