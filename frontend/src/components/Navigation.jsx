import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Navigation.css';

function Navigation({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Llamar callback
    onLogout();

    // Redirigir al login
    navigate('/login', { replace: true });
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <h2>🍹 CockTales</h2>
        </div>

        <ul className="nav-menu">
          <li>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
              className={isActive('/') ? 'active' : ''}
            >
              Dashboard
            </a>
          </li>
          <li>
            <a
              href="/sales"
              onClick={(e) => {
                e.preventDefault();
                navigate('/sales');
              }}
              className={isActive('/sales') ? 'active' : ''}
            >
              Ventas
            </a>
          </li>
          <li>
            <a
              href="/products"
              onClick={(e) => {
                e.preventDefault();
                navigate('/products');
              }}
              className={isActive('/products') ? 'active' : ''}
            >
              Productos
            </a>
          </li>
          <li>
            <a
              href="/purchases"
              onClick={(e) => {
                e.preventDefault();
                navigate('/purchases');
              }}
              className={isActive('/purchases') ? 'active' : ''}
            >
              Compras
            </a>
          </li>
          <li>
            <a
              href="/inventory"
              onClick={(e) => {
                e.preventDefault();
                navigate('/inventory');
              }}
              className={isActive('/inventory') ? 'active' : ''}
            >
              Inventario
            </a>
          </li>
          <li>
            <a
              href="/reports"
              onClick={(e) => {
                e.preventDefault();
                navigate('/reports');
              }}
              className={isActive('/reports') ? 'active' : ''}
            >
              Reportes
            </a>
          </li>
        </ul>

        <div className="nav-right">
          <span className="user-info">{user.full_name || user.username}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
