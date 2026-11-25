# TechGarments Backend

Robust RESTful API and Cloud Firestore backend service for the **TechGarments** apparel manufacturing platform.

- **Firebase Project ID**: `techgarments-cdd93`
- **Firebase Console**: [https://console.firebase.google.com/project/techgarments-cdd93/overview](https://console.firebase.google.com/project/techgarments-cdd93/overview)
- **Cloud Firestore**: [https://console.firebase.google.com/project/techgarments-cdd93/firestore](https://console.firebase.google.com/project/techgarments-cdd93/firestore)

---

## 📁 Project Structure

```
TechGarments/
├── frontend/                     # Next.js 16 + React 19 Frontend
└── backend/                      # Express + TypeScript + Firebase Backend
    ├── src/
    │   ├── config/
    │   │   ├── env.ts            # Environment variable validation & defaults
    │   │   └── firebase.ts       # Firebase Admin & Firestore initialization
    │   ├── constants/
    │   │   └── collections.ts    # Firestore collection names
    │   ├── controllers/
    │   │   ├── auth.controller.ts     # Auth & user sync
    │   │   ├── buyer.controller.ts    # Buyer profiles
    │   │   ├── factory.controller.ts  # Factory search & profiles
    │   │   ├── order.controller.ts    # RFQs, orders, and statuses
    │   │   └── product.controller.ts  # Garment catalog items
    │   ├── middlewares/
    │   │   ├── auth.middleware.ts     # Firebase Auth ID token & role checker
    │   │   ├── error.middleware.ts    # Global error handler & ApiError
    │   │   └── validate.middleware.ts # Request validator
    │   ├── routes/
    │   │   ├── auth.routes.ts
    │   │   ├── buyer.routes.ts
    │   │   ├── factory.routes.ts
    │   │   ├── health.routes.ts
    │   │   ├── index.ts               # Aggregates /api routes
    │   │   ├── order.routes.ts
    │   │   └── product.routes.ts
    │   ├── services/
    │   │   ├── buyer.service.ts
    │   │   ├── factory.service.ts
    │   │   ├── firestore.service.ts   # Generic Firestore helper
    │   │   ├── order.service.ts
    │   │   ├── product.service.ts
    │   │   └── user.service.ts
    │   ├── types/
    │   │   ├── order.types.ts
    │   │   ├── product.types.ts
    │   │   └── user.types.ts
    │   ├── scripts/
    │   │   ├── seedData.ts            # Seeds sample factories & products
    │   │   └── testFirebase.ts        # Tests Firestore connection
    │   ├── app.ts                     # Express application setup
    │   └── server.ts                  # Server entrypoint
    ├── .env.example                   # Environment templates
    ├── .env                           # Local environment config
    ├── .gitignore
    ├── firebase.json                  # Firebase CLI configuration
    ├── firestore.indexes.json         # Composite Firestore indexes
    ├── firestore.rules                # Cloud Firestore security rules
    ├── package.json
    ├── serviceAccountKey.json.example # Template service account key
    ├── tsconfig.json
    └── README.md
```

---

## 🔑 Firebase & Cloud Firestore Setup

The backend connects directly to your Firebase project: `techgarments-cdd93`.

### 1. Download Your Firebase Admin Service Account Key

1. Go to your Firebase Console: [Service Accounts Settings](https://console.firebase.google.com/project/techgarments-cdd93/settings/serviceaccounts/adminsdk)
2. Ensure **Node.js** is selected.
3. Click the blue button **"Generate new private key"**.
4. Save the downloaded file into the `backend/` directory and rename it to:
   ```
   serviceAccountKey.json
   ```
   *(Note: `serviceAccountKey.json` is already in `.gitignore` to prevent committing secrets).*

### 2. Verify Cloud Firestore is Enabled

1. Open [Firestore Database Console](https://console.firebase.google.com/project/techgarments-cdd93/firestore).
2. If prompted, click **"Create database"** with default location and start in production/test mode.

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Test Firebase & Firestore Connection

```bash
npm run test:firebase
```

### 3. Seed Sample Data (Optional)

```bash
npm run seed
```

### 4. Run Development Server

```bash
npm run dev
```

The server starts at `http://localhost:5000` with hot-reloading powered by `tsx`.

### 5. Build for Production

```bash
npm run build
npm start
```

---

## 📡 API Reference

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/health` | Server and Firestore health status | No |
| `POST` | `/auth/sync` | Sync Firebase Auth user to Firestore | No |
| `GET` | `/auth/me` | Get current user and role profile | Yes |
| `GET` | `/buyers` | List buyer profiles | No |
| `GET` | `/buyers/:id` | Get buyer details | No |
| `PUT` | `/buyers/me` | Update buyer company profile | Yes (Buyer) |
| `GET` | `/factories` | Search & filter factories by capability, country, process | No |
| `GET` | `/factories/:id` | Get factory capabilities & certifications | No |
| `PUT` | `/factories/me` | Update factory profile & manufacturing specs | Yes (Factory) |
| `GET` | `/orders/public` | Public RFQ marketplace board | No |
| `GET` | `/orders/my` | Get orders for logged in buyer or factory | Yes |
| `POST` | `/orders` | Submit new garment RFQ / manufacturing order | Yes (Buyer) |
| `GET` | `/orders/:id` | Get specific order details & specs | Yes |
| `PATCH` | `/orders/:id/status` | Update order status (in production, shipped, etc.) | Yes |
| `GET` | `/products` | List garment product catalog | No |
| `POST` | `/products` | Add garment product to factory catalog | Yes (Factory) |
