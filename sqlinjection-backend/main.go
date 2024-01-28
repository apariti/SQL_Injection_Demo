package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gofrs/uuid"
	_ "github.com/mattn/go-sqlite3"
	"github.com/rs/cors"
)

var db *sql.DB

type User struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type Book struct {
	ISDN   string `json:"isdn"`
	Title  string `json:"title"`
	Author string `json:"author"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

func main() {
	initDB()
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("/register", registerHandler)
	mux.HandleFunc("/login", loginHandler)
	mux.HandleFunc("/books", bookHandler)
	mux.HandleFunc("/delete", deleteBookHandler)

	handler := cors.Default().Handler(mux)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server is running on :%s...\n", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func initDB() {
	var err error
	db, err = sql.Open("sqlite3", "./books.db")
	if err != nil {
		log.Fatal(err)
	}

	_, err = db.Exec(`
        CREATE TABLE IF NOT EXISTS users (
            email TEXT PRIMARY KEY,
            password TEXT
        );
    `)
	if err != nil {
		log.Fatal(err)
	}

	_, err = db.Exec(`
        CREATE TABLE IF NOT EXISTS books (
            isdn TEXT PRIMARY KEY,
            title TEXT,
            author TEXT
        );
    `)
	if err != nil {
		log.Fatal(err)
	}
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	var user User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	//query := "INSERT INTO users (email, password) VALUES ('" + user.Email + "', '" + user.Password + "');"
	//_, err = db.Exec(query)
	_, err = db.Exec("INSERT INTO users (email, password) VALUES (?, ?);", user.Email, user.Password)
	if err != nil {
		log.Println("Error inserting user:", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	var user User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	// Intentionally vulnerable SQL query
	query := fmt.Sprintf("SELECT password FROM users WHERE email = '%s' AND password = '%s'", user.Email, user.Password)
	row := db.QueryRow(query)
	//Query to prevent SQL injection
	//query := "SELECT password FROM users WHERE email = ? AND password = ?"
	//row := db.QueryRow(query, user.Email, user.Password)

	var storedPassword string
	err = row.Scan(&storedPassword)
	if err != nil {
		if err == sql.ErrNoRows {
			sendErrorResponse(w, "Invalid email or password")
			return
		}
		log.Println("Error querying user:", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func deleteBookHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	var book Book
	err := json.NewDecoder(r.Body).Decode(&book)
	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	// Vulnerable SQL Query
	query := "DELETE FROM books WHERE isdn = '" + book.ISDN + "'"
	res, err := db.Exec(query)
	// Secure SQL Query using parameterized statement
	//query := "DELETE FROM books WHERE isdn = ?"
	//res, err := db.Exec(query, book.ISDN)

	if err != nil {
		log.Println("Error executing SQL statement:", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	// Check if a row was actually deleted
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		log.Println("Error fetching rows affected:", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	if rowsAffected == 0 {
		http.Error(w, "No rows affected", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func bookHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		var book Book
		err := json.NewDecoder(r.Body).Decode(&book)
		if err != nil {
			http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
			return
		}

		book.ISDN = generateUUID()

		query := fmt.Sprintf("INSERT INTO books (isdn, title, author) VALUES ('%s', '%s', '%s');", book.ISDN, book.Title, book.Author)
		_, err = db.Exec(query)
		//_, err = db.Exec("INSERT INTO books (isdn, title, author) VALUES (?, ?, ?);", book.ISDN, book.Title, book.Author)
		if err != nil {
			log.Println("Error adding book:", err)
			sendErrorResponse(w, "Error adding the book")
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(book)
	} else if r.Method == http.MethodGet {
		rows, err := db.Query("SELECT * FROM books;")
		if err != nil {
			log.Println("Error querying books:", err)
			sendErrorResponse(w, "Error fetching existing data")
			return
		}
		defer rows.Close()

		var books []Book
		for rows.Next() {
			var book Book
			err := rows.Scan(&book.ISDN, &book.Title, &book.Author)
			if err != nil {
				log.Println("Error scanning book:", err)
				sendErrorResponse(w, "Error fetching existing data")
				return
			}
			books = append(books, book)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(books)
	} else {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
	}
}

func sendErrorResponse(w http.ResponseWriter, errMsg string) {
	w.WriteHeader(http.StatusUnauthorized)
	errResp := ErrorResponse{Error: errMsg}
	json.NewEncoder(w).Encode(errResp)
}
func generateUUID() string {
	u := uuid.Must(uuid.NewV4())
	return strings.Replace(u.String(), "-", "", -1)
}
