# Bidding Management System

## Overview

This is a comprehensive web application for managing sample biddings and procurement processes. The system provides functionality for managing sample submissions, procurement processes, catalog items, and intelligent historical analysis using machine learning and natural language processing. Built with modern web technologies, it features a responsive design and role-based access control for different user types (admin, analyst, consultant).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development patterns
- **Styling**: TailwindCSS with shadcn/ui component library for consistent, responsive design
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for robust form handling
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety across the full stack
- **Architecture Pattern**: RESTful API with service layer separation
- **File Processing**: Multer for file uploads with support for Excel, PDF, and XML formats
- **Authentication**: Replit Auth integration with session-based authentication
- **Services**: Modular service architecture for file parsing, ML predictions, and text similarity

### Database Design
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon serverless PostgreSQL for scalable cloud deployment
- **Schema**: Relational design with the following core entities:
  - **Users**: Role-based access (admin, analyst, consultant)
  - **Sample Biddings**: Main entity for sample management with items
  - **Processes**: Procurement process management with awarded items
  - **Catalog Items**: Centralized item repository
  - **Commitments**: Financial commitment tracking
  - **ML Predictions**: Machine learning analysis results
  - **History Relationships**: Text similarity tracking for intelligent search

### Key Features
- **Sample Management**: Import and track sample biddings with approval/rejection workflows
- **Process Management**: Handle procurement processes with contract validity tracking
- **Catalog Management**: Centralized item database with search capabilities
- **Intelligent History**: NLP-powered similarity search using TF-IDF and cosine similarity
- **Machine Learning**: Automated viability predictions for samples and processes
- **File Import**: Automated parsing of Excel, PDF, and XML files
- **Dashboard**: Real-time KPIs and analytics
- **Reports**: Comprehensive reporting with charts and data visualization

### Security and Authentication
- **Authentication**: Replit OIDC integration with JWT tokens
- **Session Management**: PostgreSQL-backed session storage
- **Authorization**: Role-based access control with middleware protection
- **File Upload Security**: Type validation and size limits for uploaded files

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection for scalable database access
- **drizzle-orm**: Type-safe ORM for database operations with PostgreSQL dialect
- **@tanstack/react-query**: Server state management and caching for React frontend
- **@radix-ui/***: Accessible UI component primitives for consistent interface design
- **wouter**: Lightweight routing library for client-side navigation

### Development Tools
- **Vite**: Modern build tool with hot module replacement for development
- **TypeScript**: Static type checking across frontend and backend
- **TailwindCSS**: Utility-first CSS framework for responsive design
- **shadcn/ui**: Pre-built component library built on Radix UI primitives

### File Processing
- **multer**: Middleware for handling multipart/form-data file uploads
- **xlsx**: Excel file parsing and manipulation
- **pdf-parse**: PDF document text extraction (planned)
- **xml2js**: XML parsing for procurement data imports (planned)

### Machine Learning & NLP
- **Simple ML implementation**: Rule-based viability scoring system
- **TF-IDF text similarity**: Custom implementation for intelligent historical search
- **Cosine similarity**: Mathematical similarity calculations for item matching

### Authentication & Security
- **openid-client**: OIDC authentication with Replit identity provider
- **passport**: Authentication middleware with strategy pattern
- **express-session**: Session management with PostgreSQL storage
- **connect-pg-simple**: PostgreSQL session store adapter

### Production Deployment
- **Docker**: Containerization support for consistent deployment environments
- **Node.js**: Production runtime with ESM module support
- **PostgreSQL**: Production database with connection pooling