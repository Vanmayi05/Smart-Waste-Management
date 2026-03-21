# 🔐 Cryptography-Based Secure Authentication System

## 📌 Project Overview
This project implements a secure authentication system using
cryptography and cybersecurity best practices. It is designed
as a backend authentication module that can be integrated into
larger applications.

The system ensures secure handling of user credentials and
sensitive data using modern cryptographic techniques.

---

## 🧠 Cryptography Concepts Implemented

### 1. Password Hashing (bcrypt)
- User passwords are hashed using bcrypt with salting.
- Plaintext passwords are never stored.
- Even if the database is compromised, original passwords
  cannot be recovered.

### 2. AES Encryption (Symmetric Cryptography)
- Sensitive user data such as email is encrypted using AES.
- Data is stored in encrypted form in MongoDB.
- Decryption is performed only when required.

### 3. JWT (JSON Web Tokens)
- JWT tokens are generated after successful login.
- Tokens are cryptographically signed using HMAC-SHA256.
- Used for secure session management.

---

## 🛡 Cybersecurity Features
- Secure authentication flow
- No plaintext password storage
- Encrypted sensitive data
- Token-based authorization
- Role-based access control

---

## ⚙️ Technology Stack
- Backend: Node.js, Express.js
- Database: MongoDB
- Cryptography Libraries:
  - bcryptjs
  - crypto-js
  - jsonwebtoken

---

## 🔄 Authentication Flow
1. User registers
2. Password is hashed using bcrypt
3. Email is encrypted using AES
4. User data is stored securely in MongoDB
5. On login:
   - Password is verified using bcrypt
   - JWT token is generated
   - Email is decrypted before sending response

---

## 🚀 API Endpoints

### Signup
POST /api/auth/signup

{
  "username": "user1",
  "email": "user@test.com",
  "password": "Password@123",
  "roles": ["user"]
}

---

### Login
POST /api/auth/signin

{
  "username": "user1",
  "password": "Password@123"
}

---

## ▶️ How to Run the Project

1. Install dependencies
npm install

2. Ensure MongoDB is running
mongodb://localhost:27017

3. Start the server
npm start

Server runs on port 8080.

---

## 👤 Individual Contribution
This module focuses on implementing cryptography and secure
authentication, including password hashing using bcrypt,
AES encryption for sensitive data, and JWT-based authentication.

---

## 🎓 Academic Relevance
This project demonstrates practical implementation of
cryptography and cybersecurity concepts and is suitable
for a 6th Semester Mini Project.

---

## 📌 Acknowledgement
This project is built upon an open-source JWT authentication
base project. The cryptography enhancements — including bcrypt
password hashing, AES encryption for sensitive data, and
secure JWT-based authentication — were implemented as part
of an academic mini-project.
