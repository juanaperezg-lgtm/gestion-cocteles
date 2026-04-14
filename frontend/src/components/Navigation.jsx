import { useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart3,
  ShoppingCart,
  Package,
  TrendingUp,
  Warehouse,
  FileText,
  LogOut,
} from 'lucide-react';
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

  const navItems = [
    { path: '/', label: 'Dashboard', icon: BarChart3 },
    { path: '/sales', label: 'Ventas', icon: ShoppingCart },
    { path: '/products', label: 'Productos', icon: Package },
    { path: '/purchases', label: 'Compras', icon: TrendingUp },
    { path: '/inventory', label: 'Inventario', icon: Warehouse },
    { path: '/reports', label: 'Reportes', icon: FileText },
  ];

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <h2>🍹 CockTales</h2>
        </div>

        <ul className="nav-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <a
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.path);
                  }}
                  className={isActive(item.path) ? 'active' : ''}
                >
                  <Icon size={18} />
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>

        <div className="nav-right">
          <span className="user-info">{user.full_name || user.username}</span>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
