import React, { useState, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard'; // react-chessboard import edildi
  import {
    Box, Typography, Card, CardContent, Avatar, LinearProgress, IconButton,
    Tooltip, Container,
  } from '@mui/material';
import {
  Share as ShareIcon, FiberManualRecord as LiveIcon, Star as StarIcon,
  VideoCall as VideoCallIcon,
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

// --- STYLED COMPONENTS VE KEYFRAMES (İlk dosyadan olduğu gibi kopyalandı) ---
// ... Buraya ilk dosyanızdaki tüm 'styled', 'keyframes' ve stil tanımlamalarını kopyalayın ...

// BroadcastContainer, TVFrame, PlayerCard vb. hepsi burada olmalı.
// Okunabilirlik için bu kısmı kısalttım, ama sizin kodunuzda tam olmalı.

const pulseRed = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
`;
const BroadcastContainer = styled(Box)({
  background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #16213e 100%)',
  minHeight: '100vh',
  position: 'relative',
  overflow: 'auto',
  fontFamily: 'Inter, sans-serif',
  paddingTop: '80px', // Account for fixed header
});
const TVFrame = styled(Box)({
  position: 'relative',
  background: 'linear-gradient(145deg, #1e293b 0%, #334155 100%)',
  borderRadius: '20px',
  padding: '12px',
  boxShadow: `0 30px 60px rgba(0, 0, 0, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.1)`,
  border: '2px solid rgba(59, 130, 246, 0.2)',
});
const PlayerCard = styled(Card)({
  background: 'rgba(15, 23, 42, 0.98)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(59, 130, 246, 0.3)',
  borderRadius: '16px',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
});
// ... Diğer tüm styled component'ler buraya ...
const BroadcastHeader = styled(Box)({
  position: 'fixed', top: '70px', left: 0, right: 0,
  background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.7) 70%, transparent 100%)',
  padding: '16px 20px', zIndex: 10, backdropFilter: 'blur(10px)',
});
const LiveIndicator = styled(Box)({
  display: 'flex', alignItems: 'center', gap: '8px',
  background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
  padding: '10px 20px', borderRadius: '25px', animation: `${pulseRed} 2s infinite`,
  boxShadow: '0 0 30px rgba(220, 38, 38, 0.6)', border: '1px solid rgba(255, 255, 255, 0.2)',
});

const ControlsPanel = styled(Box)({
  position: 'absolute', bottom: '20px', left: '20px', right: '20px',
  background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(20px)',
  borderRadius: '16px', padding: '12px', display: 'flex',
  justifyContent: 'space-between', alignItems: 'center',
  opacity: 0, transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  zIndex: 8, border: '1px solid rgba(59, 130, 246, 0.2)',
  '&.visible': { opacity: 1, transform: 'translateY(0)' },
  '&:not(.visible)': { transform: 'translateY(20px)' },
});

const BroadcastLogo = styled(Box)({
  display: 'flex', alignItems: 'center', gap: '12px',
  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
  padding: '12px 24px', borderRadius: '30px',
  boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
});

// --- LICHESS API'DAN GELEN VERİLER İÇİN INTERFACE'LER ---
interface User { name: string; id?: string; title?: string; }
interface Player { color: 'white' | 'black'; user?: User; rating?: number; }
interface FeaturedGameData { id: string; orientation: 'white' | 'black'; players: Player[]; fen: string; lastMove?: string; wc: number; bc: number; }
interface FenUpdateData { fen: string; lm?: string; wc: number; bc: number; }
interface LichessStreamMessage { t: 'featured' | 'fen'; d: FeaturedGameData | FenUpdateData; }

// --- BİRLEŞTİRİLMİŞ YENİ BİLEŞEN ---
const LiveLichessBroadcast: React.FC = () => {
  const [gameData, setGameData] = useState({
    whitePlayer: { name: 'Waiting for player...', rating: '----', time: 0 },
    blackPlayer: { name: 'Waiting for player...', rating: '----', time: 0 },
    lastMove: '',
    moveNumber: 0,
  });
  
  
     const [fen, setFen] = useState('start'); // Satranç tahtasının durumu için
   const [orientation, setOrientation] = useState<'white' | 'black'>('white');
   const [showControls, setShowControls] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // --- LICHESS API BAĞLANTI MANTIĞI ---
  useEffect(() => {
    const connectToStream = async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

             try {
         const response = await fetch('https://lichess.org/api/tv/feed', { signal });
         if (!response.body) throw new Error('Response body is null');

         const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep the last incomplete line

          for (const line of lines) {
            if (line.trim()) {
              try {
                const jsonData = JSON.parse(line) as LichessStreamMessage;
                
                if (jsonData.t === 'featured') {
                  const data = jsonData.d as FeaturedGameData;
                  const whiteP = data.players.find(p => p.color === 'white');
                  const blackP = data.players.find(p => p.color === 'black');
                  const moveNum = parseInt(data.fen.split(' ')[5] || '1', 10);

                  setGameData({
                    whitePlayer: { name: `${whiteP?.user?.title || ''} ${whiteP?.user?.name || 'Anonymous'}`, rating: whiteP?.rating?.toString() || '----', time: data.wc },
                    blackPlayer: { name: `${blackP?.user?.title || ''} ${blackP?.user?.name || 'Anonymous'}`, rating: blackP?.rating?.toString() || '----', time: data.bc },
                    lastMove: data.lastMove || '',
                    moveNumber: moveNum,
                  });
                  setFen(data.fen);
                  setOrientation(data.orientation);
                } else if (jsonData.t === 'fen') {
                  const data = jsonData.d as FenUpdateData;
                  const moveNum = parseInt(data.fen.split(' ')[5] || '1', 10);

                  setFen(data.fen);
                  setGameData(prev => ({
                    ...prev,
                    whitePlayer: { ...prev.whitePlayer, time: data.wc },
                    blackPlayer: { ...prev.blackPlayer, time: data.bc },
                    lastMove: data.lm || prev.lastMove,
                    moveNumber: moveNum,
                  }));
                }
              } catch (e) {
                console.error('Error parsing JSON:', e, 'Line:', line);
              }
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Stream connection error:', err);
          setTimeout(connectToStream, 5000);
        }
      }
    };

    connectToStream();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

   return (
    <BroadcastContainer>
      <BroadcastHeader>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <LiveIndicator>
              <LiveIcon sx={{ color: '#fff', fontSize: '14px' }} />
              <Typography sx={{ color: '#fff', fontSize: '16px', fontWeight: 800 }}>LIVE</Typography>
            </LiveIndicator>
            <BroadcastLogo>
              <VideoCallIcon sx={{ color: '#fff', fontSize: '24px' }} />
              <Typography sx={{ color: '#fff', fontSize: '28px', fontWeight: 900, textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>LICHESS TV</Typography>
            </BroadcastLogo>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Share"><IconButton sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' }}><ShareIcon /></IconButton></Tooltip>
          </Box>
        </Box>
      </BroadcastHeader>

      <Container maxWidth="xl" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: { xs: 2, sm: 3, md: 4 },
            width: '100%',
            maxWidth: '600px',
          }}
        >
          {/* SİYAH OYUNCU KARTI (ÜSTTE) */}
          <PlayerCard sx={{ width: '100%', maxWidth: '500px' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ width: 56, height: 56, border: '3px solid #1f2937' }}>🏁</Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>{gameData.blackPlayer.name}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><StarIcon sx={{ color: '#fbbf24' }} /><Typography sx={{ color: '#93c5fd' }}>{gameData.blackPlayer.rating}</Typography></Box>
                </Box>
                <Typography sx={{ color: '#22c55e', fontSize: '32px', fontWeight: 800 }}>{formatTime(gameData.blackPlayer.time)}</Typography>
              </Box>
              <LinearProgress variant="determinate" value={(gameData.blackPlayer.time / 300) * 100} sx={{ height: '8px', borderRadius: '4px', '& .MuiLinearProgress-bar': { bgcolor: '#22c55e' } }} />
            </CardContent>
          </PlayerCard>
          
                     {/* OYUN TAHTASI */}
           <TVFrame
             onMouseEnter={() => setShowControls(true)}
             onMouseLeave={() => setShowControls(false)}
             sx={{
               width: 'clamp(280px, 45vw, 400px)',
               height: 'clamp(280px, 45vw, 400px)', 
               maxWidth: '100%',
               aspectRatio: '1/1'
             }}
           >
            <Chessboard
              id="LichessTVBoard"
              position={fen}
              boardOrientation={orientation}
              arePiecesDraggable={false}
              customBoardStyle={{ borderRadius: '10px', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)' }}
              customDarkSquareStyle={{ backgroundColor: '#b58863' }}
              customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
            />
            <ControlsPanel className={showControls ? 'visible' : ''}>
              <Typography sx={{ color: '#93c5fd', fontSize: '16px' }}>Move {gameData.moveNumber}: {gameData.lastMove}</Typography>
            </ControlsPanel>
          </TVFrame>

          {/* BEYAZ OYUNCU KARTI (ALTTA) */}
          <PlayerCard sx={{ width: '100%', maxWidth: '500px' }}>
             <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ width: 56, height: 56, border: '3px solid #fbbf24' }}>🏳️</Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>{gameData.whitePlayer.name}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><StarIcon sx={{ color: '#fbbf24' }} /><Typography sx={{ color: '#93c5fd' }}>{gameData.whitePlayer.rating}</Typography></Box>
                </Box>
                <Typography sx={{ color: '#22c55e', fontSize: '32px', fontWeight: 800 }}>{formatTime(gameData.whitePlayer.time)}</Typography>
              </Box>
              <LinearProgress variant="determinate" value={(gameData.whitePlayer.time / 300) * 100} sx={{ height: '8px', borderRadius: '4px', '& .MuiLinearProgress-bar': { bgcolor: '#22c55e' } }} />
            </CardContent>
          </PlayerCard>
        </Box>
      </Container>
    </BroadcastContainer>
  );
};

export default LiveLichessBroadcast;