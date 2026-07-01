package handlers

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func ServeStaticFile(w http.ResponseWriter, r *http.Request, baseDir string, fileServer http.Handler) {
	path := strings.TrimPrefix(r.URL.Path, "/")
	fullPath := filepath.Join(baseDir, path)

	if strings.HasPrefix(r.URL.Path, "/api/") {
		http.NotFound(w, r)
		return
	}

	_, err := os.Stat(fullPath)
	if err != nil {
		http.ServeFile(w, r, filepath.Join(baseDir, "index.html"))
		return
	}
	fileServer.ServeHTTP(w, r)
}
