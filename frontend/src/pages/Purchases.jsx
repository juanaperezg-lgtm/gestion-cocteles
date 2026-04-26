import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import { purchasesAPI } from '../services/api';
import '../styles/Purchases.css';

function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [consumablesStock, setConsumablesStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    product_name: '',
    quantity: '',
    unit: 'unit',
    unit_cost: '',
    supplier: '',
    notes: '',
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [purchasesRes, stockRes] = await Promise.all([
        purchasesAPI.getAll(),
        purchasesAPI.getConsumablesStock(),
      ]);
      setPurchases(purchasesRes.data);
      setConsumablesStock(stockRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
      if (error.response?.status === 401) {
        logout();
        navigate('/login', { replace: true });
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

    if (!formData.product_name || !formData.quantity || !formData.unit_cost) {
      setMessage('error:Todos los campos son requeridos');
      return;
    }

    try {
      await purchasesAPI.create({
        ...formData,
        quantity: parseFloat(formData.quantity),
        unit_cost: parseFloat(formData.unit_cost),
      });

      setMessage('success:Compra registrada exitosamente');
      setFormData({
        product_name: '',
        quantity: '',
        unit: 'unit',
        unit_cost: '',
        supplier: '',
        notes: '',
      });
      fetchData();

      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`error:${error.response?.data?.error || 'Error al registrar compra'}`);
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;

  const [messageType, messageText] = message ? message.split(':') : ['', ''];

  return (
    <div className="purchases-page">
      <Navigation />

      <div className="container">
        <h1>📦 Gestión de Compras</h1>

        <div className="stock-overview">
          <h2>Stock actual de insumos</h2>
          {consumablesStock.length === 0 ? (
            <p className="empty-message">No hay insumos cargados todavía.</p>
          ) : (
            <div className="stock-table-wrapper">
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>Insumo</th>
                    <th>Stock Actual</th>
                    <th>Unidad</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {consumablesStock.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{Number(item.current_stock).toLocaleString('es-AR', { maximumFractionDigits: 2 })}</td>
                      <td>{item.unit}</td>
                      <td className={item.is_low_stock ? 'low-stock' : 'ok-stock'}>
                        {item.is_low_stock ? 'Bajo stock' : 'OK'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

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
                <label>Insumo / Material</label>
                <input
                  type="text"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleChange}
                  placeholder="Ej: vaso 12oz, pitillo, bolsa de hielo"
                  required
                />
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
                  <label>Unidad</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    required
                  >
                    <option value="unit">Unidad</option>
                    <option value="pack">Paquete</option>
                    <option value="bag">Bolsa</option>
                    <option value="kg">Kg</option>
                    <option value="litro">Litro</option>
                  </select>
                </div>
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
                      <th>Insumo</th>
                      <th>Cantidad</th>
                      <th>Unidad</th>
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
                        <td>{purchase.unit || 'unit'}</td>
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
