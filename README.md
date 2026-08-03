# AetherNet — Community Emergency Response Platform
<p align="center">
  <img width="250" src="https://drive.google.com/uc?id=1JGMC6qH5w2Hp6yAe0E41GWxj6QBVC8lu" alt="Centered Image" />
</p>
A real-time, community-driven emergency coordination platform that connects people in crisis with nearby helpers using AI guidance, live maps, and secure chat — available on Web and Android.

<div align="center">

![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Android-0f172a?style=for-the-badge)
![Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20Express%20%7C%20React%20Native-6366f1?style=for-the-badge)
![AI](https://img.shields.io/badge/AI-Gemini%20%7C%20-10b981?style=for-the-badge)
![Realtime](https://img.shields.io/badge/Realtime-Socket.IO-f59e0b?style=for-the-badge)
![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ecf8e?style=for-the-badge)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
  - [Online Mode Features](#online-mode-features-internet-required)
  - [Offline Mode Features](#offline-mode-features-zero-internet-required)
  - [Hybrid Mode Features](#hybrid-mode-features)
  - [Mode Switching Guide](#mode-switching-guide)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Socket Events](#socket-events)
- [Database Schema](#database-schema-supabase)

---

## Overview

**AetherNet** is a full-stack emergency response ecosystem spanning web and mobile. A user in distress can raise an SOS in seconds — registered or completely anonymously — and the platform instantly notifies nearby community members who can physically respond. It works across a **Next.js web dashboard** and a **React Native Android app**, both connected to the same real-time backend.

### What makes AetherNet different?

| Capability | AetherNet | Typical Emergency Apps |
|---|---|---|
| Anonymous SOS (no signup) | ✓ | ✗ |
| AI first-response guidance | ✓ Gemini | ✗ |
| Skill-based responder routing | ✓ | ✗ |
| Live mutual GPS tracking | ✓ Seeker + Responder | ✗ |
| Guardian pre-alerts | ✓ | ✗ |
| Cross-platform (Web + Android) | ✓ | Rare |
| False-alert abuse prevention | ✓ Auto-suspension | ✗ |
| 24h post-crisis welfare check | ✓ | ✗ |
| **Offline mesh networking** | ✓ P2P via Bluetooth/WiFi Direct | ✗ |
| **Offline maps** | ✓ Pre-downloaded OSM tiles | ✗ |
| **Zero-infrastructure operation** | ✓ Works without servers/internet | ✗ |

### Core Platform Flow

#### [ONLINE] Online Mode Flow
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

#### [OFFLINE] Offline Mode Flow (Mesh Network)
```
[Preparation Phase - While Online]
    │
    ▼
App detects WiFi → Auto-downloads map tiles (50km + 5km radius)
    │
    └─→ Maps cached in AsyncStorage → [READY] Ready for offline use

────────────────────────────────────────────────────────────────

[Offline Operation - No Internet Required]
    │
    ▼
Device A: Mesh starts → Bluetooth + WiFi Direct advertising
    │
    ├─→ Discovery: Finds Device B, C, D within ~100m range
    │
    └─→ Connection: Auto-connects using P2P_CLUSTER strategy
              │
              ▼
         Mesh Network Formed
         (A ←→ B ←→ C ←→ D)
              │
              ▼
    User in Crisis (Device A)
              │
              ▼
    Raise SOS Offline
              │
              ├─→ SOS Packet created with:
              │     • Unique packetId
              │     • GPS coordinates
              │     • Emergency type
              │     • Device UUID (origin)
              │     • hopCount: 1
              │
              └─→ Saved to local AsyncStorage
                        │
                        ▼
              Epidemic Routing Activated
                        │
              ┌─────────┴──────────┐
              ▼                    ▼
         Device B             Device C
         receives packet      receives packet
              │                    │
              ├─→ Duplicate check (packetId)
              ├─→ Save to local storage
              ├─→ Display in SOS feed
              └─→ Relay to connected peers
                  (hopCount: 2)
                        │
                        ▼
                   Device D, E, F...
                   (up to 200 hops)
                        │
                        ▼
         ┌──────────────┴───────────────┐
         ▼                              ▼
    Responder sees SOS           Another device relays
    on offline map               to even more peers
         │
         ▼
    Tap SOS → Opens Navigation
         │
         ├─→ Offline map displays route
         ├─→ Compass arrow points to target
         ├─→ Distance updates in real-time
         └─→ Vibration alert at <50m
                   │
                   ▼
         Responder arrives at location
                   │
                   ▼
         [Physical Assistance Provided]
                   │
                   ▼
    Seeker cancels SOS (Delete button)
                   │
                   ▼
         Tombstone Packet Generated
         { __delete__: true, packetId, hopCount: 1 }
                   │
                   ▼
         Epidemic Delete Propagation
                   │
         ┌─────────┴──────────┐
         ▼                    ▼
    Device B             Device C
    receives tombstone   receives tombstone
         │                    │
         ├─→ Add packetId to blocklist
         ├─→ Delete from local storage
         ├─→ Remove from SOS feed
         └─→ Forward tombstone to peers
             (prevents zombie packets)
                   │
                   ▼
         All devices purge the SOS
         within seconds via mesh
```

**Key Differences:**
- ✗ No central server, no database, no authentication
- ✓ 100% peer-to-peer using Bluetooth/WiFi Direct  
- ✓ GPS works offline (satellites don't need internet)
- ✓ Offline maps must be pre-downloaded on WiFi
- ✓ Embedded AI protocols (no API calls)
- ✓ Packets spread virally across mesh (epidemic routing)
- ✓ Range: ~100m per hop, unlimited hops (max 200)
- ✓ Works in disasters, remote areas, network blackouts

---

## Features

### [ONLINE] Online Mode Features (Internet Required)

AetherNet's **Online Mode** provides a full-featured, server-backed emergency response platform with real-time coordination, AI assistance, and persistent data management.

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

---

### [OFFLINE] Offline Mode Features (Zero Internet Required)

AetherNet's **Offline Mode** transforms the mobile app into a **fully decentralized mesh network** using Bluetooth and WiFi Direct, enabling emergency response even when internet infrastructure is unavailable (natural disasters, remote areas, network outages).

> **[KEY REQUIREMENT]**: While offline mode operates without internet, **maps must be downloaded beforehand while connected to WiFi**. The app auto-downloads tiles for your location when online, but you should verify maps are cached before traveling to areas with poor connectivity.

#### Peer-to-Peer Mesh Networking (MANET)
- **Google Nearby Connections API**: Uses Bluetooth + WiFi Direct for device discovery
- **P2P_CLUSTER Strategy**: Multi-peer mesh formation for network resilience
- **Automatic Peer Discovery**: Finds nearby devices within ~100m range automatically
- **Bidirectional Communication**: Full-duplex data exchange between mesh nodes
- **Connection Lifecycle Management**: Handles disconnections and reconnections gracefully
- **Tie-Breaker Logic**: Prevents connection collisions when two devices discover each other simultaneously

#### Epidemic Routing Protocol
- **Hop-Count Based Relay**: Packets travel up to 200 hops across the mesh network
- **Duplicate Detection**: Uses `packetId` to prevent packet loops and redundant processing
- **Automatic Rebroadcast**: Each device forwards received packets to all connected peers
- **Tombstone Propagation**: Distributed delete operations — when a user cancels an SOS, a "tombstone" message spreads across the mesh to remove it from all devices
- **Persistent Blocklist**: Prevents deleted packets from being reinserted by late-joining peers

#### Local Storage & Packet Management
- **AsyncStorage Persistence**: All SOS packets stored locally on each device
- **Device UUID Tracking**: Unique identifier for origin tracking without accounts
- **Origin-Based Deletion**: Users can only delete their own SOS packets
- **Deleted Packet Blocklist**: Maintains a blacklist of cancelled SOS IDs to reject zombie packets

#### Offline Maps
> **[!] IMPORTANT**: Maps **must be downloaded while online** before offline mode can display them. The app auto-downloads tiles when connected to WiFi, but offline navigation will not work without pre-cached map data.

- **OpenStreetMap Pre-Download**: Auto-downloads map tiles covering 50km radius (zoom 10-15) and 5km radius (zoom 16-17)
- **WiFi-Only Download**: Preserves mobile data by downloading only on WiFi connections
- **Base64 Tile Storage**: Stores tiles in AsyncStorage for instant retrieval
- **Cache Validation**: Re-downloads if user moves >10km or cache is >30 days old
- **Leaflet WebView Rendering**: Full-featured interactive maps with pinch-to-zoom, panning
- **User Location Marker**: Shows current GPS position with heading indicator
- **Download Progress Indicator**: Shows real-time download status (Downloading offline map... → Offline map ready)

#### Offline Navigation
> **[NOTE]**: Navigation requires pre-downloaded maps. Ensure maps are cached while online before entering offline mode.

- **Haversine Distance Calculation**: Computes real-time distance to SOS without internet
- **Cardinal Direction System**: N, NE, E, SE, S, SW, W, NW directional guidance
- **Compass-Based Arrow Navigation**: On-screen arrow rotates based on device compass and target bearing
- **Vibration Alerts**: Device vibrates when within 50m of destination
- **GPS Tracking**: Native Geolocation API works offline (GPS satellites don't require internet)
- **Real-Time Updates**: Distance and bearing update as user moves

#### Offline AI Emergency Protocols
- **50+ Embedded Protocols**: Pre-loaded emergency response instructions for cardiac arrest, choking, burns, fractures, drowning, allergic reactions, seizures, etc.
- **Keyword-Based Triage**: Automatically detects life-threatening conditions from SOS descriptions
- **Offline First-Aid Lookup**: Instant emergency guidance without internet
- **No API Dependencies**: All AI logic runs locally on device

#### Mesh Network Status Display
- **Packet Counter**: Shows total SOS packets in local mesh network
- **Peer Counter**: Displays number of directly connected devices
- **Distance-Sorted Feed**: Lists all SOS alerts nearest-first based on GPS distance
- **Device Name Display**: Shows unique device identifier for each mesh node

---

### [HYBRID] Hybrid Mode Features

AetherNet uniquely runs **both modes simultaneously** — the mesh network operates in the background even when the online WebView is displayed.

#### Mode Switching Guide

The app features a **floating toggle button** in the bottom-right corner that allows instant switching between Online and Offline modes:

**Button States:**
- **🌐 (Globe Icon)**: Shows when currently in **Offline Mode** → Tap to switch to **Online Mode**
- **📡 (Satellite Icon)**: Shows when currently in **Online Mode** → Tap to switch to **Offline Mode**

**How it Works:**
```
Current View          Button Shows     Tap Action
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Offline Mesh          🌐 Globe         → Switch to Online Dashboard
Online Dashboard      📡 Satellite     → Switch to Offline Mesh
```

**Important Notes:**
- The button indicates **where you'll go**, not where you are
- When viewing the **online dashboard** (WebView), the button shows 📡 to indicate you can switch back to offline
- When viewing the **offline mesh interface**, the button shows 🌐 to indicate you can switch to online
- Both systems run simultaneously — the mesh network continues operating in the background even when viewing the online dashboard
- No app restart required — switching is instant

#### Automatic Mode Switching
- **Network State Detection**: `NetInfo` monitors connection type (WiFi, cellular, none)
- **WiFi-Triggered Map Download**: Auto-downloads offline maps when on WiFi with invalid cache
- **User Toggle Button**: Floating button switches between Offline (mesh) and Online (WebView) interfaces
- **Background Mesh Operation**: Mesh network continues discovering peers and relaying packets even when WebView is active

#### Advanced Features

#### Adaptive Tile Download
- **Connection-Aware**: Only downloads maps on WiFi to preserve mobile data
- **Progress Indicator**: Shows download percentage and status
- **Automatic Retry**: Re-attempts download if interrupted
- **Cache Expiry**: 30-day validity ensures maps stay current

---

### Additional Platform Features

#### SOS Types & Dynamic Modals
- **6 Emergency Categories**: Medical, Car Problem, Fire, Gas Leak, Threat, General Help
- **Context-Specific Forms**: Blood group auto-fill for Medical, car details for Car Problem, etc.
- **False Alert Prevention**: Responders can flag fake SOS; 3+ flags = automatic suspension

#### Cross-Platform Support
- **React Native Android**: Native app sharing the same backend and socket infrastructure
- **Shared Authentication**: One account works on both web dashboard and mobile app
- **Push Notifications**: Responder alerts delivered natively on Android even when app is backgrounded
- **One-Tap SOS**: Streamlined mobile UI for raising an SOS in seconds

---

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

### Mobile — `AetherNetMobile/`
| Technology | Version | Purpose |
|---|---|---|
| **React Native** | Latest LTS | Cross-platform native Android app |
| **Leaflet (WebView)** | 1.9.4 | Offline maps rendering in WebView |
| **Socket.IO Client** | 4.x | Shared real-time event layer with backend |
| **React Navigation** | 6.x | In-app screen navigation |
| **Google Nearby Connections** | Latest | Bluetooth + WiFi Direct mesh networking |
| **AsyncStorage** | Latest | Local packet and tile storage |

---

## Project Structure

```
Aether-Net/
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
│   │   ├── admin.js            # /api/admin/* routes
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
├── frontend/                   # Next.js web dashboard
│   ├── app/
│   │   ├── dashboard/page.tsx  # Main dashboard + socket orchestration
│   │   ├── anonymous/page.tsx  # Anonymous SOS page w/ full socket flow
│   │   ├── auth/               # Login + signup pages
│   │   └── api/gemini/         # Edge API route for Gemini AI
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── sos-button.tsx              # Floating SOS trigger + modal flow
│   │   │   ├── mutual-response-view.tsx    # Live map + chat for accepted SOS
│   │   │   ├── responder-live-view.tsx     # Legacy seeker waiting view
│   │   │   ├── mutual-map.tsx              # Leaflet map component
│   │   │   ├── sos-feed-card.tsx           # Active SOS feed in dashboard
│   │   │   ├── sos-stats-card.tsx          # Live "Today's Activity" stats
│   │   │   ├── responder-history-card.tsx  # User's response log
│   │   │   ├── settings-card.tsx           # Profile settings
│   │   │   ├── live-map-card.tsx           # Full live map for dashboard
│   │   │   ├── ai-assistant-card.tsx       # In-dashboard AI chat widget
│   │   │   └── admin-dashboard.tsx         # Admin analytics + user management
│   │   └── navbar.tsx                      # Navigation with Anonymous SOS link
│   ├── context/
│   │   └── AuthContext.tsx     # Auth state, login/logout, socket connect
│   └── lib/
│       ├── api.js              # Axios instance with interceptors + token storage
│       └── socket.js           # Socket.IO singleton factory
│
└── AetherNetMobile/            # React Native Android application
    ├── android/
    │   └── app/src/main/
    │       └── AndroidManifest.xml   
    ├── src/
    │   ├── screens/            # App screens (Home, SOS, Map, Chat, Profile)
    │   ├── components/         # Shared React Native UI components
    │   ├── navigation/         # React Navigation stack/tab config
    │   ├── services/           # API + Socket.IO client wrappers
    │   └── context/            # Auth context (shared logic with web)
    └── package.json
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

### Mobile (Android) — `AetherNetMobile/`

The mobile app uses **Leaflet maps** rendered in a WebView for both online and offline modes. For offline operation, map tiles are pre-downloaded and served locally.

## Getting Started

### Prerequisites

- Node.js (LTS)
- pnpm (frontend) or npm (backend and mobile)
- **Java Development Kit (JDK) 17** — required for the Android mobile build
- **Android Studio & Android SDK** — required for the mobile emulator or physical device build
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

### 3. Start the Mobile Application (Android)

The mobile app uses Leaflet for mapping (no Google Maps API key needed).

```bash
cd AetherNetMobile
npm install

# Start the Metro bundler
npx react-native start

# In a new terminal, build and run on Android
npx react-native run-android
```

> **Tip:** Make sure an Android emulator is running in Android Studio, or a physical Android device is connected with USB debugging enabled before running `run-android`.

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
