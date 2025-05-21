'use client';

import { useEffect, useState } from 'react';
import socket from '@/app/socket/socket';

export default function HomePage() {
  const [gameId, setGameId] = useState('');
  const [joined, setJoined] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [yourTurn, setYourTurn] = useState(false);
  const [board, setBoard] = useState(Array(9).fill(''));
  const [winner, setWinner] = useState(null);
  const [isDraw, setIsDraw] = useState(false);

  const winningCombos = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  const checkGameEnd = (board) => {
    for (const [a, b, c] of winningCombos) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    if (board.every(cell => cell)) return 'draw';
    return null;
  };

  const joinGame = () => {
    if (!gameId.trim()) return;
    socket.emit('join_game', gameId.trim());
  };

  useEffect(() => {
    socket.on('joined', () => {
      setJoined(true);
    });

    socket.on('start_game', ({ yourTurn, symbol }) => {
      setSymbol(symbol);
      setYourTurn(yourTurn);
    });

    socket.on('move_made', ({ move, yourTurn }) => {
      setBoard(prev => {
        const newBoard = [...prev];
        newBoard[move.index] = move.symbol;
        const result = checkGameEnd(newBoard);
        if (result) {
          if (result === 'draw') setIsDraw(true);
          else setWinner(result);
        }
        return newBoard;
      });
      setYourTurn(yourTurn);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const makeMove = (index) => {
    if (!yourTurn || board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = symbol;
    setBoard(newBoard);

    const result = checkGameEnd(newBoard);
    if (result) {
      if (result === 'draw') setIsDraw(true);
      else setWinner(result);
    }

    socket.emit('make_move', { gameId, move: { index, symbol } });
    setYourTurn(false);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(''));
    setWinner(null);
    setIsDraw(false);
    setYourTurn(symbol === 'O');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f2f4f7',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '2rem',
        borderRadius: '1rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        {!joined ? (
          <>
            <h2>Join a Game</h2>
            <input
              value={gameId}
              onChange={e => setGameId(e.target.value)}
              placeholder="Enter Game ID"
              style={{
                padding: '0.5rem',
                width: '100%',
                marginBottom: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid #ccc'
              }}
            />
            <button onClick={joinGame}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                borderRadius: '0.5rem',
                backgroundColor: '#0070f3',
                color: '#fff',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Join Game
            </button>
          </>
        ) : (
          <>
            <h2>You are: <span style={{ color: '#0070f3' }}>{symbol}</span></h2>
            <h3>{yourTurn ? "Your Turn" : "Waiting for opponent..."}</h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              marginTop: 20
            }}>
              {board.map((cell, i) => (
                <div
                  key={i}
                  onClick={() => makeMove(i)}
                  style={{
                    width: '100%',
                    paddingTop: '100%',
                    position: 'relative',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '0.5rem',
                    boxShadow: 'inset 0 0 4px rgba(0,0,0,0.1)',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: '#333'
                  }}>
                    {cell}
                  </span>
                </div>
              ))}
            </div>

            {winner && <h3 style={{ color: 'green', marginTop: 20 }}>{winner} wins!</h3>}
            {isDraw && <h3 style={{ color: 'orange', marginTop: 20 }}>It's a draw!</h3>}

            {(winner || isDraw) && (
              <button
                onClick={resetGame}
                style={{
                  marginTop: 16,
                  padding: '0.5rem 1rem',
                  backgroundColor: '#0070f3',
                  color: '#fff',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Restart Game
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
