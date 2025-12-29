# Tutoring Application Backend

This repository contains the backend source code for the Tutoring Application, built using **Node.js**, **TypeScript**, and **Firebase Cloud Functions**. It follows a **Clean Architecture** pattern to ensure scalability, maintainability, and separation of concerns.

The system manages tutoring sessions, automates wallet payments based on strict business rules (e.g., duration checks), and ensures data integrity using ACID transactions via Cloud Firestore.

## 🚀 Features

- **Session Management**: Start and end tutoring sessions securely.
- **Automated Payments**:
  - Tutors are paid **IDR 50,000** only if the session lasts **≥ 45 minutes**.
  - No payment for sessions under 45 minutes.
  - Zero payment for absenteeism.
- **Wallet System**: Real-time balance updates for tutors.
- **Role-Based Access Control (RBAC)**: Secure endpoints restricted to Tutors using Firebase Authentication.
- **Data Integrity**: Atomic updates for session status and wallet balances using Firestore Transactions.
- **Validation**: Strict input validation using Joi.

## 🛠 Technology Stack

- **Runtime**: Node.js 18 (Firebase Functions)
- **Language**: TypeScript (Strict Mode)
- **Framework**: Express.js
- **Database**: Cloud Firestore (NoSQL)
- **Authentication**: Firebase Authentication
- **Validation**: Joi
- **Testing**: Jest, ts-jest
- **Linting**: ESLint (Google Style Guide)

## 📋 Prerequisites

Before you begin, ensure you have met the following requirements:

- **Node.js**: Version 18 or higher.
- **npm**: Package manager installed.
- **Firebase CLI**: Installed globally (`npm install -g firebase-tools`).
- **Java**: Required for running Firebase Emulators locally.

## ⚙️ Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd functions
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

## 💻 Development Workflow

### 1. Build the Project
Compile TypeScript to JavaScript:
```bash
npm run build
```
For continuous compilation during development:
```bash
npm run build:watch
```

### 2. Run Locally (Emulators)
Start the Firebase Local Emulator Suite to test functions and Firestore database locally:
```bash
npm run serve
```
The API will be available at `http://127.0.0.1:5001/<project-id>/us-central1/api`.

### 3. Testing
Run unit tests using Jest:
```bash
npm test
```

### 4. Linting
Check code style and potential errors using ESLint (Google Style):
```bash
npm run lint
```
To fix auto-fixable linting errors:
```bash
npm run lint -- --fix
```

## 📂 Project Structure

The project follows a **Clean Architecture** to separate concerns:

```plaintext
functions/src/
├── config/         # Firebase Admin initialization & configurations
├── controllers/    # Handles HTTP requests, input parsing, and responses
├── middlewares/    # Authentication, error handling, and logging
├── models/         # TypeScript interfaces and types
├── routes/         # Express router definitions
├── services/       # Core business logic and database transactions
└── index.ts        # Entry point for Cloud Functions
```

## 📖 API Documentation

All API endpoints are prefixed with `/api/v1`.

### Headers
All protected routes require a valid Firebase ID Token belonging to a user with the `tutor` role.
```http
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

### 1. Start Session
Starts a new tutoring session.

- **Endpoint**: `POST /sessions/start`
- **Body**:
  ```json
  {
    "studentIds": ["student_uid_1", "student_uid_2"]
  }
  ```
- **Constraints**: Max 6 students per session.

### 2. End Session
Ends an active session and processes payment if applicable.

- **Endpoint**: `POST /sessions/end`
- **Body**:
  ```json
  {
    "sessionId": "session_document_id"
  }
  ```
- **Logic**: Checks if duration ≥ 45 mins. If yes, credits IDR 50,000 to the tutor's wallet.

## 💾 Database Schema (Firestore)

### `users`
| Field | Type | Description |
| :--- | :--- | :--- |
| `uid` | String (PK) | User ID |
| `role` | String | 'tutor' or 'student' |
| `name` | String | Display name |

### `sessions`
| Field | Type | Description |
| :--- | :--- | :--- |
| `sessionId` | String (PK) | Auto-generated ID |
| `tutorId` | String | ID of the tutor |
| `studentIds` | Array<String> | List of student IDs |
| `startTime` | Timestamp | Server timestamp |
| `endTime` | Timestamp | Server timestamp (on completion) |
| `status` | String | 'active' or 'completed' |
| `isPaid` | Boolean | Whether payment was issued |
| `durationMinutes` | Number | Calculated duration |

### `wallets`
| Field | Type | Description |
| :--- | :--- | :--- |
| `tutorId` | String (PK) | Matches user UID |
| `balance` | Number | Current wallet balance |
| `lastUpdated` | Timestamp | Last transaction time |

### `transactions`
| Field | Type | Description |
| :--- | :--- | :--- |
| `transactionId` | String (PK) | Auto-generated ID |
| `walletId` | String | Reference to wallet |
| `sessionId` | String | Reference to session |
| `amount` | Number | Amount credited |
| `type` | String | 'credit' |
| `createdAt` | Timestamp | Transaction time |

## 🚀 Deployment

To deploy the functions to Firebase:

```bash
npm run deploy
```

This command deploys only the functions. If you need to deploy Firestore rules or indexes, remove the `--only functions` flag or specify them.

## ⚖️ Business Rules & Integrity

1.  **Session Capacity**: A tutor can teach up to **6 students**.
2.  **Payment Condition**: Payment is triggered **only** if `(endTime - startTime) >= 45 minutes`.
3.  **Idempotency**: The system prevents double-payment by checking `isPaid` flag and session status within a transaction.
4.  **Concurrency**: Firestore transactions are used to ensure that simultaneous requests do not corrupt wallet balances or session states.

---
**Note**: This project adheres strictly to the Google JavaScript Style Guide.
