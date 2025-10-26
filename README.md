# ChessNews - Chess News and ELO Tracking Platform

ChessNews is a modern web platform designed for chess enthusiasts. It aggregates chess news from multiple sources, tracks ELO ratings from the Turkish Chess Federation (TSF), and provides interactive chess tools for the community.

## Project Overview

This project aims to create a comprehensive information and news resource for chess players, particularly focusing on the Turkish chess community. The platform serves as a centralized hub for chess news, ELO rankings, and interactive chess tools without competing with major platforms like Lichess or Chess.com.

## Features

### News Management
- Real-time chess news aggregation from multiple sources
- Category-based filtering (TREND, NEW)
- Responsive news cards with modern UI
- Admin panel for news management
- Special focus on chess tournaments and communities in the Thrace region

### ELO Rankings
- Automated ELO data extraction from TSF
- Real-time ELO rankings and player statistics
- Player search and filtering capabilities
- Direct profile links via FIDE ID
- Support for both ELO and UKD data from TSF sources

### Interactive Chess Tools
- **Lichess Puzzles**: Daily chess puzzles and training
- **Lichess TV**: Live chess broadcasts
- **Classic Games**: Historical chess games database
- **Pro Games**: Grandmaster games and analysis
- Featured games from famous chess masters as news content

### Admin Panel (Back Office)
- Comprehensive news management system
- ELO data management and updates
- Classic games database management
- User authorization and permission system
- Content management tools for authorized users
- Announcement system similar to university websites

### Blog and Communication
- Chess rules, regulations, and guidelines
- Blog-style article publishing
- Optional WhatsApp support channel for community interaction

## Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type safety and development experience
- **Vite** - Fast build tool and development server
- **Material-UI (MUI)** - Comprehensive UI component library
- **React Router** - Client-side routing
- **Firebase** - Authentication and real-time database
- **Chess.js** - Chess logic and game handling
- **CM-Chessboard** - Interactive chess board component

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **TypeScript** - Type-safe backend development
- **Axios** - HTTP client for external API calls
- **Node-Cron** - Scheduled task management
- **Cheerio** - HTML parsing and web scraping
- **PDF/XLS Parsers** - Document processing for ELO data

### Database
- **Firebase Firestore** - Primary NoSQL database
- **Firebase Authentication** - User management
- **Firebase Storage** - File and media storage

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Git version control

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ChessNews
```

### 2. Backend Setup
```bash
cd backend
npm install
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Environment Configuration

Create environment files for both frontend and backend:

#### Backend (.env)
Create a `.env` file in the `backend` directory:
```env
PORT=3001
NODE_ENV=development
# Firebase Admin SDK (optional)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

#### Frontend (.env)
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:3001
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

**Note**: The current Firebase configuration in `frontend/src/firebase/config.ts` uses hardcoded values. After creating your `.env` file with the correct values, the application will automatically use the environment variables instead of the hardcoded values.

## Running the Application

### Development Mode

#### Start Backend Server
```bash
cd backend
npm run dev
```
Backend will run on http://localhost:3001

#### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
Frontend will run on http://localhost:5173

### Production Mode

#### Build and Run Backend
```bash
cd backend
npm run build
npm start
```

#### Build and Run Frontend
```bash
cd frontend
npm run build
npm run preview
```

## Project Structure

```
ChessNews/
├── backend/                    # Backend application
│   ├── src/
│   │   ├── controllers/        # API controllers
│   │   ├── elo/               # ELO data processing modules
│   │   ├── routes/            # API route definitions
│   │   ├── services/          # Business logic services
│   │   └── index.ts           # Main server file
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # Frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/            # Page components
│   │   ├── firebase/         # Firebase configuration
│   │   ├── config/           # Configuration files
│   │   └── App.tsx           # Main application component
│   ├── public/               # Static assets
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── README.md
```

## API Endpoints

### ELO Endpoints
- `GET /api/elo` - Retrieve all ELO data
- `POST /api/elo/update` - Manually update ELO data

### News Endpoints
- `GET /api/news` - Get all news articles
- `GET /api/news/featured` - Get featured news
- `GET /api/news/tsf` - Get TSF-specific news
- `GET /api/news/chesscom` - Get Chess.com news
- `POST /api/news` - Create new news article
- `PUT /api/news/:id` - Update news article
- `DELETE /api/news/:id` - Delete news article

## Admin Setup

### 1. Create Admin Account
Run the following in browser console:
```javascript
// Create default admin account
window.createDefaultAdmin();

// Or create custom admin account
window.createAdmin({
  email: "admin@example.com",
  password: "password123",
  displayName: "Admin User",
  permissions: ["NEWS_READ", "NEWS_CREATE", "ELO_READ", "GAMES_READ"]
});
```

### 2. Admin Panel Access
- `/admin/login` - Admin login page
- `/admin/dashboard` - Admin dashboard
- `/admin/news` - News management
- `/admin/elo` - ELO data management
- `/admin/games` - Game database management

## Automated Updates

### ELO Data Updates
- **Automatic**: Every 2nd day of the month at 04:05 AM
- **Manual**: Via `/api/elo/update` endpoint
- **Source**: Turkish Chess Federation official website

### Cron Job Configuration
```javascript
// Monthly cron job (2nd day of month, 04:05 AM)
cron.schedule('5 4 2 * *', async () => {
  await updateEloData();
});
```

## Troubleshooting

### Backend Issues
```bash
# Check port availability
netstat -ano | findstr :3001

# View server logs
cd backend
npm run dev
```

### Frontend Issues
```bash
# Reinstall dependencies
cd frontend
rm -rf node_modules
npm install

# Clear Vite cache
npm run dev -- --force
```

### ELO Data Update Issues
```bash
# Manual ELO update
curl -X POST http://localhost:3001/api/elo/update

# Check backend logs
cd backend
npm run dev
```

## Performance Optimizations

### Frontend Optimizations
- Lazy loading for components
- Image optimization and compression
- Code splitting for better bundle management
- Bundle size optimization

### Backend Optimizations
- API response caching
- Database query optimization
- Rate limiting implementation
- Comprehensive error handling

## Security Features

### Frontend Security
- Input validation and sanitization
- XSS protection mechanisms
- CSRF protection
- Secure HTTP headers

### Backend Security
- Rate limiting for API endpoints
- Input sanitization and validation
- Authentication middleware
- Environment variable protection

## Monitoring and Logging

### Logging System
- Console logging for development
- Error tracking and reporting
- Performance monitoring
- User analytics and behavior tracking

### Health Checks
- API endpoint health monitoring
- Database connectivity checks
- External service status monitoring

## Target Audience and Development Potential

This project is designed to serve chess players in the Tekirdağ and Thrace regions. The platform can be commercialized for use by chess clubs and associations. Collaboration with newly established chess organizations can expand the project's scope and impact.

## Future Development

- Integration with local chess authorities
- Copyright research for content sources
- Technology stack decisions and optimization
- UI/UX design improvements
- Community feedback integration

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- **TSF** - For ELO data access
- **Lichess** - For API services and chess tools
- **Material-UI** - For UI components
- **Firebase** - For backend services

---

**Note**: This project is developed for educational purposes. Additional security measures should be implemented for production use.

This project aims to create a dynamic and sustainable information platform that adds value to chess communities.