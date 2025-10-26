import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, Typography, CircularProgress, Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { Chessboard, INPUT_EVENT_TYPE, COLOR } from 'cm-chessboard';
import { Chess } from 'chess.js';

interface LichessApiData {
  game: {
    pgn: string;
    id?: string;
  };
  puzzle: {
    id: string;
    rating: number;
    initialPly: number;
    solution: string[];
  };
}

interface ProcessedPuzzleData {
  id: string;
  rating: number;
  fen: string;
  color: 'white' | 'black';
  solutionPath: string[];
  pgn?: string;
}

interface ChessInputEvent {
  type: string;
  squareFrom: string;
  squareTo: string;
  promotion?: string;
}

// Add error handling utility function
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
};

const LichessPuzzle: React.FC = () => {
  const [rawPuzzleData, setRawPuzzleData] = useState<LichessApiData | null>(null);
  const [processedPuzzle, setProcessedPuzzle] = useState<ProcessedPuzzleData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [triggerFetch, setTriggerFetch] = useState(0);

  const chessboardContainerRef = useRef<HTMLDivElement>(null);
  const chessboardRef = useRef<InstanceType<typeof Chessboard> | null>(null);
  const chessJsGameRef = useRef<Chess | null>(null);

  const [currentPlyInSolution, setCurrentPlyInSolution] = useState(0);
  const [fenAtStartOfCurrentTurn, setFenAtStartOfCurrentTurn] = useState("");
  const [fenAtPuzzleStart, setFenAtPuzzleStart] = useState("");
  const [puzzleStatus, setPuzzleStatus] = useState("Loading puzzle...");
  const [isBoardDisabled, setIsBoardDisabled] = useState(true);
  const [winDialogOpen, setWinDialogOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const handleInputEventCallbackRef = useRef<((event: ChessInputEvent) => Promise<boolean | undefined>)>(() => Promise.resolve(true));

  const showWrongMoveModal = useCallback((message = "Wrong Puzzle Move!") => {
    setModalMessage(message);
    setModalOpen(true);
    setIsBoardDisabled(true);
  }, []);

  const hideWrongMoveModal = useCallback(() => {
    setModalOpen(false);
    if (processedPuzzle && currentPlyInSolution % 2 === 0 && currentPlyInSolution < processedPuzzle.solutionPath.length) {
      setIsBoardDisabled(false);
    }
  }, [processedPuzzle, currentPlyInSolution]);

  const puzzleSolved = useCallback(() => {
    setPuzzleStatus("Puzzle solved!");
    setIsBoardDisabled(true);
    setWinDialogOpen(true);
  }, []);

  const handleCloseWinDialog = () => {
    setWinDialogOpen(false);
  };
  const handleNextPuzzle = () => {
    setWinDialogOpen(false); 
    setTriggerFetch(prev => prev + 1);
  };


  const playAutomatedMove = useCallback(async (
    moveUciToPlay: string,
    plyForThisMove: number,
    fenBeforeThisMove: string,
    isThisMoveByOpponent: boolean
  ) => {
    if (!chessJsGameRef.current || !chessboardRef.current || !processedPuzzle) return;

    if (chessJsGameRef.current.fen() !== fenBeforeThisMove) {
      console.warn(`playAutomatedMove: chess.js FEN desync. Reloading to: ${fenBeforeThisMove}`);
      chessJsGameRef.current.load(fenBeforeThisMove);
    }

    const from = moveUciToPlay.substring(0, 2);
    const to = moveUciToPlay.substring(2, 4);
    const promotionChar = moveUciToPlay.length === 5 ? moveUciToPlay.charAt(4).toLowerCase() : undefined;

    const moveResult = chessJsGameRef.current.move({ from, to, promotion: promotionChar });

    if (!moveResult) {
      console.error(`playAutomatedMove: chess.js INVALID MOVE: {"from":"${from}","to":"${to}"}. FEN was: ${chessJsGameRef.current.fen()}. Tried from: ${fenBeforeThisMove}`);
      setPuzzleStatus("Error: Solution has an illegal move.");
      if (isThisMoveByOpponent) {
        setIsBoardDisabled(false);
      }
      return;
    }

    await chessboardRef.current.movePiece(from, to, true, promotionChar);

    const newOverallPly = plyForThisMove + 1;
    const fenAfterThisMove = chessJsGameRef.current.fen();

    setCurrentPlyInSolution(newOverallPly);
    setFenAtStartOfCurrentTurn(fenAfterThisMove);

    if (newOverallPly >= processedPuzzle.solutionPath.length) {
      setIsBoardDisabled(true);
      puzzleSolved();
    } else {
      if (!isThisMoveByOpponent) {
        setPuzzleStatus("Doğru! Rakip düşünüyor...");
        setIsBoardDisabled(true);
        await new Promise(resolve => setTimeout(resolve, 700));
        await playAutomatedMove(
          processedPuzzle.solutionPath[newOverallPly],
          newOverallPly, fenAfterThisMove, true
        );
      }
      else {
        setPuzzleStatus("Rakip hareket etti. Senin sıran.");
        setIsBoardDisabled(false);
      }
    }
  }, [processedPuzzle, puzzleSolved]);


  const handleInputEvent = useCallback(async (event: ChessInputEvent) => {
    if (!chessJsGameRef.current || !chessboardRef.current || !processedPuzzle) return true;

    const plyOfUserAttempt = currentPlyInSolution;
    const fenBeforeUserAttempt = fenAtStartOfCurrentTurn;

    switch (event.type) {
      case INPUT_EVENT_TYPE.moveInputStarted:
        if (chessJsGameRef.current.fen() !== fenBeforeUserAttempt) {
          chessJsGameRef.current.load(fenBeforeUserAttempt);
        }
        setPuzzleStatus(prev => prev.replace(" (temp-error)", ""));
        return true;

    case INPUT_EVENT_TYPE.validateMoveInput: {
                if (!chessJsGameRef.current || !processedPuzzle) return true;

                const plyOfUserAttemptValidate = currentPlyInSolution;
                const fenBeforeUserAttemptValidate = fenAtStartOfCurrentTurn;

                if (chessJsGameRef.current.fen() !== fenBeforeUserAttemptValidate) {
                     console.warn("VALIDATE: chess.js FEN desync, reloading to:", fenBeforeUserAttemptValidate);
                     chessJsGameRef.current.load(fenBeforeUserAttemptValidate);
                }

                const attemptedMoveForChessJs = {
                    from: event.squareFrom,
                    to: event.squareTo,
                    promotion: event.promotion ? event.promotion.toLowerCase() : undefined
                };

                const legalMovesForSquare = chessJsGameRef.current.moves({ verbose: true });
                const isChessLegal = legalMovesForSquare.some(
                    (legalMove: { from: string; to: string; promotion?: string }) => 
                        legalMove.from === event.squareFrom &&
                        legalMove.to === attemptedMoveForChessJs.to &&
                        (attemptedMoveForChessJs.promotion ? legalMove.promotion === attemptedMoveForChessJs.promotion : true)
                );

                  if (!isChessLegal) {
                    console.log("VALIDATE: ILLEGAL CHESS MOVE attempted:", event.squareFrom + event.squareTo);
                    setPuzzleStatus("Bu yasal bir satranç hamlesi değil.(temp-error)");

                    // ÖNCEKİ FEN'E DÖN
                    if (chessboardRef.current) {
                        const fenToRestore = fenAtStartOfCurrentTurn;
                        console.log("VALIDATE: Illegal move. Attempting to restore board to FEN:", fenToRestore);

                        // chess.js'i de senkronize tutmak her zaman iyi bir fikir
                        if (chessJsGameRef.current && chessJsGameRef.current.fen() !== fenToRestore) {
                            chessJsGameRef.current.load(fenToRestore);
                        }

                   setTimeout(() => {
                            if (chessboardRef.current) { // hala geçerli mi kontrol et
                                chessboardRef.current.setPosition(fenToRestore, false) // false animasyonsuz demek
                                    .then(() => {
                                        console.log("VALIDATE: Board position restored via setPosition after illegal move.");
                                    })
                                    .catch((err: unknown) => {
                                        console.error("VALIDATE: Error restoring board position via setPosition:", getErrorMessage(err));
                                    });
                            }
                        }, 0); // 0ms timeout, işlemi bir sonraki tick'e atar
                    }
                    return false; // Hamlenin geçersiz olduğunu kütüphaneye bildir
                }
                // Hamle satranç kurallarına göre legalse, geçici hatayı temizle
                setPuzzleStatus(prev => prev.replace(" (temp-error)", ""));

                // 2. Bulmaca çözümüne göre doğru mu kontrolü (Bu kısım aynı kalabilir)
                const madeMoveUciValidate = event.squareFrom + event.squareTo + (event.promotion || "");
                if (plyOfUserAttemptValidate >= processedPuzzle.solutionPath.length) {
                    showWrongMoveModal("Puzzle already solved or error in sequence.");
                    if (chessboardRef.current) {
                         // Burada pozisyonu geri almak hala mantıklı, çünkü bu uygulama seviyesinde bir yanlışlık.
                         chessboardRef.current.setPosition(fenBeforeUserAttemptValidate, false);
                    }
                    return false;
                }
                const expectedMoveUciValidate = processedPuzzle.solutionPath[plyOfUserAttemptValidate];
                
                if (madeMoveUciValidate === expectedMoveUciValidate) {
                    return true; // Legal ve doğru bulmaca hamlesi
                } else {
                    showWrongMoveModal(`Oynanan Hamle ${madeMoveUciValidate} .`);
                    // Yanlış bulmaca hamlesi ama legal bir satranç hamlesi.
                    // Kullanıcıya ne olduğunu göstermek için taşı yeni yerine götürüp,
                    // sonra modal ile uyarıp, modaldeki butonlarla geri alma seçeneği sunmak
                    // veya burada anında geri almak bir tasarım tercihidir.
                    // Mevcut kodunuz burada zaten geri alıyor, bu iyi.
                    if (chessboardRef.current) {
                        console.log("VALIDATE: Manually resetting position due to incorrect puzzle move to FEN:", fenBeforeUserAttemptValidate);
                        chessboardRef.current.setPosition(fenBeforeUserAttemptValidate, false)
                            .catch((err: unknown) => {
                                console.error("Error resetting position on incorrect puzzle move:", getErrorMessage(err));
                            });
                    }
                    return false; // Legal ama yanlış bulmaca hamlesi
                }
        break;
      }
      case INPUT_EVENT_TYPE.moveInputFinished: {
        if (event.squareFrom + event.squareTo + (event.promotion || "") === processedPuzzle.solutionPath[plyOfUserAttempt]) {
          setIsBoardDisabled(true);

          if (chessJsGameRef.current.fen() !== fenBeforeUserAttempt) {
            chessJsGameRef.current.load(fenBeforeUserAttempt);
          }

          const userMoveResult = chessJsGameRef.current.move({
            from: event.squareFrom, to: event.squareTo,
            promotion: event.promotion ? event.promotion.toLowerCase() : undefined
          });

          if (!userMoveResult) {
            console.error("CRITICAL: chess.js failed to make a validated user move from FEN:", fenBeforeUserAttempt);
            showWrongMoveModal("Error processing your move. Please reset.");
            return;
          }

          setPuzzleStatus("Correct!");
          const fenAfterUserMove = chessJsGameRef.current.fen();
          const nextOverallPly = plyOfUserAttempt + 1;

          setCurrentPlyInSolution(nextOverallPly);
          setFenAtStartOfCurrentTurn(fenAfterUserMove);

          if (nextOverallPly >= processedPuzzle.solutionPath.length) {
            puzzleSolved();
          } else {
            await playAutomatedMove(
              processedPuzzle.solutionPath[nextOverallPly],
              nextOverallPly, fenAfterUserMove, true
            );
          }
        }
        return true;
      }
      case INPUT_EVENT_TYPE.moveInputCanceled: {
        setPuzzleStatus(prev => prev.replace(" (temp-error)", ""));
        return;
      }
      default: 
        return true;
    }
  }, [currentPlyInSolution, fenAtStartOfCurrentTurn, processedPuzzle, playAutomatedMove, puzzleSolved, showWrongMoveModal]);

  useEffect(() => { handleInputEventCallbackRef.current = handleInputEvent; }, [handleInputEvent]);

  const handleResetToLastCorrect = async () => {
    if (chessboardRef.current && chessJsGameRef.current && processedPuzzle) {
      await chessboardRef.current.setPosition(fenAtStartOfCurrentTurn, false);
      chessJsGameRef.current.load(fenAtStartOfCurrentTurn);
      setPuzzleStatus(`Tekrar dene. Sıra ${processedPuzzle.color === "white" ? "beyaz" : "siyah"}'da.`);
      hideWrongMoveModal();
    } else {
      hideWrongMoveModal();
    }
  };

  const handleResetToPuzzleStart = async () => {
    if (chessboardRef.current && chessJsGameRef.current && processedPuzzle) {
      await chessboardRef.current.setPosition(fenAtPuzzleStart, false);
      chessJsGameRef.current.load(fenAtPuzzleStart);
      setCurrentPlyInSolution(0);
      setFenAtStartOfCurrentTurn(fenAtPuzzleStart);
      setPuzzleStatus(`Bulmaca başa alındı. Sıra ${processedPuzzle.color === "white" ? "beyaz" : "siyah"}'da.`);
      hideWrongMoveModal();
    } else {
      hideWrongMoveModal();
    }
  };
  const handleWrongMoveDialogClose = (event: object, reason: "backdropClick" | "escapeKeyDown") => {
  // Eğer kapatma isteği, dışarıdaki alana tıklayarak geldiyse,
  // hiçbir şey yapma ve fonksiyonu sonlandır.
  if (reason && reason === 'backdropClick') {
    return;
  }

  // Aksi takdirde (örn: Escape tuşuna basıldıysa veya bir butona tıklandıysa),
  // normal kapatma fonksiyonunu çağır.
  hideWrongMoveModal();
};
  useEffect(() => {
    const fetchAndProcessPuzzle = async () => {
      setLoading(true); setError(null); setIsBoardDisabled(true);
      setProcessedPuzzle(null); 
      chessboardRef.current = null; 
      chessJsGameRef.current = null; 
      setPuzzleStatus("Loading new puzzle...");
      // Kullanılacak URL: triggerFetch > 0 ise 'https://lichess.org/api/puzzle/next',
      // değilse (ilk yükleme) 'https://lichess.org/api/puzzle/daily'
      const apiUrl = triggerFetch > 0 ? 'https://lichess.org/api/puzzle/next' : 'https://lichess.org/api/puzzle/daily';
      console.log("Fetching puzzle from:", apiUrl);

      try {
        const response = await fetch(apiUrl); // Değiştirilmiş URL
        if (!response.ok) {
          let errorText = `HTTP error! status: ${response.status}`;
          try { const errorData = await response.json(); if (errorData && errorData.error) errorText = errorData.error; } catch { /* ignore */ }
          throw new Error(`Failed to fetch puzzle: ${errorText}`);
        }
        const data: LichessApiData = await response.json();
        setRawPuzzleData(data);

        if (data.game && data.game.pgn) {
          const gameInstance = new Chess();
          gameInstance.loadPgn(data.game.pgn);
          const puzzleStartFen = gameInstance.fen();
          const puzzleColor = gameInstance.turn() === 'w' ? 'white' : 'black';

          setProcessedPuzzle({
            id: data.puzzle.id, rating: data.puzzle.rating,
            fen: puzzleStartFen, color: puzzleColor,
            solutionPath: data.puzzle.solution, pgn: data.game.pgn
          });
          setFenAtPuzzleStart(puzzleStartFen);
          setFenAtStartOfCurrentTurn(puzzleStartFen);
          setCurrentPlyInSolution(0); 
          setPuzzleStatus(`Sıra ${puzzleColor === "white" ? "beyaz" : "siyah"}'da.`);
          setIsBoardDisabled(false); 
        } else {
          throw new Error("Lichess puzzle data missing PGN.");
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err));
        setPuzzleStatus("Error loading puzzle.");
        setIsBoardDisabled(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessPuzzle();
  }, [triggerFetch]);
  useEffect(() => {
  
    if (processedPuzzle && chessboardContainerRef.current) {
      if (chessboardRef.current) { 
        console.log("Destroying old chessboard instance");
        chessboardRef.current.destroy();
        chessboardRef.current = null;
      }

      console.log("Creating new chessboard instance for puzzle:", processedPuzzle.id);
      chessJsGameRef.current = new Chess(processedPuzzle.fen); 
      const newBoard = new Chessboard(chessboardContainerRef.current, {
        position: processedPuzzle.fen,
        orientation: processedPuzzle.color === "white" ? COLOR.white : COLOR.black,
        responsive: true,
        assetsUrl: "https://cdn.jsdelivr.net/npm/cm-chessboard@8.7.8/assets/"
      });
      chessboardRef.current = newBoard;
    }
  }, [processedPuzzle]);
  useEffect(() => {
    if (processedPuzzle && chessboardContainerRef.current && !chessboardRef.current) {
      chessJsGameRef.current = new Chess(processedPuzzle.fen);
      const newBoard = new Chessboard(chessboardContainerRef.current, {
        position: processedPuzzle.fen,
        orientation: processedPuzzle.color === "white" ? COLOR.white : COLOR.black,
        responsive: true,
        assetsUrl: "https://cdn.jsdelivr.net/npm/cm-chessboard@8.7.8/assets/"
      });
      chessboardRef.current = newBoard;
    }
  }, [processedPuzzle]);

  // *** DÜZELTİLMİŞ useEffect ***
   useEffect(() => {
        console.log("EFFECT (Input Control) triggered. isBoardDisabled:", isBoardDisabled, "currentPly:", currentPlyInSolution, "processedPuzzle:", !!processedPuzzle, "chessboardRef:", !!chessboardRef.current);

        if (!chessboardRef.current || !processedPuzzle) {
            console.log("EFFECT (Input Control): Bailing out, no board or puzzle yet.");
            return;
        }

        const userIsToPlay = currentPlyInSolution % 2 === 0;
        const puzzleNotOver = currentPlyInSolution < processedPuzzle.solutionPath.length;

        console.log(`EFFECT (Input Control): Conditions: userIsToPlay=${userIsToPlay}, puzzleNotOver=${puzzleNotOver}`);

        if (!isBoardDisabled && userIsToPlay && puzzleNotOver) {
            try {
                
                console.log(`EFFECT (Input Control): Attempting to ENABLE input.`);
                chessboardRef.current.enableMoveInput(
                    handleInputEventCallbackRef.current,
                    processedPuzzle.color === "white" ? COLOR.white : COLOR.black
                );
                console.log(`EFFECT (Input Control): enableMoveInput CALLED.`);
            } catch (e: unknown) {
                const errorMessage = getErrorMessage(e);
                if (errorMessage.includes("moveInput already enabled")) {
                    console.warn("EFFECT (Input Control): Tried to enable input, but it was already enabled. Ignoring.");
                } else {
                    console.error("EFFECT (Input Control): Error enabling input:", errorMessage);
                    
                }
            }
        } else {
            try {
                console.log(`EFFECT (Input Control): Attempting to DISABLE input.`);
                chessboardRef.current.disableMoveInput();
                console.log(`EFFECT (Input Control): disableMoveInput CALLED.`);
            } catch (e: unknown) {
                const errorMessage = getErrorMessage(e);
                if (errorMessage.includes("moveInput already disabled")) {
                    console.warn("EFFECT (Input Control): Tried to disable input, but it was already disabled. Ignoring.");
                } else {
                    console.error("EFFECT (Input Control): Error disabling input:", errorMessage);
                }
            }
        }
    }, [isBoardDisabled, currentPlyInSolution, fenAtStartOfCurrentTurn, processedPuzzle, handleInputEventCallbackRef]);


  const handleShowSolution = useCallback(async () => {
    const plyToShow = currentPlyInSolution;
    const fenBeforeMoveToShow = fenAtStartOfCurrentTurn;
    if (!processedPuzzle || plyToShow >= processedPuzzle.solutionPath.length) return;

    setIsBoardDisabled(true);
    const moveUciToShow = processedPuzzle.solutionPath[plyToShow];
    const isMoveSolver = plyToShow % 2 === 0;
    setPuzzleStatus(`Solution: ${(isMoveSolver ? processedPuzzle.color : (processedPuzzle.color === 'white' ? 'black' : 'white'))} plays ${moveUciToShow.slice(0, 2)}-${moveUciToShow.slice(2, 4)}`);

    await playAutomatedMove(
      moveUciToShow, plyToShow, fenBeforeMoveToShow, !isMoveSolver
    );
  }, [currentPlyInSolution, fenAtStartOfCurrentTurn, processedPuzzle, playAutomatedMove]);

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F5F5DC 0%, #FAFAFA 100%)',
      p: 2
    }}>
      <Card sx={{ 
        maxWidth: 1000, 
        width: '100%',
        boxShadow: '0 8px 32px rgba(61, 39, 35, 0.2)',
        borderRadius: '20px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)'
      }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" component="div" gutterBottom sx={{ 
            textAlign: 'center',
            fontFamily: 'Playfair Display, serif',
            fontWeight: 700,
            color: '#3E2723',
            mb: 3
          }}>
            Günün Lichess Bulmacası
          </Typography>
{loading && (
  <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 2 }}>
    <CircularProgress /><Typography sx={{ ml: 2 }}>{puzzleStatus}</Typography>
  </Box>
)}
{error && !loading && (<Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>)}
{!loading && !error && processedPuzzle && (
  <>
    <Typography variant="body2" gutterBottom>
      Bulmaca ID: {processedPuzzle.id} - Zorluk: {processedPuzzle.rating}
    </Typography>
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
      <div ref={chessboardContainerRef} className="lichess-puzzle-container" style={{ 
        width: 'min(80vw, 80vh)', 
        height: 'min(80vw, 80vh)',
        maxWidth: '600px',
        maxHeight: '600px'
      }}></div>
    </Box>
    <Typography sx={{ mt: 1, color: puzzleStatus.includes("temp-error") || puzzleStatus.toLowerCase().includes("error") ? "red" : "inherit" }}>
      {puzzleStatus.replace(" (temp-error)", "")}
    </Typography>
    <Box sx={{ mt: 2 }}>
      <Button variant="contained" onClick={handleShowSolution}
        disabled={isBoardDisabled || !processedPuzzle || currentPlyInSolution >= processedPuzzle.solutionPath.length}>
        Sonraki Çözüm Hamlesini Göster
      </Button>
    </Box>
  </>
)}
{!loading && !error && !processedPuzzle && !rawPuzzleData && (
  <Typography variant="body2">Bulmaca yüklenemedi.</Typography>
)}
        </CardContent>
      </Card>
      
      <Dialog open={modalOpen} onClose={handleWrongMoveDialogClose}>
        <DialogTitle>Yanlış Hamle</DialogTitle>
        <DialogContent><DialogContentText>{modalMessage}</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={handleResetToLastCorrect}sx={{ color: "#fff" }}>Bu Hamleyi Tekrar Dene</Button>
          <Button onClick={handleResetToPuzzleStart}sx={{ color: "#fff" }}>Bulmacayı Başa Al</Button>
          <Button onClick={handleResetToLastCorrect} autoFocus sx={{ color: "#fff" }}>Kapat</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={winDialogOpen} onClose={handleCloseWinDialog}>
        <DialogTitle>Tebrikler!</DialogTitle>
        <DialogContent><DialogContentText>Bulmacayı çözdünüz!</DialogContentText></DialogContent> 
        <DialogActions>
          <Button onClick={handleNextPuzzle}sx={{ color: "#fff" }}>Sonraki Bulmaca</Button> 
          <Button onClick={handleCloseWinDialog} autoFocus sx={{ color: "#fff" }}>Tamam</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LichessPuzzle;