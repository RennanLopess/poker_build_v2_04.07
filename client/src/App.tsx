import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { connectSocket, getSocket } from './lib/socket';
import { useGameStore } from './store/gameStore';
import LoginPage from './pages/LoginPage';
import LobbyPage from './pages/LobbyPage';
import TablePage from './pages/TablePage';
import ManagerPage from './pages/ManagerPage';

function RequireAuth({ children }: { children: JSX.Element }) {
  const token = useGameStore((state) => state.token);
  return token ? children : <Navigate to="/login" replace />;
}

function RequireManager({ children }: { children: JSX.Element }) {
  const { token, user } = useGameStore();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return <Navigate to="/lobby" replace />;
  }
  return children;
}

export default function App() {
  const token = useGameStore((state) => state.token);

  useEffect(() => {
    if (token && !getSocket()) {
      connectSocket(token);
    }
  }, [token]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/lobby"
        element={
          <RequireAuth>
            <LobbyPage />
          </RequireAuth>
        }
      />
      <Route
        path="/table/:id"
        element={
          <RequireAuth>
            <TablePage />
          </RequireAuth>
        }
      />
      <Route
        path="/manager"
        element={
          <RequireManager>
            <ManagerPage />
          </RequireManager>
        }
      />
      <Route path="*" element={<Navigate to="/lobby" replace />} />
    </Routes>
  );
}
