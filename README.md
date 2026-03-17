# ProPath - Modern Learning Management System (LMS)

ProPath is a full-stack, feature-rich Learning Management System designed for students, instructors, and administrators. It features a modern, responsive UI, dark mode support, and a powerful curriculum editor.

## 🚀 Features

- **Responsive Design**: Fully optimized for Mobile, Tablet, and Desktop.
- **Role-Based Access**:
    - **Students**: Browse courses, enroll, track progress, and use the AI Chatbot.
    - **Instructors**: Create and manage courses with a bulk YouTube playlist importer.
    - **Admins**: Full control over platform users and content.
- **Course Features**:
    - Rich curriculum with sections and lessons.
    - YouTube video integration with automatic thumbnail extraction.
    - Interactive reviews and ratings.
- **AI Integration**: AI-powered Chatbot for students within the learning interface.
- **Authentication**: Secure JWT-based authentication.
- **Dark Mode**: Sleek dark mode support across the entire platform.

## 🛠️ Tech Stack

- **Frontend**: React, Lucide React, Axios, CSS Modules (Global).
- **Backend**: Node.js, Express, MySQL (Aiven Cloud).
- **AI**: Hugging Face Inference API.

## 📦 Project Structure

```text
├── backend
│   ├── config         # Database and app configuration
│   ├── middleware     # Auth and validation middlewares
│   ├── routes         # API endpoints
│   ├── server.js      # Entry point
│   └── schema.sql     # Database schema
└── frontend
    ├── src
    │   ├── components # Reusable UI components
    │   ├── context    # Auth and state management
    │   ├── pages      # Page-level components
    │   ├── utils.js   # Helper functions (e.g., YouTube thumbnail extraction)
    │   └── App.jsx    # Main application routing
    └── index.html
```

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v16+)
- MySQL Database

### Backend Setup
1. `cd backend`
2. `npm install`
3. Create a `.env` file based on the environment variables needed:
   - `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `HF_API_KEY`.
4. `node server.js`

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## 📄 License
This project is licensed under the ISC License.
