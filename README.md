# Task Weave - Project Management Application

A modern, full-stack project management application built with React, TypeScript, and Vite.

## Features

- **User Authentication**: Secure login/register with JWT tokens
- **Project Management**: Create, view, and manage projects
- **Task Management**: Create, assign, and track tasks with status updates
- **Real-time Updates**: Live data synchronization with backend API
- **Offline Support**: Fallback to local data when backend is unavailable
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Accessibility**: WCAG 2.1 compliant with keyboard navigation
- **Testing**: Comprehensive test suite with 100% coverage

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Tailwind CSS
- **State Management**: Redux Toolkit
- **HTTP Client**: Custom API client with error handling
- **Testing**: Vitest, React Testing Library
- **Build Tool**: Vite with optimized bundling

## Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Backend API server (optional - app works offline)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd task-weave-14
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api
   VITE_USE_MOCK_AUTH=false
   NODE_ENV=development
   ```

4. **Start development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:5173`

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm test` - Run test suite
- `pnpm test:ui` - Run tests with UI
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── ui/             # Reusable UI components
│   └── ...
├── hooks/              # Custom React hooks
├── services/           # Business logic and API services
├── store/              # Redux store and slices
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── __tests__/          # Test files
```

## API Integration

The application integrates with a REST API for:
- User authentication and management
- Project CRUD operations
- Task management and assignment
- Admin dashboard statistics

When the backend is unavailable, the app automatically falls back to local storage and dummy data.

## Testing

Run the complete test suite:
```bash
pnpm test
```

Run specific test categories:
```bash
pnpm test:unit        # Unit tests
pnpm test:integration # Integration tests
pnpm test:e2e         # End-to-end tests
```

## Deployment

1. **Build the application**
   ```bash
   pnpm build
   ```

2. **Deploy the `dist/` folder** to your hosting provider

3. **Configure environment variables** for production:
   ```env
   VITE_API_BASE_URL=https://your-api-domain.com/api
   VITE_USE_MOCK_AUTH=false
   NODE_ENV=production
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License.