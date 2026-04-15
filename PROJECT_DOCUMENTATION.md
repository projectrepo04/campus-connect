# Campus Connect - Project Documentation

## Executive Summary

Campus Connect is a full-stack college social networking platform designed to facilitate communication and engagement among students, faculty, alumni, and administrators. The platform provides role-based access control, real-time notifications, content sharing capabilities, and comprehensive administrative tools for campus community management.

---

## 1. Project Overview

### 1.1 Purpose and Objectives

Campus Connect serves as a centralized digital platform for academic institutions to:
- Foster community engagement among campus stakeholders
- Streamline notice and announcement dissemination
- Enable professional networking and profile showcasing
- Provide administrative oversight and user management
- Support academic collaboration through department-based content filtering

### 1.2 Target Users

| Role | Description | Primary Functions |
|------|-------------|-------------------|
| **Admin** | System administrators | User management, analytics, department CRUD |
| **Faculty** | Teaching staff | Post announcements, create notices, manage content |
| **Student** | Enrolled students | View feed, interact with posts, manage profile |
| **Alumni** | Graduated members | Network, share experiences, stay connected |
| **Guest** | External visitors | Limited read-only access to public content |

---

## 2. Technical Architecture

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   React 18   │  │   Vite     │  │   TypeScript       │   │
│  │   (UI)       │  │   (Build)  │  │   (Type Safety)    │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP/REST API
┌────────────────────▼────────────────────────────────────────────┐
│                         SERVER LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Express    │  │  Prisma ORM  │  │   JWT Auth         │   │
│  │   (API)      │  │  (Database)  │  │   (Security)       │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                        DATA LAYER                                │
│                    SQLite Database                               │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend Framework** | React | 18.2.0 | Component-based UI development |
| **Build Tool** | Vite | 5.0.12 | Fast development and optimized builds |
| **Language** | TypeScript | 5.3.3 | Type-safe development |
| **Backend Runtime** | Node.js | 18+ | Server-side JavaScript execution |
| **Web Framework** | Express | 4.18.2 | REST API development |
| **ORM** | Prisma | 5.10.0 | Database abstraction and querying |
| **Database** | SQLite | 3.x | Lightweight relational storage |
| **Authentication** | JWT + bcrypt | 9.0.2 / 5.1.1 | Secure authentication |
| **File Upload** | Multer | 2.1.1 | Media file handling |

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    User      │     │     Post     │     │   Comment    │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (PK)      │◄────┤ authorId(FK) │────►│ postId (FK)  │
│ uid (Unique) │────►│ id (PK)      │     │ authorId(FK) │
│ email        │     │ content      │     │ content      │
│ password     │     │ imageUrl     │     │ createdAt    │
│ fullName     │     │ likesCount   │     └──────────────┘
│ role         │     │ createdAt    │
│ department   │     └──────────────┘
│ isApproved   │            │
│ createdAt    │            │
└──────────────┘            │
       │                    │
       │            ┌───────▼────────┐
       │            │     Like       │
       │            ├────────────────┤
       │            │ id (PK)        │
       └───────────►│ userId (FK)    │
                    │ postId (FK)    │
                    └────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Department  │     │    Notice    │     │ Notification │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (PK)      │     │ id (PK)      │     │ id (PK)      │
│ name         │     │ title        │     │ userId (FK)  │
│ code (Unique)│     │ category     │     │ type         │
│ createdAt    │     │ createdBy(FK)│     │ title        │
└──────────────┘     │ expiryDate   │     │ message      │
                     │ createdAt    │     │ isRead       │
                     └──────────────┘     │ createdAt    │
                                           └──────────────┘

┌──────────────┐
│    Follow    │
├──────────────┤
│ id (PK)      │
│ followerId   │
│ followingId  │
│ createdAt    │
└──────────────┘
```

### 3.2 Data Models

#### User Model
- **Primary Identity**: UUID-based `uid` field for all relations
- **Authentication**: Email/password with bcrypt hashing
- **Role Management**: student, faculty, alumni, admin, guest
- **Status Tracking**: Approval status, verification, active/locked flags
- **Profile Data**: Skills, certifications, projects stored as JSON strings

#### Post Model
- **Content Types**: Text, images, videos, external links
- **Visibility Control**: Public vs campus-only access
- **Engagement Metrics**: Like, comment, share counts
- **Department Filtering**: Content targeted to specific departments

#### Notice Model
- **Categories**: Event, exam, placement, workshop, sports, general
- **Target Audience**: Configurable visibility (all, department, semester)
- **Expiry Management**: Automatic expiration date tracking

---

## 4. API Architecture

### 4.1 RESTful Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | Public | User registration with validation |
| `/api/auth/login` | POST | Public | Session-based authentication |
| `/api/auth/logout` | POST | Required | Session termination |
| `/api/auth/me` | GET | Required | Current user profile |
| `/api/posts` | GET/POST | Required | Feed management |
| `/api/posts/:id/like` | POST | Required | Toggle post like |
| `/api/posts/:id/comments` | POST | Required | Add comment |
| `/api/notices` | GET/POST | Required/Faculty | Notice management |
| `/api/profile/:id` | GET | Required | View user profile |
| `/api/profile` | PUT | Required | Update own profile |
| `/api/admin/users` | GET | Admin | User listing |
| `/api/admin/analytics` | GET | Admin | System statistics |

### 4.2 Authentication Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Client    │────►│   Server     │────►│   Database   │
└──────────────┘     └──────────────┘     └──────────────┘
      │                    │                    │
      │  1. POST /login   │                    │
      │──────────────────►│                    │
      │  {email, pass}    │                    │
      │                    │  2. Verify User    │
      │                    │───────────────────►│
      │                    │◄───────────────────│
      │                    │  3. Generate JWT   │
      │                    │                    │
      │  4. Set Cookie    │                    │
      │◄──────────────────│                    │
      │  (httpOnly)       │                    │
      │                    │                    │
      │  5. Authenticated │                    │
      │     Requests      │                    │
      │──────────────────►│                    │
      │  Cookie: token    │                    │
```

