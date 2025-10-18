# LogiLeet - Intelligent Logistics \& Delivery Management Platform



**LogiLeet** is a MonoRepo full-stack, real-time logistics and delivery management system built with a modern technology stack. It provides a seamless, interactive experience for customers, drivers, and administrators to manage the entire delivery lifecycle, from request creation to live tracking and final delivery confirmation.

This project demonstrates a production-grade application architecture, featuring a monorepo structure, robust backend services, a responsive frontend, and real-time communication via WebSockets.

[**View the Live Demo**](https://logileet.vercel.app/)

## 🎯 Project Objective

The goal of LogiLeet is to build a scalable, real-time, and user-friendly platform that solves the core challenges of last-mile delivery. The system is designed to provide:

* **Transparency** for customers through live package tracking and notifications.
* **Efficiency** for drivers with clear assignments and optimized routing.
* **Control** for administrators with a centralized dashboard to monitor and manage all operations.

This project showcases advanced full-stack engineering skills, including system design, real-time data handling, third-party API integration, and secure authentication.

## ✨ Key Features

LogiLeet is divided into three distinct user roles, each with a tailored set of features:

### 👤 **Customer Portal**

* **Intuitive Delivery Creation:** A guided form with real-time address geocoding (via React Leaflet API) to prevent errors.
* **Live Delivery Tracking:** A real-time map interface to track the assigned driver's location, with live ETA updates.
* **Dashboard:** A centralized view of all active and past deliveries with their current status.
* **Real-time Notifications:** Receive instant updates when a delivery is assigned, picked up, or completed.
* **Cancellation:** Ability to cancel a delivery request before a driver is assigned.
<img width="1366" height="676" alt="image" src="https://github.com/user-attachments/assets/297dcbf3-18c7-406e-bb1a-d8052f1f62d6" />


### 🚗 **Driver Portal**

* **Active Delivery Dashboard:** A clear view of assigned deliveries with pickup and dropoff details.
* **Real-time Location Emission:** The driver's location is automatically sent to the server for live tracking.
* **Status Updates:** Simple one-click actions to update the delivery status (Picked Up, On Route, Delivered).
* **Cancellation Flow:** Ability to cancel an active delivery with a required reason.
* **Delivery History:** A log of all completed deliveries.
<img width="1350" height="646" alt="image" src="https://github.com/user-attachments/assets/63abf7de-b602-4cd3-a354-2f7e598b4556" />


### 👑 **Admin Dashboard**

* **Centralized Monitoring:** A comprehensive overview of all deliveries, vehicles, and drivers.
* **Filtering \& Searching:** Powerful tools to filter deliveries by status (Pending, On Route, etc.) and search by ID, customer, or package details.
* **Live Fleet Tracking:** Monitor all active deliveries on a live map from a single interface.
* **Intelligent Assignment:** An intuitive modal to assign available drivers and vehicles to pending deliveries.
* **User \& Vehicle Management:** Full CRUD functionality to manage users (customers, drivers, admins) and vehicles in the fleet.
* **Real-time Analytics:** Stats on pending, active, and completed deliveries.
<img width="1352" height="640" alt="image" src="https://github.com/user-attachments/assets/aca39435-840d-4f18-b732-2c9a1b0e8f6a" />


## 🛠️ Tech Stack \& Architecture

This project is a **monorepo** managed with `npm workspaces`, containing two main packages: `frontend` and `backend`.

### **Backend**

* **Runtime:** Node.js with TypeScript
* **Framework:** Express.js
* **Database:** MongoDB with Mongoose ODM
* **Real-time Communication:** Socket.IO for WebSocket-based live tracking and notifications.
* **Authentication:** JWT (JSON Web Tokens) with access and refresh token strategy.
* **Validation:** `express-validator` for robust request validation.
* **Mapping \& Routing:** React Leaflet Maps API for geocoding, route calculation, and real-time ETA.
* **Deployment:** Hosted on **Render** as a Node.js web service.


### **Frontend**

* **Framework:** React with Vite for a fast development experience.
* **Language:** TypeScript
* **State Management:** Zustand for simple and scalable global state management.
* **Data Fetching \& Caching:** TanStack Query (React Query) for efficient data synchronization and caching.
* **Styling:** Tailwind CSS for a utility-first styling approach.
* **UI Components:** Shadcn/UI for beautifully designed, accessible components.
* **Mapping:** Leaflet with React-Leaflet for a lightweight and reliable interactive map experience.
* **Forms:** React Hook Form with Zod for type-safe form validation.
* **Deployment:** Hosted on **Vercel** with automatic deployments via Git.


### **Architecture Highlights**

* **RESTful API Design:** A clean, well-structured API for all backend operations.
* **Real-time Layer:** A dedicated Socket.IO layer for handling live location updates and pushing notifications to clients, reducing the need for constant polling.
* **Role-Based Access Control (RBAC):** Secure middleware on the backend ensures that users can only access endpoints and perform actions permitted by their role.
* **Monorepo Structure:** Simplifies development and dependency management across the frontend and backend.


## 🚀 Getting Started

### **Prerequisites**

* Node.js (v18 or higher)
* npm (v9 or higher)
* MongoDB Atlas account or a local MongoDB instance


### **Installation**

1. **Clone the repository:**

```bash
git clone https://github.com/Hussain-Sharif/LogiLeet.git
cd LogiLeet
```

2. **Install dependencies in the root directory:**
This will install dependencies for both `frontend` and `backend` workspaces.

```bash
npm install
```


### **Backend Setup**

1. Navigate to the backend directory:

```bash
cd backend
```

2. Create a `.env` file and add the following environment variables:

```env
PORT=9000
MONGODB_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret_key>
JWT_REFRESH_SECRET=<your_jwt_refresh_secret_key>
FRONTEND_URL=http://localhost:3000
```

3. Run the backend server:

```bash
npm run dev
```

The server will be running on `http://localhost:9000`.

### **Frontend Setup**

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Create a `.env` file and add the following environment variables:

```env
VITE_API_URL=http://localhost:9000/api
VITE_SOCKET_URL=http://localhost:9000
```

3. Run the frontend development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 📈 Future Enhancements

* **Route Optimization:** Implement an algorithm to suggest the most efficient route for multi-stop deliveries.
* **Payment Integration:** Integrate a payment gateway like Stripe or Razorpay for delivery payments.
* **Driver Ratings:** Allow customers to rate their delivery experience.
* **Analytics \& Reporting:** A dedicated analytics page for admins to view performance metrics.
* **Mobile App:** Develop a native mobile app using React Native for a better driver experience.

