import { BarChart3, Target, TrendingUp, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import MasterReset from '../components/MasterReset';
import { dashboardAPI } from '../services/api';
import '../styles/Dashboard.css';

function Dashboard() {
  const [todayData, setTodayData] = useState(null);
  const [monthData, setMonthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [today, month] = await Promise.all([
        dashboardAPI.getToday(),
        dashboardAPI.getMonth(),
      ]);
      setTodayData(today.data);
      setMonthData(month.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setLoading(false);
      if (error.response?.status === 401) {
        logout();
        navigate('/login', { replace: true });
      }
    }
  };

  if (loading) return <div className="loading">Cargando datos...</div>;

  return (
    <div className="dashboard">
      <Navigation />

      <div className="container">
        <div className="dashboard-header">
          <h1>📊 Dashboard</h1>
          <MasterReset />
        </div>

        <div className="stats-section">
          <h2>Hoy</h2>
          <div className="grid">
            <div className="stat-box">
              <div className="stat-label">
                <TrendingUp size={20} style={{ display: 'inline', marginRight: '8px' }} />
                Total Vendido
              </div>
              <div className="stat-value">
                ${toNumber(todayData?.total_sales).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="stat-box warning">
              <div className="stat-label">
                <BarChart3 size={20} style={{ display: 'inline', marginRight: '8px' }} />
                Costo de Ventas (COGS)
              </div>
              <div className="stat-value">
                ${toNumber(todayData?.total_cogs).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-label">
                <Target size={20} style={{ display: 'inline', marginRight: '8px' }} />
                Gastos Operativos
              </div>
              <div className="stat-value">
                ${toNumber(todayData?.operating_expenses).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-label">
                <BarChart3 size={20} style={{ display: 'inline', marginRight: '8px' }} />
                Cantidad de Ventas
              </div>
              <div className="stat-value">{toNumber(todayData?.sales_count)}</div>
            </div>

            <div className="stat-box success">
              <div className="stat-label">
                <Zap size={20} style={{ display: 'inline', marginRight: '8px' }} />
                Neto Libre del Día
              </div>
              <div className="stat-value">
                ${toNumber(todayData?.net_profit_after_expenses).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {todayData?.top_products?.length > 0 && (
            <div className="products-section">
              <h3>Productos Más Vendidos</h3>
              <div className="products-table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad Vendida</th>
                      <th>Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayData.top_products.map((product, idx) => (
                      <tr key={idx}>
                        <td>{product.name}</td>
                        <td>{product.quantity_sold}</td>
                        <td>
                          ${toNumber(product.revenue).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="stats-section">
          <h2>Este Mes</h2>
          <div className="grid">
            <div className="stat-box">
              <div className="stat-label">
                <BarChart3 size={20} style={{ display: 'inline', marginRight: '8px' }} />
                Ingresos Totales
              </div>
              <div className="stat-value">
                ${toNumber(monthData?.total_revenue).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="stat-box warning">
              <div className="stat-label">
                <BarChart3 size={20} style={{ display: 'inline', marginRight: '8px' }} />
                Costo de Ventas (COGS)
              </div>
              <div className="stat-value">
                ${toNumber(monthData?.total_cogs).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-label">
                <Target size={20} style={{ display: 'inline', marginRight: '8px' }} />
                Gastos Operativos
              </div>
              <div className="stat-value">
                ${toNumber(monthData?.operating_expenses).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="stat-box success">
              <div className="stat-label">
                <Zap size={20} style={{ display: 'inline', marginRight: '8px' }} />
                Neto Libre del Mes
              </div>
              <div className="stat-value highlight">
                ${toNumber(monthData?.net_profit_after_expenses).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-label">
                <Target size={20} style={{ display: 'inline', marginRight: '8px' }} />
                Cantidad de Ventas
              </div>
              <div className="stat-value">{toNumber(monthData?.sales_count)}</div>
            </div>
          </div>

          {monthData?.top_products?.length > 0 && (
            <div className="products-section">
              <h3>Top 10 Productos del Mes</h3>
              <div className="products-table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad Vendida</th>
                      <th>Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthData.top_products.map((product, idx) => (
                      <tr key={idx}>
                        <td>{product.name}</td>
                        <td>{product.quantity_sold}</td>
                        <td>
                          ${toNumber(product.revenue).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
