import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Public Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import NewsList from './components/NewsList';
import LichessPuzzle from './components/LichessPuzzle';
import LichessTv from './components/LichessTv';
import ClassicGameViewer from './components/ClassicGameViewer';
import EloList from './components/EloList'; 
import EloPage from './pages/EloPage';

// Admin Components
import ProtectedRoute from './components/ProtectedRoute';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminNewsPage from './pages/AdminNewsPage';
import AdminGamesPage from './pages/AdminGamesPage';
import AdminEloPage from './pages/AdminEloPage';
import { ADMIN_PERMISSIONS } from './firebase/adminAuth';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<NewsList />} />
        <Route path="/puzzle" element={<LichessPuzzle />} />
        <Route path="/tv" element={<LichessTv />} />
        <Route path="/pro" element={<ClassicGameViewer />} />
        <Route path="/elo-ukd" element={<EloPage />} />
        <Route path="/elo-tsf" element={<EloList />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/news" 
          element={
            <ProtectedRoute requiredPermission={ADMIN_PERMISSIONS.NEWS_READ}>
              <AdminNewsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/games" 
          element={
            <ProtectedRoute requiredPermission={ADMIN_PERMISSIONS.GAMES_READ}>
              <AdminGamesPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/elo" 
          element={
            <ProtectedRoute requiredPermission={ADMIN_PERMISSIONS.ELO_READ}>
              <AdminEloPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;