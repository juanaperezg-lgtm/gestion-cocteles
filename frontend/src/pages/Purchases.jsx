import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { purchasesAPI, productsAPI } from '../services/api';
import Navigation from '../components/Navigation';
import '../styles/Purchases.css';

function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    unit_cost: '',
    supplier: '',
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
      const [purchasesRes, productsRes] = await Promise.all([
        purchasesAPI.getAll(),
        productsAPI.getAll(),
      ]);
      setPurchases(purchasesRes.data);
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

    if (!formData.product_id || !formData.quantity || !formData.unit_cost) {
      setMessage('error:Todos los campos son requeridos');
      return;
    }

    try {
      await purchasesAPI.create({
        ...formData,
        quantity: parseFloat(formData.quantity),
        unit_cost: parseFloat(formData.unit_cost),
        user_id: user.id,
      });

      setMessage('success:Compra registrada exitosamente');
      setFormData({ product_id: '', quantity: '', unit_cost: '', supplier: '', notes: '' });
      fetchData();

      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`error:${error.response?.data?.error || 'Error al registrar compra'}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) return <div className="loading">Cargando...</div>;

  const [messageType, messageText] = message.split(':');

  return (
    <div className="purchases-page">
      <Navigation onLogout={handleLogout} />

      <div className="container">
        <h1>📦 Gestión de Compras</h1>

        <div className="purchases-content">
          <div className="form-section">
            <h2>Registrar Nueva Compra</h2>
            {message && (
              <div className={`message ${messageType}`}>
                {messageText}
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
                      {product.name} (Stock: {product.stock_quantity || 0})
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
                  <label>Costo Unitario ($)</label>
                  <input
                    type="number"
                    name="unit_cost"
                    step="0.01"
                    value={formData.unit_cost}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Proveedor</label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                />
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
                Registrar Compra
              </button>
            </form>
          </div>

          <div className="purchases-list-section">
            <h2>Historial de Compras</h2>
            {purchases.length === 0 ? (
              <p className="empty-message">No hay compras registradas</p>
            ) : (
              <div className="purchases-table-wrapper">
                <table className="purchases-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Costo Unitario</th>
                      <th>Total</th>
                      <th>Proveedor</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((purchase) => (
                      <tr key={purchase.id}>
                        <td>{purchase.product_name}</td>
                        <td>{purchase.quantity}</td>
                        <td>${purchase.unit_cost.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</td>
                        <td className="total">
                          ${purchase.total_cost.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                        </td>
                        <td>{purchase.supplier || '-'}</td>
                        <td>{purchase.purchase_date}</td>
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

export default Purchases;
