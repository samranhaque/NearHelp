# NearHelp — Community Emergency Response Platform
<p align="center">
  <img width="250" src="https://drive.google.com/uc?id=1JGMC6qH5w2Hp6yAe0E41GWxj6QBVC8lu" alt="Centered Image" />
</p>
A real-time, community-driven emergency response website that connects people in crisis with nearby helpers using AI guidance, live maps, and secure chat.

<div align="center">

![Platform](https://img.shields.io/badge/Platform-Web-0f172a?style=for-the-badge)
![Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20Express-6366f1?style=for-the-badge)
![AI](https://img.shields.io/badge/AI-Gemini%20%7C%20-10b981?style=for-the-badge)
![Realtime](https://img.shields.io/badge/Realtime-Socket.IO-f59e0b?style=for-the-badge)
![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ecf8e?style=for-the-badge)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Socket Events](#socket-events)
- [Database Schema](#database-schema-supabase)

---

## Overview

**NearHelp** is a web-based emergency response platform. A user in distress can raise an SOS in seconds — with an account or anonymously — and the website notifies nearby community members who can respond. The Next.js website connects to an Express backend for SOS coordination, live updates, and stored user data.

### What makes NearHelp different?

| Capability | NearHelp | Typical Emergency Platforms |
|---|---|---|
| Anonymous SOS (no signup) | ✓ | ✗ |
| AI first-response guidance | ✓ Gemini | ✗ |
| Skill-based responder routing | ✓ | ✗ |
| Live mutual GPS tracking | ✓ Seeker + Responder | ✗ |
| Guardian pre-alerts | ✓ | ✗ |
| False-alert abuse prevention | ✓ Auto-suspension | ✗ |
| 24h post-crisis welfare check | ✓ | ✗ |

### Core Platform Flow

#### SOS Flow
```
User in Crisis
    │
    ▼
Raise SOS (typed + contextual details)
    │
    ├─→ Guardian contacts alerted immediately
    │
    ├─→ AI generates first-response checklist (Gemini)
    │
    └─→ Nearby community notified (5km radius, skill-matched first)
              │
              ▼
         Responder Accepts
              │
              ├─→ Live mutual map opens (Seeker ↔ Responder GPS)
              ├─→ Encrypted chat room opens instantly
              └─→ ETA calculated in real-time (Haversine)
                        │
                        ▼
                  SOS Resolved → Rating → Welfare Check (24h)
```

## Features

### Emergency Response Features

The website provides server-backed emergency coordination, AI assistance, and persistent data management.

#### Real-time SOS Broadcasting
- **5km Geographic Targeting**: Uses Haversine distance calculation to notify nearby community members
- **Skill-Based Priority Routing**: Medical emergencies ping users with medical skills first
- **Guardian Instant Alerts**: Pre-assigned contacts receive immediate notifications
- **Anonymous SOS**: No account needed — raise an SOS with a temporary session
- **Accept/Decline System**: Responders see Accept/Decline buttons before committing
- **Response Time Tracking**: Calculates and displays real-time ETA to seeker

#### Live GPS Tracking & Mutual Maps
- **Bidirectional Location Sharing**: Both seeker and responder see each other's positions in real-time
- **Socket.IO-Based Updates**: Sub-second location refresh for accurate tracking
- **Live Distance Calculation**: Haversine formula provides real-time distance between parties
- **Mutual Tracking Session**: Opens automatically when responder accepts the SOS

#### Encrypted Real-time Chat
- **Instant Messaging**: Socket.IO-powered chat room opens between seeker and responder
- **Typing Indicators**: Shows live "X is typing..." status
- **Message Persistence**: Chat logs stored in database for accountability
- **Chat History**: Access past conversations for resolved incidents

#### AI-Powered Emergency Assistance
- **Gemini AI First-Response Guidance**: Generates numbered action checklists based on SOS type
- **Emergency Call Script Generator**: Auto-creates formal scripts for calling emergency services (112, 100)
- **In-Dashboard AI Assistant**: General-purpose AI chatbot for emergency questions

#### Database-Backed User Management
- **Profile System**: Skills registry, health profile (blood group, conditions), location history
- **Trust Scoring**: Responders earn points for helping; seekers lose points for false alerts
- **Response History**: Complete audit trail of all past SOS interactions
- **Guardian Management**: Add/remove trusted contacts for instant SOS alerts
- **Auto-Suspension**: Users with 3+ false alert flags are automatically suspended

#### Admin & Analytics Dashboard
- **Live Platform Statistics**: Total SOS, resolved today, average response time
- **Active SOS Monitoring**: God-eye view of all ongoing emergencies with map visualization
- **Online User Tracking**: See which community members are currently available
- **User Suspension Management**: Manual suspension powers for admins
- **Welfare Check System**: Automated 24-hour post-crisis follow-up messages

#### Notifications & Alerts
- **Priority Alerts**: Skill-matched SOS notifications pushed with high priority
- **Persistent Notifications**: All alerts stored in database, accessible in notification drawer
- **Guardian Pathway**: Separate alert channel for assigned guardian contacts
- **Mark-All-As-Read**: Batch notification management


### Additional Platform Features

#### SOS Types & Dynamic Modals
- **6 Emergency Categories**: Medical, Car Problem, Fire, Gas Leak, Threat, General Help
- **Context-Specific Forms**: Blood group auto-fill for Medical, car details for Car Problem, etc.
- **False Alert Prevention**: Responders can flag fake SOS; 3+ flags = automatic suspension


## Tech Stack

### Frontend — `frontend/`
| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 16.1.6 | React framework (App Router, API routes, SSR) |
| **React** | 19.2.4 | UI component framework |
| **TypeScript** | 5.7.3 | Static typing |
| **Tailwind CSS** | 4.x | Utility-first styling |
| **Framer Motion** | 11.x | Animations and page transitions |
| **Leaflet + React-Leaflet** | 1.9.4 / 5.x | Interactive GPS maps |
| **Socket.IO Client** | 4.8.3 | Real-time WebSocket communication |
| **Axios** | 1.x | HTTP API client |
| **Lucide React** | 0.564.0 | Icon library |
| **Recharts** | 2.x | Analytics bar/line charts |
| **Radix UI** | Various | Accessible UI primitives |
| **@google/generative-ai** | 0.24.x | Gemini AI integration |

### Backend — `backend/`
| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | LTS | Runtime |
| **Express.js** | 5.x | HTTP server and routing |
| **Socket.IO** | 4.8.3 | Real-time bidirectional events |
| **Supabase** | 2.x | PostgreSQL database + Auth |
| **JSON Web Tokens** | 9.x | Access token auth (httpOnly refresh cookies) |
| **bcryptjs** | 3.x | Password hashing |
| **Google Gemini API** | REST | AI first-response guidance + chat |
| **cookie-parser** | 1.4.x | Cookie handling for refresh tokens |
| **dotenv** | 17.x | Environment variable management |


---

## Project Structure

```
NearHelp/
├── backend/                    # Express.js API server
│   ├── server.js               # Entry point, Socket.IO init
│   ├── config/
│   │   └── supabase.js         # Supabase client config
│   ├── controllers/
│   │   ├── sosController.js    # SOS CRUD, presence, resolve, global stats
│   │   ├── authController.js   # Register, login, refresh, me
│   │   ├── userController.js   # Profile, location, guardians
│   │   ├── adminController.js  # Admin analytics + user management
│   │   └── welfareController.js# Post-crisis welfare checks
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT protect middleware (+ anonymous bypass)
│   │   └── auth.js             # Role guards
│   ├── routes/
│   │   ├── sos.js              # /api/sos/* routes
│   │   ├── auth.js             # /api/auth/* routes
│   │   ├── users.js            # /api/users/* routes
│   │   ├── admin.js           # /api/admin/* routes
│   │   └── map.js              # /api/map/* routes
│   ├── sockets/
│   │   ├── index.js            # Socket.IO connection + JWT/anonymous auth
│   │   ├── sosHandler.js       # SOS join/leave room events
│   │   ├── chatHandler.js      # chat:message + chat:typing events
│   │   └── locationHandler.js  # Responder GPS update events
│   ├── services/
│   │   ├── aiService.js        # Gemini API wrapper for guidance generation
│   │   └── keywordEngine.js    # Rule-based chat-assist fallback
│   ├── utils/
│   │   └── routingEngine.js    # 5km radius + skill-based user targeting
│   └── jobs/
│       └── welfareCheck.js     # Scheduled 24h post-crisis check job
│
└── frontend/                   # Next.js web dashboard
    ├── app/
    │   ├── dashboard/page.tsx  # Main dashboard + socket orchestration
    │   ├── anonymous/page.tsx  # Anonymous SOS page w/ full socket flow
    │   ├── auth/               # Login + signup pages
    │   └── api/gemini/         # Edge API route for Gemini AI
    ├── components/
    │   ├── dashboard/          # SOS, maps, chat, history, and admin views
    │   └── navbar.tsx           # Navigation with Anonymous SOS link
    ├── context/
    │   └── AuthContext.tsx     # Auth state, login/logout, socket connect
    └── lib/
        ├── api.js              # Axios instance with interceptors + token storage
        └── socket.js           # Socket.IO singleton factory
```

---

## Environment Variables

### Backend — `backend/.env`
```env
PORT=5002
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
ACCESS_TOKEN_SECRET=your-jwt-access-secret
REFRESH_TOKEN_SECRET=your-jwt-refresh-secret
GEMINI_API_KEY=your-google-gemini-api-key

```

### Frontend — `frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:5002/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5002
GEMINI_API_KEY=your-google-gemini-api-key
```


## Getting Started

### Prerequisites

- Node.js (LTS)
- pnpm (frontend) or npm (backend)
- A Supabase project with the required tables

---

### Admin Dashboard Access

The admin dashboard provides comprehensive platform management and analytics capabilities.

**Admin Credentials:**
- **Email/ID:** `municipal@community.gov.in`
- **Password:** `municipal@community.gov.in`

> **Security Note:** These are default credentials for demonstration purposes. In production, ensure you change these credentials immediately and implement proper secure password policies.

---

### 1. Start the Backend

```bash
cd backend
npm install
npm start
```

The API server runs on `http://localhost:5002`.

---

### 2. Start the Frontend (Web Dashboard)

```bash
cd frontend
npm install
npm run dev
```

The web dashboard runs on `http://localhost:3000`.

---



## API Endpoints

### Authentication — `/api/auth`
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/register` | Public | Register new user |
| POST | `/login` | Public | Login, returns JWT + sets cookie |
| POST | `/refresh` | Cookie | Refresh access token |
| GET | `/me` | Protected | Get current user profile |
| POST | `/logout` | Protected | Logout and clear cookie |

### SOS — `/api/sos`
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/create` | Protected | Create a new SOS |
| POST | `/anonymous` | Public | Create anonymous SOS (no account) |
| GET | `/active` | Protected | Get nearby active SOS alerts |
| GET | `/me/active` | Protected | Get current user's active SOS |
| GET | `/stats` | Protected | Personal SOS stats |
| GET | `/global-stats` | Protected | Platform-wide live stats |
| GET | `/history` | Protected | User's SOS activity history |
| POST | `/:id/presence` | Protected | Accept/Decline an incoming SOS |
| POST | `/:id/resolve` | Protected | Mark SOS as resolved |
| POST | `/:id/flag` | Protected | Flag SOS as false alert |
| GET | `/:id` | Protected | Get SOS details by ID |

### Users — `/api/users`
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/profile` | Protected | Get user profile |
| PUT | `/profile` | Protected | Update profile |
| PUT | `/location` | Protected | Update real-time location |
| GET | `/guardians` | Protected | List guardians |
| POST | `/guardians` | Protected | Add guardian |
| DELETE | `/guardians/:id` | Protected | Remove guardian |

### Admin — `/api/admin`
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/analytics` | Admin | Platform analytics |
| GET | `/users` | Admin | All users |
| PUT | `/users/:id/suspend` | Admin | Suspend a user |

---

## Socket Events

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `sos:join` | `{ sosId }` | Join the SOS chat/tracking room |
| `chat:message` | `{ sosId, message }` | Send a chat message |
| `chat:typing` | `{ sosId }` | Broadcast typing indicator |
| `location:update` | `{ sosId, lat, lng }` | Send real-time responder GPS |

### Server → Client
| Event | Payload | Description |
|---|---|---|
| `sos:new_alert` | `{ sos, isAnonymous }` | New SOS in 5km radius |
| `sos:priority_alert` | `{ sos, isPriority }` | Priority SOS matching user's skills |
| `sos:guardian_alert` | `{ sos }` | SOS from a user's guardian |
| `sos:created` | `{ sos, seeker }` | Seeker's own SOS was created |
| `response:mutual_open` | `{ sosId, seeker, responder, ... }` | Responder accepted — opens live view |
| `chat:message` | `{ senderId, senderName, message, timestamp }` | Incoming chat message |
| `chat:typing` | `{ senderName }` | Someone is typing |
| `sos:resolved` | `{ responseTimeSeconds }` | SOS was marked resolved |
| `location:responder_moved` | `{ sosId, lat, lng }` | Responder location update |
| `sos:stats_updated` | `{}` | Global stats changed (re-fetch trigger) |
| `account:suspended` | `{ reason }` | User's account was suspended |

---

## Database Schema (Supabase)

### Key Tables
- **`users`** — Profile, skills, location, trust score, is_suspended, guardians
- **`sos`** — Type, status, location, seeker_id, responders[], chat_log, is_anonymous, modal_data
- **`notifications`** — user_id, type, status (read/unread), data (JSON)
- **`ratings`** — sos_id, responder_id, stars, review

---

*Built for community safety.*
