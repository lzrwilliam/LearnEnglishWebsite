# 🧠 Learn English — Full-Stack Web Platform (Flask + React)

> An interactive web application for learning English, built entirely from scratch using **Flask (Python)** for the backend and **React (JavaScript)** for the frontend.  
> The platform combines dynamic exercises, gamification, role-based management, and notifications to deliver a complete and engaging language learning experience.

---

## 🚀 Overview

This project provides an educational platform where users can:
- Learn English through multiple types of exercises.
- Earn XP and achievements as they progress.
- Report incorrect exercises for review.
- Apply for higher-level roles (reviewer / admin).
- Manage content and user roles through admin panels.

User roles:
- 👤 **User** – Solves exercises, tracks progress, submits feedback.
- 🧩 **Reviewer** – Manages exercises (add, edit, delete).
- 🛠️ **Admin** – Handles user role requests and moderation.

---

## 🧩 Key Features

### 🧠 Interactive Learning
- Exercises dynamically generated based on difficulty.
- Three main question types:
  - Multiple choice  
  - Fill in the blank  
  - Rearrange (drag & drop)
- Instant feedback and XP system.

### 🔁 Reports & Requests
- Users can report incorrect exercises directly.
- Requests are sent to reviewers for approval/rejection.

### 🧑‍🏫 Reviewer Panel
- Full CRUD functionality for exercises.
- Add, edit, or delete exercises with difficulty levels.

### 🛡️ Admin Panel
- Manage user role requests (promote or reject).
- View pending requests in real time.

### 🔐 Authentication & Route Protection
- JWT-based authentication system.
- Protected routes using `ProtectedRoute` in React.
- Tokens stored in localStorage/sessionStorage.
- Global authentication state via `AuthContext`.

---

## ⚙️ Technologies Used

### 🔧 Backend
- **Flask** — lightweight backend framework.
- **SQLAlchemy** — ORM for database interaction.
- **Flask-CORS** — enables frontend-backend communication.
- **PyJWT** — secure JWT authentication.
- **SQLite** — local database (easily replaceable with PostgreSQL/MySQL).

#### 🔸 Why CORS?
CORS (Cross-Origin Resource Sharing) allows the frontend (React, usually on port 3000) to securely communicate with the Flask backend (port 5000).  
Without it, browsers would block API requests due to cross-origin restrictions.

### 💻 Frontend
- **React** — dynamic and modular user interface.
- **Axios** — HTTP client for backend API communication.
- **React Router DOM** — handles navigation and route protection.
- **Context API** — manages authentication state globally.
- **React Hooks (useState, useEffect, useContext)** — state and lifecycle management.

---

## 🧠 Technical Motivation

- **Flask** was chosen for its simplicity, control, and fast setup.
- **React** provides a modern, component-based interface.
- Separation of concerns between frontend and backend increases scalability.
- **CORS + Axios** ensures smooth and secure communication between layers.
- **JWT + Context API** enables persistent and secure authentication.

---

## 🧱 Project Architecture


```plaintext
project/
│
├── backend/
│   ├── app.py
│   ├── models.py
│   ├── auth.py
│   ├── config.json
│   ├── instance/
│   │   └── duolingo_db.sqlite3
│   ├── routes/
│   │   ├── user_routes.py
│   │   ├── reviewer_routes.py
│   │   └── admin_routes.py
│   └── __init__.py
│
└── frontend/
    ├── package.json
    ├── node_modules/
    ├── public/
    │   ├── index.html
    │   └── favicon.ico
    ├── src/
    │   ├── App.js
    │   ├── api.js
    │   ├── index.js
    │   ├── components/
    │   │   ├── Questions.js
    │   │   ├── Reviewer.js
    │   │   ├── AdminRequests.js
    │   │   ├── ProtectedRoute.js
    │   │   ├── Login.js
    │   │   └── Register.js
    └── README.md
```


---

## 🔐 Authentication System

Authentication is handled using **JWT (JSON Web Tokens)**.  
After logging in, the backend issues a signed token stored on the client.

```js
// Token interceptor example (frontend/api.js)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

Protected routes example:
```js
<ProtectedRoute>
  <AdminRequests />
</ProtectedRoute>
```
Backend role validation uses decorators:
```js
@token_required
@role_required('admin')
def get_admin_data():
```

🧠 Exercises (Questions.js)

Dynamically fetch exercises based on user difficulty.
Supports feedback for correct/incorrect answers.
Includes drag & drop logic for rearrange-type questions.
Users can report incorrect questions directly to reviewers.

🧑‍🏫 Reviewer Panel

Displays all exercises from the database.
Allows creating, editing, or deleting exercises.
Supports different difficulty levels.
Real-time feedback on success/failure.

🛠️ Admin Panel

Displays all role requests submitted by users.
Admins can approve or reject requests.
Requests update dynamically without page reloads.

🔌 REST API Overview
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | /api/login | User authentication and token generation |
| POST | /api/register | Register a new user |
| GET | /api/questions | Retrieve exercises |
| POST | /api/report | Report incorrect exercise |
| GET | /api/admin/requests | Fetch pending role requests |
| POST | /api/reviewer/add | Add a new exercise |
| PUT | /api/reviewer/edit/<id> | Edit existing exercise |
| DELETE | /api/reviewer/delete/<id> | Delete exercise |

⚙️ Run the Project Locally
Backend (Flask)

cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install flask flask_sqlalchemy flask_cors PyJWT
python app.py

Backend runs on: http://127.0.0.1:5000

Frontend (React)

cd frontend
npm install
npm start

Frontend runs on: http://localhost:3000

🧩 Database

If the database file doesn’t exist, it will be created automatically at runtime:

if not os.path.exists(DB_PATH):
    db.create_all()

Default location: instance/duolingo_db.sqlite3

🎨 Design & UX

Clean, intuitive, and minimal design.
Gamified learning system (XP, progress, achievements).
Responsive layout (desktop and mobile).

🔮 Future Improvements

🔒 Password hashing with bcrypt or werkzeug.security
☁️ Database migration to PostgreSQL
📱 Modern UI with Tailwind or Material UI
🕒 Refresh tokens for long sessions
📊 User profile and progress tracking




