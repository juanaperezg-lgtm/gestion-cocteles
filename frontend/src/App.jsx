import { useEffect } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Inventory from './pages/Inventory';
import Login from './pages/Login';
import Products from './pages/Products';
import Purchases from './pages/Purchases';
import Reports from './pages/Reports';
import Sales from './pages/Sales';
import { warmupAppCache } from './services/api';
import './styles/App.css';

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      warmupAppCache();
    }
  }, [isAuthenticated]);

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" /> : <Login />}
      />
      <Route
        path="/"
        element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
      />
      <Route
        path="/sales"
        element={isAuthenticated ? <Sales /> : <Navigate to="/login" />}
      />
      <Route
        path="/products"
        element={isAuthenticated ? <Products /> : <Navigate to="/login" />}
      />
      <Route
        path="/purchases"
        element={isAuthenticated ? <Purchases /> : <Navigate to="/login" />}
      />
      <Route
        path="/inventory"
        element={isAuthenticated ? <Inventory /> : <Navigate to="/login" />}
      />
      <Route
        path="/expenses"
        element={isAuthenticated ? <Expenses /> : <Navigate to="/login" />}
      />
      <Route
        path="/reports"
        element={isAuthenticated ? <Reports /> : <Navigate to="/login" />}
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />}
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
