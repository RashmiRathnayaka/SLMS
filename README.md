# 📚 SLMS — Smart Library Management System

A full-stack **MERN** (MongoDB, Express, React, Node.js) web application for managing a university library. Students can search and borrow books, join waiting lists, read e-books online, compete on a weekly reading leaderboard and get course-based recommendations, while staff and admins manage the collection, requests, users and analytics through role-based dashboards.

---

## ✨ Features

### 👩‍🎓 Students
- **Search & browse books** — filter by category, view related and trending books
- **Borrow requests** — request books and track borrow status and due dates
- **Waiting list** — queue for unavailable books; when a copy is free the next person is notified and has **24 hours** to claim it
- **Digital e-library** — read PDFs in the browser, download, and save favourites
- **🏆 Weekly reader leaderboard** — top 10 readers of the current week (Mon–Sun), ranked by distinct e-books read
- **Courses & recommendations** — enrol in courses and receive personalised book recommendations based on courses, borrows and waiting list activity
- **Inquiries** — send questions to library staff and view replies
- **Damage reports** — report damaged or lost books
- **Profile** — manage personal details and profile image

### 🧑‍💼 Staff
- Approve, reject and mark returns for **borrow requests**
- Reply to and close **inquiries**
- Review **damage reports**
- Bulk **import books from CSV**

### 🛠️ Admin
- **Book management** — add, edit, delete books and cover images
- **E-book management** — upload PDFs with cover images, edit and deactivate e-books
- **Course management** — create courses with keywords used for recommendations
- **User management** — change roles and activate/deactivate accounts
- **Waiting list management**
- **Analytics dashboard** — charts for books, borrows and e-book usage (Recharts)

### ⚙️ Background jobs
- Expired waiting-list claims are checked **every 15 minutes** and the next user in the queue is notified
- **Trending books** stats are recalculated on startup and once a day

---

## 🧰 Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 19, Vite, React Router, Axios, React Hook Form, React Toastify, Recharts |
| Backend | Node.js, Express 5, Mongoose |
| Database | MongoDB (local or MongoDB Atlas) |
| Auth | JSON Web Tokens (JWT), bcryptjs, role-based access (student / staff / admin) |
| File uploads | Multer (PDF e-books, images, CSV imports), csv-parser |

---

## 📁 Project Structure

```
SLMS/
├── backend/
│   ├── config/          # MongoDB connection
│   ├── controllers/     # Route logic (auth, books, borrows, ebooks, courses, ...)
│   ├── middleware/      # JWT auth guards, Multer upload configs
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routers
│   ├── uploads/         # Uploaded e-books and images (served at /uploads)
│   ├── seed.js          # Sample data script
│   └── server.js        # App entry point + background jobs
└── frontend/
    ├── public/
    └── src/
        ├── api/         # Axios instance
        ├── components/  # Navbar, Footer, PrivateRoute
        ├── context/     # AuthContext
        └── pages/
            ├── auth/    # Login, Register
            ├── user/    # Dashboard, SearchBooks, EBooks, Courses, ...
            ├── staff/   # BorrowRequests, InquiryManagement, DamageManagement
            └── admin/   # Book/EBook/Course/User management, Analytics
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18 or later
- [MongoDB](https://www.mongodb.com/) running locally, or a MongoDB Atlas connection string

### 1. Clone the repository
```bash
git clone https://github.com/RashmiRathnayaka/SLMS.git
cd SLMS
```

### 2. Set up the backend
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/slms
JWT_SECRET=your_jwt_secret_here

# Optional — only needed if your network blocks SRV lookups for mongodb+srv:// URIs
DNS_SERVERS=8.8.8.8,1.1.1.1
```

(Optional) Load sample data:
```bash
node seed.js          # insert sample users, books, e-books, courses, etc.
node seed.js --reset  # clear all collections
```

Start the API:
```bash
npm run dev   # with nodemon
# or
npm start
```
The API runs at `http://localhost:5000`.

### 3. Set up the frontend
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
The app runs at `http://localhost:5173`. Vite proxies `/api` and `/uploads` requests to the backend on port 5000.

---

## 🔑 Demo Accounts (after running `seed.js`)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@smartlib.lk | Admin@1234 |
| Staff | rashmi@smartlib.lk | Staff@1234 |
| Student | ashan@student.lk | Student@1234 |

> These are for local development only — change them before deploying anywhere.

---

## 🔌 API Overview

All routes are prefixed with `/api`. Protected routes need an `Authorization: Bearer <token>` header.

| Resource | Base route | Main endpoints |
|----------|-----------|----------------|
| Auth & users | `/api/auth` | `POST /register`, `POST /login`, `GET/PUT /profile`, `GET /users`, `PUT /users/:id/role`, `PUT /users/:id/toggle` |
| Books | `/api/books` | `GET /`, `GET /:id`, `GET /trending`, `GET /:id/related`, `GET /favourites`, `POST /:id/favourite`, `POST /`, `PUT /:id`, `DELETE /:id`, `POST /import/csv`, `GET /analytics` |
| Borrows | `/api/borrows` | `POST /`, `GET /my`, `GET /`, `PUT /:id/approve`, `PUT /:id/reject`, `PUT /:id/return` |
| Waiting list | `/api/waiting` | `POST /`, `GET /my`, `GET /all`, `GET /book/:bookId`, `POST /:id/claim`, `POST /expire`, `DELETE /:id` |
| E-books | `/api/ebooks` | `GET /`, `GET /:id`, `GET /leaderboard`, `GET /favourites`, `GET /history`, `GET /:id/serve`, `GET /:id/download`, `POST /:id/track`, `POST /:id/favourite`, `POST /`, `PUT /:id`, `DELETE /:id`, `GET /analytics` |
| Courses | `/api/courses` | `GET /`, `GET /enrolled`, `GET /recommendations`, `POST /:id/enroll`, `DELETE /:id/enroll`, `POST /`, `PUT /:id`, `DELETE /:id` |
| Recommendations | `/api/recommendations` | `GET /` |
| Inquiries | `/api/inquiries` | `POST /`, `GET /my`, `GET /`, `PUT /:id/reply`, `PUT /:id/close` |
| Damage reports | `/api/damages` | `POST /`, `GET /my`, `GET /`, `PUT /:id/review` |

---

## 📜 Available Scripts

| Location | Command | Description |
|----------|---------|-------------|
| backend | `npm run dev` | Start API with nodemon |
| backend | `npm start` | Start API with node |
| backend | `node seed.js` | Seed the database |
| frontend | `npm run dev` | Start Vite dev server |
| frontend | `npm run build` | Production build |
| frontend | `npm run preview` | Preview the production build |
| frontend | `npm run lint` | Run ESLint |

---

## 👩‍💻 Author

**Rashmi Rathnayaka** — [@RashmiRathnayaka](https://github.com/RashmiRathnayaka)
