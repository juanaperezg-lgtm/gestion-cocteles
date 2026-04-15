import {
    BarChart3,
    FileText,
    LogOut,
    Package,
    ShoppingCart,
    TrendingUp,
    Warehouse,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navigation.css';

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
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
          <span className="user-info">{user?.full_name || user?.username}</span>
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
