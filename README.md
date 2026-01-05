# Smart Booking – Appointment Management System

A full-stack **Smart Appointment Booking System** that allows clients to book services based on city availability and time slots, while service providers (admins) can manage services, slots, bookings, and ratings.

This project is built as a **real-world SaaS-style application** with separate **Client** and **Admin** roles, duplicate-slot prevention, ratings, and a clean dashboard flow.

---

## 🚀 Features

### 👤 Client Features
- Client authentication (login & signup)
- City-based service discovery
- View available services and time slots
- Book appointments instantly
- Automatic prevention of double bookings
- View personal booking history
- Rate completed services with comments

### 🧑‍💼 Admin Features
- Admin authentication & registration
- Add and manage services
- Create time slots for specific dates
- Duplicate time-slot prevention
- View bookings for own services only
- Update booking status (pending / completed / cancelled)
- View client ratings and feedback

---

## 🛠 Tech Stack

### Frontend
- HTML5  
- CSS3  
- Vanilla JavaScript  
- Single Page Application (SPA) style client dashboard  

### Backend
- Node.js  
- Express.js  
- PostgreSQL  
- bcrypt / bcryptjs (password hashing)  
- RESTful APIs  

---

## 🗂 Project Structure
```
smart-booking/
│
├── frontend/
│ ├── index.html # Client SPA (home, services, bookings)
│ ├── login.html # Login page (client & admin)
│ ├── client-signup.html # Client registration
│ ├── styles.css # Shared UI styles
│ ├── script.js # Client-side logic
│ └── signup.js # Signup logic
│
├── admin/
│ ├── dashboard.html # Admin dashboard
│ ├── services.html # Manage services
│ ├── slots.html # Manage time slots
│ ├── bookings.html # View bookings
│ ├── ratings.html # View ratings
│ ├── admin-signup.html # Admin registration
│ ├── admin.css # Admin UI styles
│ ├── admin-common.js # Shared admin auth logic
│ ├── dashboard.js # Dashboard logic
│ ├── services.js # Services logic
│ ├── slots.js # Slot creation logic
│ ├── bookings.js # Booking management logic
│ └── ratings.js # Ratings logic
│
├── backend/
│ ├── server.js # Express server & REST APIs
│ ├── db.js # PostgreSQL connection
│ ├── package.json # Backend dependencies
│ └── package-lock.json # Dependency lock file
│
└── README.md # Project documentation
```
---

## 🧑‍💻 Installation & Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/smart-booking.git
cd smart-booking