---

## 5. Frontend Architecture

### 5.1 Component Hierarchy

```
App.tsx (Router)
├── AuthProvider (Context)
├── BrowserRouter
│   └── Routes
│       ├── Public Routes
│       │   ├── /login → Login.tsx
│       │   └── /reset-password → ResetPassword.tsx
│       └── Layout Routes (Layout.tsx)
│           ├── Navbar.tsx
│           ├── Sidebar.tsx
│           └── ProtectedRoute
│               ├── /feed → Feed.tsx
│               ├── /profile/:id → Profile.tsx
│               ├── /profiles → Profiles.tsx
│               ├── /notices → Notices.tsx
│               ├── /notifications → Notifications.tsx
│               └── /admin → Admin.tsx (admin only)
```

### 5.2 State Management

- **Global State**: AuthContext for user session
- **Local State**: React useState for component-level data
- **API Integration**: Custom API client with axios-like fetch wrapper
- **Real-time Updates**: Server-Sent Events for notifications

---

## 6. Security Features

### 6.1 Authentication & Authorization

- **Password Security**: bcrypt hashing with salt rounds (10)
- **Session Management**: HTTP-only cookies with JWT tokens
- **Role-Based Access**: Middleware-enforced route protection
- **Input Validation**: Server-side validation on all inputs

### 6.2 Data Protection

- **SQL Injection Prevention**: Prisma ORM parameterized queries
- **XSS Protection**: Input sanitization and output encoding
- **CSRF Mitigation**: CORS configuration and same-site cookies
- **File Upload Security**: Type validation and size limits

---

## 7. Features and Functionality

### 7.1 Core Features

| Feature | Description | Access |
|---------|-------------|--------|
| **Social Feed** | Post creation, liking, commenting, sharing | All authenticated |
| **Notice Board** | Categorized announcements with expiry | Faculty/Admin create |
| **Profile System** | Professional profiles with skills/projects | All users |
| **Notifications** | Real-time alerts for interactions | All authenticated |
| **User Directory** | Browse and connect with campus members | All authenticated |
| **Admin Dashboard** | Analytics, user management, departments | Admin only |

### 7.2 Role-Based Permissions

```
Admin:    [Create, Read, Update, Delete] all resources
Faculty:  [Create notices, Create announcements, Manage own content]
Student:  [Create posts, Comment, Like, Manage own profile]
Alumni:   [Create posts, Comment, Like, Manage own profile]
Guest:    [Read public content only]
```

---

## 8. Default Credentials

### 8.1 Admin Access

| Field | Value |
|-------|-------|
| **Email** | `campus.admin@gmail.com` |
| **Password** | `Admin@123` |
| **Role** | Administrator |
| **Full Name** | Dr. Rajesh Kumar |

### 8.2 Test User Accounts

| Role | Email | Password |
|------|-------|----------|
| Student | `student.user@gmail.com` | `Student@123` |
| Faculty | `faculty.prof@gmail.com` | `Faculty@123` |
| Alumni | `alumni.grad@gmail.com` | `Alumni@123` |

**Note**: These accounts are created by running `npm run seed` in the server workspace.

---

## 9. Project Structure

```
Campus_Connect/
├── .env.example              # Environment template
├── .gitignore               # Git ignore rules
├── package.json             # Root monorepo config
├── README.md                # Original documentation
├── PROJECT_DOCUMENTATION.md # This file
├── DEPLOYMENT_GUIDE.md      # Deployment instructions
├── client/                  # React Frontend
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── api/
│       ├── components/
│       ├── context/
│       └── pages/
└── server/                  # Express API
    ├── package.json
    ├── tsconfig.json
    ├── prisma/
    │   ├── schema.prisma
    │   └── dev.db
    └── src/
        ├── index.ts
        ├── config/
        ├── controllers/
        ├── middleware/
        ├── routes/
        ├── seed/
        └── utils/
```

---

## 10. Development Workflow

### 10.1 Local Development

```bash
# Install dependencies
npm install

# Start development servers
npm run dev              # Both client and server
npm run dev:server       # Server only (port 5000)
npm run dev:client       # Client only (port 5173)

# Database operations
npm run seed             # Seed test data
npm run db:studio        # Prisma database GUI
```

### 10.2 Build Process

```bash
# Build client for production
npm run build --workspace=client

# Build and start server
npm run build --workspace=server
npm run start --workspace=server
```

---

## 11. Research and Academic Applications

### 11.1 Research Areas

This platform can be utilized for research in:

- **Social Network Analysis**: Studying campus community interactions
- **Educational Technology**: Evaluating digital platforms for academic engagement
- **User Experience Research**: Analyzing role-based interface design
- **Information Dissemination**: Measuring notice board effectiveness
- **Community Building**: Investigating digital spaces for institutional communities

### 11.2 Metrics and Analytics

The platform collects valuable metrics suitable for analysis:

- User engagement rates by role
- Content interaction patterns
- Department-wise activity distribution
- Notice visibility and response rates
- Profile completion and networking patterns

---

## 12. License and Attribution

**License**: MIT License

**Copyright**: Campus Connect Team

**Academic Use**: This project is suitable for:
- Computer Science coursework (Web Development, Database Systems)
- Software Engineering capstone projects
- Research on educational technology platforms
- Case studies in full-stack application development

---

*Generated: March 2026*
*Version: 1.0.0*
