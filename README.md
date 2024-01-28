## Disclaimer

This project is intended for educational purposes only. Do not deploy this application on a public server or use it in any way that may harm systems or violate security policies.


# Web Application with SQL Injection Vulnerabilities

This is a simple web application built with a frontend in React and a backend in Go. The purpose of this project is to demonstrate SQL injection vulnerabilities in a web application.

## Project Structure

- `sqlinjection-frontend/`: Contains the React frontend code.
- `sqlinjection-backend/`: Contains the Go backend code.


## Setup Instructions

To run this project locally, follow these steps:

### Frontend

1. Navigate to the `frontend` directory.
2. Install dependencies: `npm install`
3. Start the development server: `npm start`

The frontend will be accessible at [http://localhost:3000](http://localhost:3000).

### Backend

1. Navigate to the `backend` directory.
2. Install Go if not already installed.
3. Run the backend server: `go run main.go`


## SQL Injection Demonstrations

The backend of the application contains multiple SQL injection vulnerabilities, especially in handlers like 'loginHandler' and 'deleteHandler'. These vulnerabilities occur because SQL queries are constructed using string concatenation, which can potentially allow for malicious input injection. 

### Login Handler SQL Injection

To demonstrate SQL injection in the login handler, follow these steps:

1. Access the login page of the application.
2. Enter the following values for the "Email" or "Password" fields:
   `' OR '1'='1`

This input should allow you to bypass authentication and log in as any user without a valid password.

### Delete Handler SQL Injection

To demonstrate SQL injection in the delete handler, follow these steps:

1. Access the delete book functionality of the application.
2. Enter the following value for the "ISDN" field:
   - ISDN: `'; DELETE FROM books; --`

This input should result in the deletion of all the records in "books" table from the database.

## Mitigation Strategies and Fixes

The primary method to prevent SQL Injection attacks is to replace string concatenation in SQL queries with parameterized queries or prepared statements. This approach ensures that user input is treated as data, preventing it from being executed as part of the SQL command, and thereby neutralizing injection attacks.


To fix this issue, modifications should be made to the backend code to ensure that user inputs are treated as data instead of executable code. This will maintain the integrity of SQL statements and prevent vulnerabilities. 

For your reference, I have left potential fixes to avoid SQL Injection vulnerabilities commented in the backend code.


