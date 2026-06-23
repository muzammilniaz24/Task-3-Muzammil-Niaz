# Hotel Management System

A full-stack hotel management application built with HTML, CSS, JavaScript, Node.js, Express.js, MySQL, and Bootstrap 5.

## Features

- **Dashboard** — Total rooms, bookings, available rooms, and occupied rooms
- **Room Management** — Full CRUD for hotel rooms
- **Guest Management** — Full CRUD for guest records
- **Booking Management** — Create bookings with automatic total calculation and room status updates
- **Strict Multi-Layered Validation** — Real-time regex validation, Pakistan CNIC auto-formatting, phone number validation, and booking date safety checks enforced on both client and server sides.

## Security & Real-World Context

This application is designed as an **internal management dashboard** (for hotel staff/receptionists) rather than a guest-facing public website. In a production environment, direct CRUD actions (adding, updating, or deleting rooms and guests) are typically protected by:
- **Authentication (Login/Signup)** to block unauthorized public access.
- **Role-Based Access Control (RBAC)** where only managers/admins can modify rooms, while front-desk staff manage bookings/guests.

## Project Structure

```
hotel-management-system/
├── frontend/          # HTML, CSS, JavaScript UI
├── backend/           # Node.js + Express API
└── database/          # MySQL schema file
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [MySQL](https://www.mysql.com/) (v8 or higher)

## Setup Instructions

### 1. Clone or download the project

Navigate to the project folder:

```bash
cd "hotel-management-system"
```

### 2. Set up the database

Open MySQL and run the schema file:

```bash
mysql -u root -p < database/hotel_management.sql
```

Or import `database/hotel_management.sql` using MySQL Workbench or phpMyAdmin.

### 3. Configure environment variables

Copy the example env file and update your MySQL credentials:

```bash
cd backend
copy .env.example .env
```

Edit `.env`:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=hotel_management
PORT=3000
```

### 4. Install backend dependencies

```bash
cd backend
npm install
```

### 5. Start the server

```bash
npm start
```

The server runs at **http://localhost:3000**

### 6. Open the application

Open your browser and go to:

```
http://localhost:3000
```

The Express server serves the frontend and API from the same port.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Dashboard statistics |
| GET | `/api/rooms` | List all rooms |
| GET | `/api/rooms/:id` | Get single room |
| POST | `/api/rooms` | Add new room |
| PUT | `/api/rooms/:id` | Update room |
| DELETE | `/api/rooms/:id` | Delete room |
| GET | `/api/guests` | List all guests |
| GET | `/api/guests/:id` | Get single guest |
| POST | `/api/guests` | Add new guest |
| PUT | `/api/guests/:id` | Update guest |
| DELETE | `/api/guests/:id` | Delete guest |
| GET | `/api/bookings` | List all bookings |
| GET | `/api/bookings/:id` | Get single booking |
| POST | `/api/bookings` | Create booking |
| PUT | `/api/bookings/:id` | Update booking |
| DELETE | `/api/bookings/:id` | Delete booking |

## Database Schema

- **rooms** — Room number, type, price, status
- **guests** — Full name, CNIC, phone, email, address
- **bookings** — Guest and room references, dates, total amount

Foreign keys link bookings to guests and rooms. Deleting a guest or room with existing bookings is blocked.

## Notes

- Booking total is calculated as: `(check-out - check-in days) × room price per night`
- Creating a booking marks the room as **Occupied**
- Deleting a booking marks the room as **Available**
- Sample data is included in the SQL file for testing
