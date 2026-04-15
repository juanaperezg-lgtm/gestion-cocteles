import { AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { productsAPI, salesAPI } from '../services/api';
import '../styles/Sales.css';

function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    unit_price: '',
    notes: '',
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [salesRes, productsRes] = await Promise.all([
        salesAPI.getAll(),
        productsAPI.getAll(),
      ]);
      setSales(salesRes.data);
      setProducts(productsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!formData.product_id || !formData.quantity || !formData.unit_price) {
      setMessage('error:Todos los campos son requeridos');
      return;
    }

    try {
      await salesAPI.create({
        ...formData,
        quantity: parseFloat(formData.quantity),
        unit_price: parseFloat(formData.unit_price),
        user_id: user.id,
      });

      setMessage('success:Venta registrada exitosamente');
      setFormData({ product_id: '', quantity: '', unit_price: '', notes: '' });
      fetchData();

      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`error:${error.response?.data?.error || 'Error al registrar venta'}`);
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;

  const [messageType, messageText] = message ? message.split(':') : ['', ''];

  return (
    <div className="sales-page">
      <Navigation />

      <div className="container">
        <h1>💰 Gestión de Ventas</h1>

        <div className="sales-content">
          <div className="form-section">
            <h2>Registrar Nueva Venta</h2>
            {message && (
              <div className={`message ${messageType}`}>
                {messageType === 'success' ? (
                  <CheckCircle size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
                <span>{messageText}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Producto</label>
                <select
                  name="product_id"
                  value={formData.product_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona un producto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (${product.sale_price})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cantidad</label>
                  <input
                    type="number"
                    name="quantity"
                    step="0.01"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Precio Unitario ($)</label>
                  <input
                    type="number"
                    name="unit_price"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notas</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                ></textarea>
              </div>

              <button type="submit" className="submit-btn">
                <Plus size={18} />
                Registrar Venta
              </button>
            </form>
          </div>

          <div className="sales-list-section">
            <h2>Historial de Ventas</h2>
            {sales.length === 0 ? (
              <p className="empty-message">No hay ventas registradas</p>
            ) : (
              <div className="sales-table-wrapper">
                <table className="sales-table">
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
                    {sales.map((sale) => (
                      <tr key={sale.id}>
                        <td>{sale.product_name}</td>
                        <td>{sale.quantity}</td>
                        <td>${sale.unit_price.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</td>
                        <td className="total">
                          ${sale.total_amount.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
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

export default Sales;
