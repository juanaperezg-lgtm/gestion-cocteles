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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
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
                ${todayData?.total_sales?.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-label">
                <BarChart3 size={20} style={{ display: 'inline', marginRight: '8px' }} />
                Cantidad de Ventas
              </div>
              <div className="stat-value">{todayData?.sales_count || 0}</div>
            </div>

            <div className="stat-box">
              <div className="stat-label">
                <Target size={20} style={{ display: 'inline', marginRight: '8px' }} />
                Promedio por Venta
              </div>
              <div className="stat-value">
                ${(todayData?.sales_count > 0 ? todayData?.total_sales / todayData?.sales_count : 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {todayData?.top_products?.length > 0 && (
            <div className="products-section">
              <h3>Productos Más Vendidos</h3>
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
                        ${product.revenue?.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                ${monthData?.total_revenue?.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
              </div>
            </div>

              <div className="stat-box success">
                <div className="stat-label">
                  <Zap size={20} style={{ display: 'inline', marginRight: '8px' }} />
                  Ganancia Total (Bruta)
                </div>
                <div className="stat-value highlight">
                  ${(monthData?.gross_earnings ?? monthData?.total_revenue ?? 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-label">
                  <Target size={20} style={{ display: 'inline', marginRight: '8px' }} />
                  Cantidad de Ventas
                </div>
                <div className="stat-value">{monthData?.sales_count ?? 0}</div>
              </div>
            </div>

          {monthData?.top_products?.length > 0 && (
            <div className="products-section">
              <h3>Top 10 Productos del Mes</h3>
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
                        ${product.revenue?.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
