# Voting App

[English](#english) | [Bahasa Indonesia](#bahasa-indonesia)

## English

### Overview
A full-stack voting application built with React and Node.js that allows users to create, participate in, and analyze polls. Features secure authentication including Google OAuth integration.

### Features
- User Authentication
  - Local authentication with username/password
  - Google OAuth integration
  - Secure password handling with bcrypt
  - JWT-based authentication
  - reCAPTCHA integration for enhanced security

- Poll Management
  - Create custom polls
  - Vote on existing polls
  - Real-time results visualization
  - Poll analytics and statistics
  - Share polls with others

- Multi-language Support
  - Interface available in multiple languages
  - Easy language switching

### Technology Stack
#### Frontend
- React.js
- React Router for navigation
- Chart.js for data visualization
- Context API for state management
- Responsive CSS design

#### Backend
- Node.js with Express
- MongoDB for database
- Passport.js for authentication
- JWT for secure tokens
- Google OAuth2.0 integration

### Getting Started

1. Clone the repository:
```bash
git clone [repository-url]
cd Voting-App
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Environment Setup:
Create .env files in both backend and frontend directories with the following variables:

Backend (.env):
```
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=your_frontend_url
RECAPTCHA_SECRET_KEY=your_recaptcha_secret
```

Frontend (.env):
```
REACT_APP_API_URL=your_backend_url
REACT_APP_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

4. Run the application:
```bash
# Run backend
cd backend
npm start

# Run frontend
cd frontend
npm start
```

### Deployment
- Frontend is deployed on Netlify
- Backend is deployed on Railway

---

## Bahasa Indonesia

### Ikhtisar
Aplikasi voting full-stack yang dibangun dengan React dan Node.js yang memungkinkan pengguna untuk membuat, berpartisipasi, dan menganalisis polling. Dilengkapi dengan autentikasi yang aman termasuk integrasi Google OAuth.

### Fitur
- Autentikasi Pengguna
  - Autentikasi lokal dengan username/password
  - Integrasi Google OAuth
  - Penanganan password yang aman dengan bcrypt
  - Autentikasi berbasis JWT
  - Integrasi reCAPTCHA untuk keamanan tambahan

- Manajemen Polling
  - Membuat polling kustom
  - Memberikan suara pada polling yang ada
  - Visualisasi hasil secara real-time
  - Analitik dan statistik polling
  - Berbagi polling dengan orang lain

- Dukungan Multi Bahasa
  - Antarmuka tersedia dalam berbagai bahasa
  - Pergantian bahasa yang mudah

### Teknologi yang Digunakan
#### Frontend
- React.js
- React Router untuk navigasi
- Chart.js untuk visualisasi data
- Context API untuk manajemen state
- Desain CSS yang responsif

#### Backend
- Node.js dengan Express
- MongoDB untuk database
- Passport.js untuk autentikasi
- JWT untuk token yang aman
- Integrasi Google OAuth2.0

### Memulai

1. Clone repository:
```bash
git clone [repository-url]
cd Voting-App
```

2. Install dependensi:
```bash
# Install dependensi backend
cd backend
npm install

# Install dependensi frontend
cd ../frontend
npm install
```

3. Pengaturan Environment:
Buat file .env di direktori backend dan frontend dengan variabel berikut:

Backend (.env):
```
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=your_frontend_url
RECAPTCHA_SECRET_KEY=your_recaptcha_secret
```

Frontend (.env):
```
REACT_APP_API_URL=your_backend_url
REACT_APP_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

4. Menjalankan aplikasi:
```bash
# Jalankan backend
cd backend
npm start

# Jalankan frontend
cd frontend
npm start
```

### Deployment
- Frontend di-deploy di Netlify
- Backend di-deploy di Railway

---

## License

MIT License

Copyright (c) 2025 Voting App

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.