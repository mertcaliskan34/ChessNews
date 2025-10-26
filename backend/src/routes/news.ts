import { Router } from 'express';
import { getNews, refreshTSFNews, getTSFNews, getChessComNews, refreshChessComNews, getFeaturedNews } from '../controllers/NewsController';

const router = Router();

// Get all news (local + TSF + Chess.com)
router.get('/', getNews);

// Get only TSF news
router.get('/tsf', getTSFNews);

// Force refresh TSF news cache
router.post('/tsf/refresh', refreshTSFNews);

// Get only Chess.com news
router.get('/chesscom', getChessComNews);

// Force refresh Chess.com news cache
router.post('/chesscom/refresh', refreshChessComNews);

// Get featured news for homepage (top 5 most important)
router.get('/featured', getFeaturedNews);

// router.post, router.put, router.delete gibi metotları da ekleyebilirsiniz.

export default router;
