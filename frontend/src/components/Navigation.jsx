import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Navigation.css';

function Navigation({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const isActive = (path) => location.pathname === path;

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
              onClick={() => navigate('/')}
              className={isActive('/') ? 'active' : ''}
            >
              Dashboard
            </a>
          </li>
          <li>
            <a
              href="/sales"
              onClick={() => navigate('/sales')}
              className={isActive('/sales') ? 'active' : ''}
            >
              Ventas
            </a>
          </li>
          <li>
            <a
              href="/products"
              onClick={() => navigate('/products')}
              className={isActive('/products') ? 'active' : ''}
            >
              Productos
            </a>
          </li>
          <li>
            <a
              href="/reports"
              onClick={() => navigate('/reports')}
              className={isActive('/reports') ? 'active' : ''}
            >
              Reportes
            </a>
          </li>
        </ul>

        <div className="nav-right">
          <span className="user-info">{user.full_name || user.username}</span>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
