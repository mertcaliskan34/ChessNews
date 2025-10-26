import React, { useState, useEffect, useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Move } from 'chess.js';
import type { BoardOrientation } from 'react-chessboard/dist/chessboard/types';
import { getAllClassicGames } from '../firebase/classicGames';
import { 
    CircularProgress, 
    Alert, 
    Box, 
    Typography, 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem,
    Card,
    CardContent,
    Chip
} from '@mui/material';

interface ClassicGame {
    id: string;
    title: string;
    pgn: string;
    whitePlayer?: string;
    blackPlayer?: string;
    year?: number;
    event?: string;
    description?: string;
}

interface GameDisplayInfo {
    white: string;
    black: string;
    result: string;
    event?: string;
    date?: string;
}

const viewerStyles = `
.classic-game-viewer {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    font-family: sans-serif;
}
.classic-game-viewer h2 {
    color: white;
}
.game-selector {
    margin-bottom: 20px;
}
.game-selector label {
    color: white;
}
.game-details {
    margin-bottom: 10px;
    padding: 10px;
    border: 1px solid #eee;
    border-radius: 5px;
    background-color: #f9f9f9;
    width: clamp(300px, 80vw, 500px);
    text-align: center;
}
.game-details p { margin: 3px 0; }
.chessboard-container-classic {
    width: clamp(300px, 80vw, 500px);
    margin-bottom: 15px;
}
.navigation-controls button {
    margin: 0 5px;
    padding: 8px 12px;
    font-size: 1em;
    cursor: pointer;
    background-color:rgb(0, 123, 255);
    color: white;
}
.navigation-controls button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
}
.move-list {
    margin-top: 15px;
    max-height: 200px;
    overflow-y: auto;
    padding: 10px;
    border: 1px solid #ddd;
    width: clamp(300px, 80vw, 480px); /* Slightly smaller than board for padding */
    background-color: #f9f9f9;
}
.move-list span {
    cursor: pointer;
    padding: 2px 5px;
    margin-right: 5px;
    border-radius: 3px;
    color: #3E2723;
}
.move-list span.active-ply {
    background-color: #D4AF37;
    color: #3E2723;
    font-weight: bold;
}
.move-list .move-number {
    display: inline-block;
    min-width: 25px;
    color: #5D4037;
    font-weight: bold;
}
`;

