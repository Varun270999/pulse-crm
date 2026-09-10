# Pulse CRM

This is the foundational setup and Admin Dashboard for Pulse CRM, built with Next.js 14+ (App Router), PostgreSQL, Prisma, NextAuth.js, Tailwind CSS, and shadcn/ui.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL running locally (default: `localhost:5432`)

## Getting Started

1. **Install dependencies** (if not already installed)
   ```bash
   npm install
   ```

2. **Database Setup**
   Ensure your local PostgreSQL server is running and accessible with the credentials specified in the `.env` file. By default, it expects:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crm_portal?schema=public"
   ```

3. **Run Migrations and Seed Database**
   To create the tables in your PostgreSQL database and seed the default admin account, run:
   ```bash
   npx prisma migrate dev --name init
   ```
   *Note: This command will automatically run the seed script after the migration is complete, creating the default `admin@crm.local` user with password `Admin@123`.*

4. **Start the Development Server**
   ```bash
   npm run dev
   ```

5. **Test the Application**
   - Open [http://localhost:3000/login](http://localhost:3000/login)
   - Log in using the seeded credentials:
     - Email: `admin@crm.local`
     - Password: `Admin@123`
   - You should be redirected to the placeholder Dashboard.
   - You can also test the "Forgot Password" flow to generate a password reset token (which will be printed to the terminal console).

## Project Structure

- `/app`: Next.js App Router pages and Server Actions.
- `/components/ui`: shadcn/ui components.
- `/lib`: Utility functions, Prisma singleton, and Zod validation schemas.
- `/prisma`: Prisma schema and seed script.
- `/types`: TypeScript type definitions (e.g., NextAuth types).
