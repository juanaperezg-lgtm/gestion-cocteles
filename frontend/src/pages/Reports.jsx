import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { salesAPI } from '../services/api';
import '../styles/Reports.css';

function Reports() {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllSales();
  }, []);

  const fetchAllSales = async () => {
    try {
      const response = await salesAPI.getAll();
      setSales(response.data);
      setFilteredSales(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sales:', error);
      setLoading(false);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleFilter = () => {
    if (!startDate || !endDate) {
      setFilteredSales(sales);
      return;
    }

    const filtered = sales.filter((sale) => sale.sale_date >= startDate && sale.sale_date <= endDate);

    setFilteredSales(filtered);
  };

  const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const calculateTotals = () => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + toNumber(sale.total_amount), 0);

    return {
      totalSales: filteredSales.length,
      totalRevenue,
      averagePerSale: filteredSales.length > 0 ? (totalRevenue / filteredSales.length) : 0,
    };
  };

  const escapeCSVValue = (value) => {
    const safeValue = value === null || value === undefined ? '' : String(value);
    return `"${safeValue.replace(/"/g, '""')}"`;
  };

  const downloadCSV = () => {
    const totals = calculateTotals();
    const headers = ['Producto', 'Cantidad', 'Precio Unitario', 'Total', 'Fecha', 'Hora'];
    const rows = filteredSales.map((sale) => ([
      sale.product_name,
      toNumber(sale.quantity),
      toNumber(sale.unit_price).toFixed(2),
      toNumber(sale.total_amount).toFixed(2),
      sale.sale_date,
      sale.sale_time,
    ]));

    const csvLines = [
      ['Reporte de Ventas'],
      ['Periodo', `${startDate || 'Todas'} - ${endDate || 'Todas'}`],
      ['Fecha de generacion', new Date().toLocaleString('es-AR')],
      [],
      ['RESUMEN'],
      ['Total de Ventas', totals.totalSales],
      ['Ingresos Totales', totals.totalRevenue.toFixed(2)],
      ['Promedio por Venta', totals.averagePerSale.toFixed(2)],
      [],
      headers,
      ...rows,
    ].map((row) => row.map(escapeCSVValue).join(','));

    const csvContent = `\uFEFF${csvLines.join('\n')}`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_ventas_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) return <div className="loading">Cargando reportes...</div>;

  const totals = calculateTotals();

  return (
    <div className="reports-page">
      <Navigation />

      <div className="container">
        <h1>📊 Reportes de Ventas</h1>

        <div className="reports-content">
          <div className="filter-section">
            <h2>Filtrar por Período</h2>

            <div className="form-group">
              <label>Fecha Inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Fecha Fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <button type="button" onClick={handleFilter} className="filter-btn">
              Filtrar
            </button>

            <button type="button" onClick={() => {
              setStartDate('');
              setEndDate('');
              setFilteredSales(sales);
            }} className="reset-btn">
              Limpiar Filtro
            </button>

            <button type="button" onClick={downloadCSV} className="download-btn">
              📥 Descargar CSV
            </button>
          </div>

          <div className="report-section">
            <div className="summary-cards">
              <div className="summary-card">
                <div className="summary-label">Total de Ventas</div>
                <div className="summary-value">{totals.totalSales}</div>
              </div>

              <div className="summary-card">
                <div className="summary-label">Ingresos Totales</div>
                <div className="summary-value">
                  ${totals.totalRevenue.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-label">Promedio por Venta</div>
                <div className="summary-value">
                  ${totals.averagePerSale.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {filteredSales.length === 0 ? (
              <p className="empty-message">No hay ventas en el período seleccionado</p>
            ) : (
              <div className="table-wrapper">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio Unitario</th>
                      <th>Total</th>
                      <th>Fecha</th>
                      <th>Hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((sale) => (
                      <tr key={sale.id}>
                        <td>{sale.product_name}</td>
                        <td>{toNumber(sale.quantity)}</td>
                        <td>${toNumber(sale.unit_price).toLocaleString('es-AR', { maximumFractionDigits: 2 })}</td>
                        <td className="total">
                          ${toNumber(sale.total_amount).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                        </td>
                        <td>{sale.sale_date}</td>
                        <td>{sale.sale_time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
