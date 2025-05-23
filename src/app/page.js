'use client';

import { useEffect, useState } from 'react';
import socket from '@/app/socket/socket';

export default function HomePage() {
  const [gameId, setGameId] = useState('');
  const [joined, setJoined] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [yourTurn, setYourTurn] = useState(false);
  const [board, setBoard] = useState(Array(9).fill(''));

  const joinGame = () => {
    if (!gameId.trim()) return;
    socket.emit('join_game', gameId.trim());
  };

  useEffect(() => {
    socket.on('joined', ({ player }) => {
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
        return newBoard;
      });
      setYourTurn(yourTurn);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const makeMove = (index) => {
    if (!yourTurn || board[index]) return;
    const newBoard = [...board];
    newBoard[index] = symbol;
    setBoard(newBoard);
    socket.emit('make_move', { gameId, move: { index, symbol } });
    setYourTurn(false);
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
            <h2 style={{ marginBottom: '1rem' }}>Join a Game</h2>
            <input
              style={{
                padding: '0.5rem',
                width: '100%',
                fontSize: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid #ccc',
                marginBottom: '1rem'
              }}
              placeholder="Enter Game ID"
              value={gameId}
              onChange={e => setGameId(e.target.value)}
            />
            <button
              onClick={joinGame}
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
            <h2 style={{ color: '#333' }}>You are: <span style={{ color: '#0070f3' }}>{symbol}</span></h2>
            <h4 style={{ color: yourTurn ? 'green' : 'gray' }}>
              {yourTurn ? "Your turn" : "Waiting for opponent..."}
            </h4>
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
          </>
        )}
      </div>
    </div>
  );
}