const ClassicGameViewer: React.FC = () => {
    const [classicGames, setClassicGames] = useState<ClassicGame[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [selectedGameId, setSelectedGameId] = useState<string>('');
    const [game, setGame] = useState<Chess | null>(null);
    const [currentFen, setCurrentFen] = useState<string>('start');
    const [history, setHistory] = useState<Move[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(-1); // -1 for initial position
    const [gameDetails, setGameDetails] = useState<GameDisplayInfo | null>(null);

    useEffect(() => {
        const styleSheet = document.createElement("style");
        styleSheet.innerText = viewerStyles;
        document.head.appendChild(styleSheet);
        return () => {
            document.head.removeChild(styleSheet);
        };
    }, []);

    useEffect(() => {
        fetchClassicGames();
    }, []);

    const fetchClassicGames = async () => {
        try {
            setLoading(true);
            const games = await getAllClassicGames();
            setClassicGames(games);
            if (games.length > 0) {
                setSelectedGameId(games[0].id);
            }
        } catch (err: unknown) {
            setError('Klasik oyunlar yüklenirken hata oluştu: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const selectedGame = classicGames.find(g => g.id === selectedGameId);
        if (selectedGame) {
            try {
                const chess = new Chess();
                chess.loadPgn(selectedGame.pgn);
                setGame(chess);
                setHistory(chess.history({ verbose: true }) as Move[]);
                setCurrentFen(chess.fen());
                setCurrentIndex(-1);

                const header = chess.header();
                setGameDetails({
                    white: selectedGame.whitePlayer || header.White || 'Unknown',
                    black: selectedGame.blackPlayer || header.Black || 'Unknown',
                    result: header.Result || 'Unknown',
                    event: selectedGame.event || header.Event || 'Unknown',
                    date: selectedGame.year?.toString() || header.Date || 'Unknown',
                });
            } catch (error) {
                console.error("Error loading PGN:", error);
                setGame(null);
                setCurrentFen('start');
                setHistory([]);
                setGameDetails(null);
            }
        }
    }, [selectedGameId, classicGames]);

    useEffect(() => {
        if (!game) return;
        if (!game) {
            setCurrentFen('start');
            return;
        }
        const initialFenFromPgn = game.header().FEN;

        if (currentIndex === -1) { // "Start" position
            if (initialFenFromPgn) {
                setCurrentFen(initialFenFromPgn);
            } else {
                const tempGame = new Chess();
                setCurrentFen(tempGame.fen());
            }
        } else if (currentIndex >= 0 && currentIndex < history.length) {
            const tempGame = new Chess();
            if (initialFenFromPgn) {
                tempGame.load(initialFenFromPgn);
            }

            for (let i = 0; i <= currentIndex; i++) {
                if (history[i] && history[i].san) {
                    tempGame.move(history[i].san);
                } else {
                    console.warn(`Missing or invalid move data at history index ${i}`);
                    // Potentially break or handle this error, e.g., by not advancing setCurrentFen
                    break;
                }
            }
            setCurrentFen(tempGame.fen());
        }
    }, [currentIndex, game, history, selectedGameId]);

    const navigateMoves = (step: number) => {
        if (!game) return;
        let newIndex = currentIndex + step;

        if (newIndex < -1) newIndex = -1;
        if (newIndex >= history.length) newIndex = history.length - 1;

        setCurrentIndex(newIndex);
    };

    const goToPly = (plyIndex: number) => {
        setCurrentIndex(plyIndex);
    };

    const boardOrientation: BoardOrientation = useMemo(() => {
        if (!game) return 'white';
        // Example: always show white at bottom, or orient to current player if desired
        return 'white';
        // Or to orient to current player (might be confusing for replaying):
        // return history[currentIndex]?.color === 'b' ? 'black' : 'white';
    }, [game]);

    if (loading) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '50vh',
                flexDirection: 'column'
            }}>
                <CircularProgress size={60} sx={{ color: '#D4AF37', mb: 2 }} />
                <div style={{ color: 'white' }}>Klasik oyunlar yükleniyor...</div>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
                <Alert severity="error">
                    {error}
                </Alert>
            </Box>
        );
    }

    if (!classicGames.length) {
        return (
            <div className="classic-game-viewer">
                <h2>Classic Chess Games</h2>
                <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>
                    Henüz hiç klasik oyun eklenmemiş.
                    <br />
                    Veri giriş sayfasından oyun ekleyebilirsiniz.
                </div>
            </div>
        );
    }

    return (
        <div className="classic-game-viewer">
            <Typography variant="h3" component="h1" gutterBottom sx={{ 
                textAlign: 'center',
                fontFamily: 'Playfair Display, serif',
                fontWeight: 700,
                color: '#3E2723',
                mb: 4
            }}>
                Klasik Satranç Oyunları
            </Typography>

            <div className="game-selector">
                <FormControl variant="outlined" size="small">
                    <InputLabel id="game-select-label">Oyun</InputLabel>
                    <Select
                        labelId="game-select-label"
                        id="game-select"
                        value={selectedGameId}
                        onChange={(e) => setSelectedGameId(e.target.value)}
                        label="Oyun"
                    >
                        {classicGames.map(g => (
                            <MenuItem key={g.id} value={g.id}>{g.title}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </div>

            {gameDetails && (
                <Card sx={{ mb: 2, backgroundColor: 'rgba(212, 175, 55, 0.1)', borderRadius: 2 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            <strong>{gameDetails.white}</strong> vs <strong>{gameDetails.black}</strong>
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip label={`Sonuç: ${gameDetails.result}`} color="primary" />
                            {gameDetails.event && <Chip label={`Turnuva: ${gameDetails.event}`} variant="outlined" />}
                            {gameDetails.date && <Chip label={`Tarih: ${gameDetails.date}`} variant="outlined" />}
                        </Box>
                    </CardContent>
                </Card>
            )}

            <div className="chessboard-container-classic">
                <Chessboard
                    id="ClassicBoard"
                    position={currentFen}
                    boardOrientation={boardOrientation}
                    arePiecesDraggable={false}
                />
            </div>

            <div className="navigation-controls">
                <button onClick={() => goToPly(-1)} disabled={currentIndex === -1}>
                    {'|< (Başlangıç)'}
                </button>
                <button onClick={() => navigateMoves(-1)} disabled={currentIndex < 0}>
                    {'< (Geri)'}
                </button>
                <button onClick={() => navigateMoves(1)} disabled={!game || currentIndex >= history.length - 1}>
                    {'> (İleri)'}
                </button>
                <button onClick={() => goToPly(history.length - 1)} disabled={!game || currentIndex >= history.length - 1}>
                    {'>| (Son)'}
                </button>
            </div>

            {history.length > 0 && (
                <div className="move-list">
                    {history.map((move, index) => (
                        <React.Fragment key={index}>
                            {move.color === 'w' && <span className="move-number">{Math.floor(index / 2) + 1}.</span>}
                            <span
                                onClick={() => goToPly(index)}
                                className={index === currentIndex ? 'active-ply' : ''}
                            >
                                {move.san}
                            </span>
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClassicGameViewer;