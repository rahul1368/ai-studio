# AI Studio - Fashion Image Generation Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.5.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.16-38bdf8)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)](https://www.postgresql.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.5.8-EF4444)](https://turbo.build/)

A modern, full-stack web application for AI-powered fashion image generation. Built with enterprise-grade architecture using Next.js 15, TypeScript, Turborep mono repo, Prisma, and Docker.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [License](#license)

## ✨ Features

### Core Functionality
- 🔐 **Secure Authentication** - JWT-based auth with bcrypt password hashing
- 📤 **Image Upload** - Drag & drop interface with validation
- 🎨 **AI Image Generation** - Simulated AI processing with effect transformations
- 📊 **Generation History** - View last 5 generations per user
- ⚠️ **Error Handling** - Graceful error handling with 20% simulated failure rate
- 🎯 **Responsive Design** - Mobile-first UI with Tailwind CSS v4

### Technical Highlights
- **Monorepo Architecture** - Turborepo for efficient build caching
- **Type Safety** - Full TypeScript coverage
- **Modern UI** - shadcn/ui components with Radix UI primitives
- **Database ORM** - Prisma for type-safe database access
- **Docker Support** - Containerized PostgreSQL and application
- **IaC Ready** - OpenTofu configuration for GCP deployment

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.5.0 (App Router)
- **Language**: TypeScript 5.9.2
- **Styling**: Tailwind CSS 4.1.16
- **UI Components**: shadcn/ui + Radix UI
- **Form Handling**: React Hook Form + Zod validation
- **State Management**: React Context API
- **Icons**: Lucide React
- **Notifications**: Sonner

### Backend
- **Runtime**: Node.js 20+
- **API**: Next.js API Routes
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **File Processing**: Sharp (image manipulation)

### Database
- **Database**: PostgreSQL 16
- **ORM**: Prisma 6.1.0
- **Migration**: Prisma Migrate

### DevOps & Tools
- **Monorepo**: Turborepo 2.5.8
- **Package Manager**: pnpm 9.0.0
- **Containerization**: Docker & Docker Compose
- **IaC**: OpenTofu (for GCP)
- **Linting**: ESLint 9
- **Formatting**: Prettier

---

## 🏗️ Architecture

### Monorepo Structure

```
ai-studio-assignment/
├── apps/
│   └── web/                 # Next.js 15 application
│       ├── app/            # App Router pages & API routes
│       ├── components/     # React components
│       ├── contexts/       # React contexts (auth)
│       └── lib/            # Utility functions
├── packages/
│   ├── database/           # Prisma schema & client
│   ├── auth/               # JWT & password utilities
│   ├── langchain/          # Image generation logic
│   └── ui/                 # Shared UI components
├── infrastructure/
│   ├── docker/             # Docker configurations
│   └── tofu/               # OpenTofu (Terraform) for GCP
├── docker-compose.yml      # Local development setup
└── turbo.json             # Turborepo configuration
```

### Database Schema

```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  password    String
  name        String?
  generations Generation[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Generation {
  id            String            @id @default(cuid())
  userId        String
  user          User              @relation(fields: [userId], references: [id])
  prompt        String
  originalImage String
  resultImage   String?
  status        GenerationStatus  @default(PENDING)
  error         String?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
}

enum GenerationStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20.x or higher
- **pnpm** 9.x
- **Docker** & Docker Compose
- **PostgreSQL** 16 (or use Docker)

### Installation

1. **Clone the repository**
```bash
cd /Users/rahulkumar/Desktop/Projects/ai-studio-assignment
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
cp env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="postgresql://aistudio:aistudio_dev_password@localhost:5432/ai_studio"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
NODE_ENV="development"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760
```

4. **Start PostgreSQL with Docker**
```bash
docker-compose up -d postgres
```

5. **Run database migrations**
```bash
pnpm --filter @repo/database db:push
```

6. **Generate Prisma Client**
```bash
pnpm --filter @repo/database db:generate
```

7. **Start the development server**
```bash
pnpm run dev
```

The application will be available at **http://localhost:3000**

---

## 💻 Development

### Available Commands

```bash
# Start development server
pnpm run dev

# Build all packages
pnpm run build

# Run linting
pnpm run lint

# Format code
pnpm run format

# Type checking
pnpm run check-types

# Database commands
pnpm --filter @repo/database db:studio     # Open Prisma Studio
pnpm --filter @repo/database db:migrate    # Run migrations
pnpm --filter @repo/database db:generate   # Generate Prisma Client
```

### Development Workflow

1. **Start the database**
```bash
docker-compose up -d postgres
```

2. **Start the development server**
```bash
pnpm run dev
```

3. **Access the application**
   - Web App: http://localhost:3000
   - Prisma Studio: `pnpm --filter @repo/database db:studio`
   - PgAdmin: http://localhost:5050 (admin@aistudio.local / admin)

---

## 🧪 Testing

### Unit Tests
```bash
pnpm test
```

### E2E Tests
```bash
pnpm test:e2e
```

### Test Coverage
```bash
pnpm test:coverage
```

---

## 🚢 Deployment

### Docker Deployment

1. **Build the Docker image**
```bash
docker build -f infrastructure/docker/Dockerfile -t ai-studio:latest .
```

2. **Run with Docker Compose**
```bash
docker-compose up -d
```

### GCP Deployment with OpenTofu

```bash
cd infrastructure/tofu
tofu init
tofu plan
tofu apply
```

---

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### POST `/api/auth/login`
Authenticate a user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### GET `/api/auth/me`
Get current user info (requires authentication).

**Headers:**
```
Authorization: Bearer {token}
```

### Generation Endpoints

#### POST `/api/generate`
Generate an image (requires authentication).

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body:**
- `image`: File (required)
- `prompt`: String (required)

**Response:**
```json
{
  "message": "Image generated successfully",
  "generation": {
    "id": "gen_id",
    "prompt": "vintage style",
    "originalImage": "/uploads/original.jpg",
    "resultImage": "/uploads/result.jpg",
    "status": "COMPLETED"
  }
}
```

#### GET `/api/generations`
Get user's last 5 generations (requires authentication).

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "generations": [
    {
      "id": "gen_id",
      "prompt": "vintage style",
      "originalImage": "/uploads/original.jpg",
      "resultImage": "/uploads/result.jpg",
      "status": "COMPLETED",
      "createdAt": "2025-10-25T12:00:00Z"
    }
  ],
  "count": 1
}
```

---

## 📁 Project Structure

```
ai-studio-assignment/
├── apps/
│   └── web/
│       ├── app/
│       │   ├── api/               # API routes
│       │   │   ├── auth/          # Authentication endpoints
│       │   │   ├── generate/      # Image generation
│       │   │   ├── generations/   # History endpoint
│       │   │   └── uploads/       # File serving
│       │   ├── dashboard/         # Protected dashboard
│       │   ├── login/             # Login page
│       │   ├── register/          # Registration page
│       │   ├── layout.tsx         # Root layout
│       │   └── page.tsx           # Landing page
│       ├── components/
│       │   └── ui/                # shadcn/ui components
│       ├── contexts/
│       │   └── auth-context.tsx   # Auth state management
│       ├── lib/
│       │   ├── auth.ts            # Auth utilities
│       │   └── utils.ts           # Helper functions
│       └── package.json
│
├── packages/
│   ├── database/
│   │   ├── prisma/
│   │   │   └── schema.prisma     # Database schema
│   │   └── src/
│   │       ├── client.ts         # Prisma client setup
│   │       └── index.ts          # Package exports
│   │
│   ├── auth/
│   │   └── src/
│   │       ├── jwt.ts            # JWT utilities
│   │       ├── password.ts       # Password hashing
│   │       └── types.ts          # Type definitions
│   │
│   ├── langchain/
│   │   └── src/
│   │       ├── generator.ts      # Image generation logic
│   │       └── types.ts          # Type definitions
│   │
│   └── ui/
│       └── src/                   # Shared UI components
│
├── infrastructure/
│   ├── docker/
│   │   └── Dockerfile             # Production Docker image
│   └── tofu/                      # OpenTofu (Terraform) configs
│
├── docker-compose.yml             # Local development setup
├── turbo.json                     # Turborepo configuration
├── pnpm-workspace.yaml            # pnpm workspace config
└── README.md                      # This file
```

---

## 🔒 Security Features

- JWT-based authentication with secure token generation
- Password hashing with bcrypt (12 salt rounds)
- Input validation with Zod
- File upload validation (type & size checks)
- Protected API routes with authentication middleware
- SQL injection prevention via Prisma ORM
- XSS protection via React
- Environment variable management

---

## 🎯 Key Features Implementation

### Image Generation Simulation
The app simulates AI image generation by applying transformations based on prompt keywords:
- **"vintage" / "retro"**: Tint effect with reduced saturation
- **"dark" / "moody"**: Reduced brightness, increased saturation
- **"bright" / "vibrant"**: Increased brightness and saturation
- **"blur" / "soft"**: Blur effect
- **Default**: Slight color enhancement with decorative border

### Error Simulation
The system randomly fails ~20% of generation requests to demonstrate error handling:
- User-friendly error messages
- Error state in database
- UI displays error gracefully
- Retry functionality

---

## 🤝 Contributing

This is a coding assignment project. For production use, consider:
- Adding comprehensive test coverage
- Implementing rate limiting
- Adding request logging
- Implementing image optimization
- Adding CDN for static assets
- Implementing proper monitoring
- Adding E2E tests with Playwright/Cypress

---

## 📄 License

This project is created as a coding assignment for Modelia Inc. © 2025

---

## 📧 Contact

For questions or feedback, please contact: frontend@modelia.ai

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Turborepo](https://turbo.build/) - High-performance build system
- [Sharp](https://sharp.pixelplumbing.com/) - High-performance image processing
