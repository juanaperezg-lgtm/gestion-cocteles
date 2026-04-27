import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import { expensesAPI } from '../services/api';
import { formatLocalDate } from '../utils/date';
import '../styles/Expenses.css';

const DEFAULT_FORM = {
  expense_date: formatLocalDate(),
  category: 'servicios',
  description: '',
  amount: '',
  payment_method: 'efectivo',
  notes: '',
};

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await expensesAPI.getAll();
      setExpenses(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setLoading(false);
      if (error.response?.status === 401) {
        logout();
        navigate('/login', { replace: true });
      }
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    if (!formData.expense_date || !formData.category || !formData.description || !formData.amount) {
      setMessage('error:Fecha, categoría, descripción y monto son obligatorios');
      return;
    }

    const amountNumber = Number(formData.amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      setMessage('error:El monto debe ser mayor a 0');
      return;
    }

    try {
      await expensesAPI.create({
        ...formData,
        amount: amountNumber,
      });

      setMessage('success:Gasto operativo registrado');
      setFormData({
        ...DEFAULT_FORM,
        expense_date: formData.expense_date,
      });
      fetchExpenses();

      setTimeout(() => setMessage(''), 2500);
    } catch (error) {
      setMessage(`error:${error.response?.data?.error || 'Error al registrar gasto'}`);
    }
  };

  const totalExpenses = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const [messageType, messageText] = message ? message.split(':') : ['', ''];

  if (loading) return <div className="loading">Cargando gastos...</div>;

  return (
    <div className="expenses-page">
      <Navigation />

      <div className="container">
        <h1>🧾 Gastos Operativos</h1>

        <div className="expenses-content">
          <div className="form-section">
            <h2>Registrar Gasto</h2>

            {message && (
              <div className={`message ${messageType}`}>
                {messageText}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Fecha</label>
                <input
                  type="date"
                  name="expense_date"
                  value={formData.expense_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Categoría</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="servicios">Servicios</option>
                  <option value="arriendo">Arriendo</option>
                  <option value="nomina">Nómina</option>
                  <option value="transporte">Transporte</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="otros">Otros</option>
                </select>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Ej: pago de energía, transporte, alquiler"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Monto ($)</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Método de pago</label>
                  <select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleChange}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="mixto">Mixto</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Notas</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              <button type="submit" className="submit-btn">Guardar Gasto</button>
            </form>
          </div>

          <div className="expenses-list-section">
            <div className="expenses-header">
              <h2>Historial de Gastos</h2>
              <div className="total-pill">
                Total: ${totalExpenses.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
              </div>
            </div>

            {expenses.length === 0 ? (
              <p className="empty-message">No hay gastos registrados</p>
            ) : (
              <div className="expenses-table-wrapper">
                <table className="expenses-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Categoría</th>
                      <th>Descripción</th>
                      <th>Monto</th>
                      <th>Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense.id}>
                        <td>{expense.expense_date}</td>
                        <td>{expense.category}</td>
                        <td>{expense.description}</td>
                        <td className="amount">
                          ${Number(expense.amount).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                        </td>
                        <td>{expense.payment_method || '-'}</td>
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

export default Expenses;
