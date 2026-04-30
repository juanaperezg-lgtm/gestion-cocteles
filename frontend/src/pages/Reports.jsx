import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import { formatLocalDate } from '../utils/date';
import '../styles/Reports.css';

const getDateRange = (preset) => {
  const today = new Date();
  const endDate = formatLocalDate(today);

  if (preset === 'week') {
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    return { startDate: formatLocalDate(start), endDate };
  }

  if (preset === 'month') {
    return {
      startDate: formatLocalDate(new Date(today.getFullYear(), today.getMonth(), 1)),
      endDate,
    };
  }

  return {
    startDate: formatLocalDate(new Date(today.getFullYear(), 0, 1)),
    endDate,
  };
};

function Reports() {
  const initialRange = useMemo(() => getDateRange('month'), []);
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [summary, setSummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    fetchSummary(initialRange.startDate, initialRange.endDate);
  }, []);

  const fetchSummary = async (from, to) => {
    setLoading(true);
    try {
      const response = await dashboardAPI.getSummary(from, to);
      setSummary(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching summary:', error);
      setLoading(false);
      if (error.response?.status === 401) {
        logout();
        navigate('/login', { replace: true });
      }
    }
  };

  const handleFilter = () => {
    if (!startDate || !endDate) return;
    fetchSummary(startDate, endDate);
  };

  const applyPreset = (preset) => {
    const range = getDateRange(preset);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    fetchSummary(range.startDate, range.endDate);
  };

  const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const normalizeText = (value) => (value || '').toString().trim().toLowerCase();

  const availableExpenseCategories = useMemo(() => {
    const categoryMap = new Map();

    (summary?.expenses || []).forEach((expense) => {
      const rawCategory = (expense.category || '').toString().trim();
      const key = normalizeText(rawCategory);
      if (key && !categoryMap.has(key)) {
        categoryMap.set(key, rawCategory);
      }
    });

    return Array.from(categoryMap.entries()).map(([key, label]) => ({ key, label }));
  }, [summary]);

  const filteredSales = useMemo(() => {
    const term = normalizeText(searchTerm);
    if (!summary?.sales?.length) return [];
    if (!term) return summary.sales;

    return summary.sales.filter((sale) => (
      normalizeText(sale.product_name).includes(term)
      || normalizeText(sale.sale_date).includes(term)
    ));
  }, [summary, searchTerm]);

  const filteredExpenses = useMemo(() => {
    if (!summary?.expenses?.length) return [];

    const term = normalizeText(searchTerm);
    const hasCategoryFilter = expenseCategory !== 'all';

    return summary.expenses.filter((expense) => {
      const category = normalizeText(expense.category);
      const matchesCategory = !hasCategoryFilter || category === expenseCategory;
      const matchesTerm = !term
        || normalizeText(expense.description).includes(term)
        || category.includes(term)
        || normalizeText(expense.expense_date).includes(term);

      return matchesCategory && matchesTerm;
    });
  }, [summary, searchTerm, expenseCategory]);

  const clearAdvancedFilters = () => {
    setSearchTerm('');
    setExpenseCategory('all');
  };

  const escapeCSVValue = (value) => {
    const safeValue = value === null || value === undefined ? '' : String(value);
    return `"${safeValue.replace(/"/g, '""')}"`;
  };

  const downloadCSV = () => {
    if (!summary) return;

    const headersSales = ['Fecha', 'Hora', 'Producto', 'Cantidad', 'Ingreso', 'Costo', 'Ganancia Bruta'];
    const salesRows = summary.sales.map((sale) => ([
      sale.sale_date,
      sale.sale_time,
      sale.product_name,
      toNumber(sale.quantity),
      toNumber(sale.total_amount).toFixed(2),
      toNumber(sale.cogs_amount).toFixed(2),
      toNumber(sale.net_profit).toFixed(2),
    ]));

    const headersExpenses = ['Fecha', 'Categoria', 'Descripcion', 'Monto', 'Metodo'];
    const expenseRows = summary.expenses.map((expense) => ([
      expense.expense_date,
      expense.category,
      expense.description,
      toNumber(expense.amount).toFixed(2),
      expense.payment_method || '-',
    ]));

    const csvLines = [
      ['Reporte Financiero Integral'],
      ['Periodo', `${startDate} - ${endDate}`],
      ['Fecha de generacion', new Date().toLocaleString('es-AR')],
      [],
      ['RESUMEN'],
      ['Ingresos Totales', toNumber(summary.totals.total_revenue).toFixed(2)],
      ['Costo de Ventas', toNumber(summary.totals.total_cogs).toFixed(2)],
      ['Gastos Operativos', toNumber(summary.totals.total_expenses).toFixed(2)],
      ['Neto Libre', toNumber(summary.totals.net_profit).toFixed(2)],
      [],
      ['VENTAS'],
      headersSales,
      ...salesRows,
      [],
      ['GASTOS OPERATIVOS'],
      headersExpenses,
      ...expenseRows,
    ].map((row) => row.map(escapeCSVValue).join(','));

    const csvContent = `\uFEFF${csvLines.join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_financiero_${startDate}_${endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadPDF = async () => {
    try {
      const response = await dashboardAPI.getSummaryPdf(startDate, endDate);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_financiero_${startDate}_${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF report:', error);
    }
  };

  if (loading) return <div className="loading">Cargando reportes...</div>;

  return (
    <div className="reports-page">
      <Navigation />

      <div className="container">
        <h1>📊 Reportes Financieros</h1>

        <div className="reports-content">
          <div className="filter-section">
            <h2>Período</h2>

            <div className="quick-range-buttons">
              <button type="button" className="reset-btn" onClick={() => applyPreset('week')}>Última semana</button>
              <button type="button" className="reset-btn" onClick={() => applyPreset('month')}>Este mes</button>
              <button type="button" className="reset-btn" onClick={() => applyPreset('year')}>Este año</button>
            </div>

            <div className="form-group">
              <label>Fecha Inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Fecha Fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>

            <h2>Detalle</h2>

            <div className="form-group">
              <label>Buscar en tablas</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Producto, fecha o descripción"
              />
            </div>

            <div className="form-group">
              <label>Categoría de gasto</label>
              <select
                value={expenseCategory}
                onChange={(event) => setExpenseCategory(event.target.value)}
              >
                <option value="all">Todas</option>
                {availableExpenseCategories.map((category) => (
                  <option key={category.key} value={category.key}>{category.label}</option>
                ))}
              </select>
            </div>

            <button type="button" onClick={handleFilter} className="filter-btn">Filtrar</button>
            <button type="button" onClick={clearAdvancedFilters} className="reset-btn">Limpiar detalle</button>
            <button type="button" onClick={downloadPDF} className="download-btn">📄 Descargar PDF</button>
            <button type="button" onClick={downloadCSV} className="download-btn">📥 Descargar CSV</button>
          </div>

          <div className="report-section">
            <div className="summary-cards">
              <div className="summary-card">
                <div className="summary-label">Ingresos</div>
                <div className="summary-value">
                  ${toNumber(summary?.totals?.total_revenue).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="summary-card warning">
                <div className="summary-label">Costo de Ventas</div>
                <div className="summary-value">
                  ${toNumber(summary?.totals?.total_cogs).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="summary-card warning">
                <div className="summary-label">Gastos Operativos</div>
                <div className="summary-value">
                  ${toNumber(summary?.totals?.total_expenses).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="summary-card success">
                <div className="summary-label">Neto Libre</div>
                <div className="summary-value">
                  ${toNumber(summary?.totals?.net_profit).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <h2>Ventas del período ({filteredSales.length})</h2>
            {filteredSales.length ? (
              <div className="table-wrapper">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Ingreso</th>
                      <th>Costo</th>
                      <th>Bruto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((sale) => (
                      <tr key={sale.id}>
                        <td>{sale.sale_date}</td>
                        <td>{sale.product_name}</td>
                        <td>{toNumber(sale.quantity)}</td>
                        <td>${toNumber(sale.total_amount).toLocaleString('es-AR', { maximumFractionDigits: 2 })}</td>
                        <td>${toNumber(sale.cogs_amount).toLocaleString('es-AR', { maximumFractionDigits: 2 })}</td>
                        <td className="total">${toNumber(sale.net_profit).toLocaleString('es-AR', { maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-message">No hay ventas para los filtros aplicados</p>
            )}

            <h2 style={{ marginTop: '24px' }}>Gastos operativos del período ({filteredExpenses.length})</h2>
            {filteredExpenses.length ? (
              <div className="table-wrapper">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Categoría</th>
                      <th>Descripción</th>
                      <th>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((expense) => (
                      <tr key={expense.id}>
                        <td>{expense.expense_date}</td>
                        <td>{expense.category}</td>
                        <td>{expense.description}</td>
                        <td className="total">${toNumber(expense.amount).toLocaleString('es-AR', { maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-message">No hay gastos para los filtros aplicados</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
