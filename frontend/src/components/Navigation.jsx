import {
  BarChart3,
  FileText,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  TrendingUp,
  Warehouse,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navigation.css';

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) {
      document.body.style.overflow = '';
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: BarChart3 },
    { path: '/sales', label: 'Ventas', icon: ShoppingCart },
    { path: '/products', label: 'Productos', icon: Package },
    { path: '/purchases', label: 'Compras', icon: TrendingUp },
    { path: '/inventory', label: 'Inventario', icon: Warehouse },
    { path: '/reports', label: 'Reportes', icon: FileText },
  ];

  const renderNavItems = (prefix) => (
    navItems.map((item) => {
      const Icon = item.icon;
      return (
        <li key={`${prefix}-${item.path}`}>
          <a
            href={item.path}
            onClick={(event) => {
              event.preventDefault();
              handleNavigation(item.path);
            }}
            className={isActive(item.path) ? 'active' : ''}
          >
            <Icon size={22} />
            <span>{item.label}</span>
          </a>
        </li>
      );
    })
  );

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <h2>CockTales</h2>
          </div>

          <ul className="desktop-nav-menu">
            {renderNavItems('desktop')}
          </ul>

          <div className="nav-right">
            <span className="user-info">{user?.full_name || user?.username}</span>
            <button type="button" onClick={handleLogout} className="logout-btn">
              <LogOut size={16} />
              Logout
            </button>
          </div>

          <button
            type="button"
            className="hamburger-btn"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-drawer"
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      <div
        className={`menu-overlay ${isMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden="true"
      />

      <aside
        id="mobile-drawer"
        className={`mobile-drawer ${isMenuOpen ? 'open' : ''}`}
        aria-hidden={!isMenuOpen}
      >
        <ul className="mobile-nav-menu">
          {renderNavItems('mobile')}
        </ul>

        <div className="mobile-drawer-footer">
          <div className="user-section">
            <span className="user-info">{user?.full_name || user?.username}</span>
            <button
              type="button"
              onClick={() => {
                handleLogout();
                setIsMenuOpen(false);
              }}
              className="logout-btn-menu"
            >
              <LogOut size={18} />
              Cerrar sesion
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Navigation;
