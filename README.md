# RegenMapper 🌱

**Track, document, and visualize reforestation efforts across communities in real-time.**

RegenMapper is a full-stack web application designed to empower environmental organizations, community groups, and volunteers to monitor their tree-planting impact. With intuitive mapping, activity logging, and impact dashboards, RegenMapper transforms dispersed reforestation efforts into a coordinated, data-driven movement.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-regen--mapper--2fbn.vercel.app-brightgreen)](https://regen-mapper-2fbn.vercel.app/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue)](LICENSE)

---

## 🎯 What Problems Does It Solve?

- **Fragmented Tracking**: Communities often lack centralized ways to document planting activities
- **Lost Impact Data**: Tree planting efforts across multiple sites become difficult to aggregate and measure
- **Limited Visibility**: Stakeholders can't easily see restoration progress geographically
- **Accountability Gap**: Hard to maintain records for donors, governments, or environmental audits

---

## ✨ Key Features

### 🗺️ Interactive Map View
- Visualize restoration zones and planting sites on an interactive map
- Built with React-Leaflet for smooth, responsive interactions
- Currently centered on **Thika reforestation hub** (Kenya)
- Pan, zoom, and explore reforestation activity by location

### 📝 Planting Log System
- Record tree planting activities with rich details:
  - Tree species planted
  - Quantity of trees
  - Specific location coordinates
  - Date of activity
  - Optional notes and observations
- Secure data storage with user authentication
- Filter and search logs for historical tracking

### 📊 Impact Dashboard
- Real-time statistics dashboard showing:
  - Total trees planted
  - Number of restoration zones mapped
  - Active contributors count
- Visualize environmental impact across the platform
- Track progress toward restoration goals

### 📬 Contact & Community
- Direct communication channel for questions and feedback
- User-friendly contact form for stakeholders
- Secure message storage for engagement tracking

### 👥 User Authentication & Join Campaign
- Secure signup and login system
- User roles and permissions
- Campaign registration for volunteers
- Profile management

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite |
| **UI Components** | Radix UI, Tailwind CSS, Lucide Icons |
| **Mapping** | Leaflet, React-Leaflet |
| **Backend** | Express.js, TypeScript |
| **Database** | MongoDB via Mongoose |
| **Authentication** | JWT, bcryptjs |
| **Deployment** | Vercel (frontend), Node.js (backend) |

---

## 📁 Project Structure

```
RegenMapper/
├── app/                    # React frontend (Vite SPA)
│   ├── src/
│   │   ├── components/     # Page and feature components
│   │   ├── services/       # API client & utilities
│   │   ├── context/        # Auth state management
│   │   └── assets/         # Images and static files
│   └── package.json
│
├── server/                 # Express.js backend
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth, CORS, error handling
│   │   └── config/         # Database connection
│   └── package.json
│
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- MongoDB connection string (Atlas or local)

### Frontend Setup

```bash
cd app
npm install
cp .env.example .env
```

**Environment variables** (`.env`):
```
VITE_API_URL=http://localhost:5000
```

**Start development server:**
```bash
npm run dev          # Runs on http://localhost:5173
```

**Build for production:**
```bash
npm run build
npm run preview
```

### Backend Setup

```bash
cd server
npm install
cp .env.example .env
```

**Environment variables** (`.env`):
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/regen_mapper
JWT_SECRET=your_jwt_secret_key
CLIENT_ORIGIN=http://localhost:5173
PORT=5000
```

**Start development server:**
```bash
npm run dev          # Runs on http://localhost:5000
```

**Build and run:**
```bash
npm run build
npm start
```

---

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | Register new user |
| `/api/auth/login` | POST | User login with JWT |
| `/api/planting-logs` | GET, POST | View and create planting records |
| `/api/impact` | GET | Fetch aggregated impact statistics |
| `/api/contact` | POST | Submit contact form messages |
| `/api/health` | GET | Server health check |

---

## 📊 Database Schema

### User Model
- `id`, `email`, `password` (hashed), `created_at`

### PlantingLog Model
- `id`, `species`, `quantity`, `location`, `date`, `notes`, `userId`, `created_at`

### Contact Model
- `id`, `name`, `email`, `message`, `created_at`

---

## 🎨 Features in Development

- 📈 Advanced impact analytics and trend analysis
- 🌍 Multi-region expansion (beyond Thika hub)
- 🏆 Gamification (leaderboards, badges for contributors)
- 📱 Mobile app for field logging
- 🔄 Integration with satellite imagery for verification
- 📧 Automated impact reports for stakeholders

---

## 🤝 Contributing

We welcome contributions! Whether it's bug fixes, features, or documentation improvements:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/YourFeature`
3. **Commit** your changes: `git commit -m 'Add YourFeature'`
4. **Push** to your fork: `git push origin feature/YourFeature`
5. **Open** a Pull Request with a clear description

### Development Guidelines
- Use TypeScript for type safety
- Follow existing code structure
- Run tests before submitting PRs
- Update documentation as needed

---

## 📋 Project Status

- ✅ Core mapping and logging functionality
- ✅ User authentication system
- ✅ Impact dashboard (basic stats)
- 🚧 Advanced analytics (in progress)
- 🚧 Multi-region support (planned)

---

## 📝 License

This project is licensed under the **Apache License 2.0** — see the [LICENSE](LICENSE) file for details.

---

## 💬 Support & Contact

**Project Creator**: [Raphael Kamau](https://github.com/kamunyuraphael)

**Get Involved**:
- 🐛 Found a bug? Open an [issue](https://github.com/kamunyuraphael/RegenMapper/issues)
- 💡 Have a feature idea? Start a [discussion](https://github.com/kamunyuraphael/RegenMapper/discussions)
- 📧 Use the in-app contact form for general inquiries

---

## 🌱 Why RegenMapper?

Reforestation is a global imperative. Yet tracking progress across communities remains fragmented and opaque. RegenMapper bridges this gap by providing the tools organizations need to:

- **Measure impact** with precision
- **Share progress** with stakeholders transparently
- **Coordinate efforts** across regions
- **Inspire action** through visible, data-driven results

Every tree planted. Every zone mapped. Every community connected. That's RegenMapper.

---

*Planted with 🌍 for a greener future.*
