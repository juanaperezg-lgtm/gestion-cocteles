import { AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import { productsAPI, salesAPI } from '../services/api';
import '../styles/Sales.css';

function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [consumables, setConsumables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    unit_price: '',
    payment_method: 'efectivo',
    notes: '',
  });
  const [selectedConsumables, setSelectedConsumables] = useState({});
  const [saveTemplate, setSaveTemplate] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [salesRes, productsRes, consumablesRes] = await Promise.all([
        salesAPI.getAll(),
        productsAPI.getAll(),
        salesAPI.getConsumables(),
      ]);
      setSales(salesRes.data);
      setProducts(productsRes.data);
      setConsumables(consumablesRes.data);
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

  const loadProductTemplate = async (productId) => {
    if (!productId) {
      setSelectedConsumables({});
      return;
    }

    try {
      const templateResponse = await salesAPI.getProductConsumables(productId);
      const templateMap = templateResponse.data.reduce((acc, item) => {
        acc[item.consumable_id] = {
          quantity_per_unit: String(item.quantity_per_sale),
        };
        return acc;
      }, {});
      setSelectedConsumables(templateMap);
    } catch (error) {
      console.error('Error loading consumables template:', error);
      setSelectedConsumables({});
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'product_id') {
      setFormData({ ...formData, [name]: value });
      loadProductTemplate(value);
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleConsumableToggle = (consumableId, checked) => {
    setSelectedConsumables((prev) => {
      const next = { ...prev };
      if (checked) {
        next[consumableId] = next[consumableId] || { quantity_per_unit: '1' };
      } else {
        delete next[consumableId];
      }
      return next;
    });
  };

  const handleConsumableQuantityChange = (consumableId, value) => {
    setSelectedConsumables((prev) => ({
      ...prev,
      [consumableId]: {
        quantity_per_unit: value,
      },
    }));
  };

  const selectedConsumablesArray = useMemo(
    () => Object.entries(selectedConsumables)
      .map(([consumableId, values]) => ({
        consumable_id: Number(consumableId),
        quantity_per_unit: Number(values.quantity_per_unit),
      }))
      .filter((item) => Number.isInteger(item.consumable_id) && Number.isFinite(item.quantity_per_unit) && item.quantity_per_unit > 0),
    [selectedConsumables]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!formData.product_id || !formData.quantity || !formData.unit_price || !formData.payment_method) {
      setMessage('error:Todos los campos son requeridos');
      return;
    }

    const saleQuantity = parseFloat(formData.quantity);
    if (!Number.isFinite(saleQuantity) || saleQuantity <= 0) {
      setMessage('error:La cantidad de venta debe ser mayor a 0');
      return;
    }

    try {
      const consumablesUsed = selectedConsumablesArray.map((item) => ({
        consumable_id: item.consumable_id,
        quantity: item.quantity_per_unit * saleQuantity,
      }));

      await salesAPI.create({
        ...formData,
        quantity: saleQuantity,
        unit_price: parseFloat(formData.unit_price),
        consumables_used: consumablesUsed,
      });

      if (saveTemplate && formData.product_id) {
        await salesAPI.saveProductConsumables(formData.product_id, selectedConsumablesArray);
      }

      setMessage('success:Venta registrada exitosamente');
      setFormData({ product_id: '', quantity: '', unit_price: '', payment_method: 'efectivo', notes: '' });
      setSelectedConsumables({});
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
                <label>Método de pago</label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleChange}
                  required
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>

              <div className="form-group">
                <label>Insumos usados por unidad vendida</label>
                <div className="consumables-list">
                  {consumables.length === 0 ? (
                    <p className="empty-consumables">Primero registra compras de insumos para poder descontarlos en ventas.</p>
                  ) : (
                    consumables.map((consumable) => {
                      const selected = Boolean(selectedConsumables[consumable.id]);
                      const isLowStock = Number(consumable.current_stock) <= Number(consumable.low_stock_threshold);
                      return (
                        <div className="consumable-item" key={consumable.id}>
                          <label className="consumable-check">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(event) => handleConsumableToggle(consumable.id, event.target.checked)}
                            />
                            <span>{consumable.name}</span>
                          </label>
                          <div className="consumable-controls">
                            <span className={`consumable-stock ${isLowStock ? 'low' : ''}`}>
                              Stock: {Number(consumable.current_stock).toLocaleString('es-AR', { maximumFractionDigits: 2 })} {consumable.unit}
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={selectedConsumables[consumable.id]?.quantity_per_unit || ''}
                              onChange={(event) => handleConsumableQuantityChange(consumable.id, event.target.value)}
                              disabled={!selected}
                              placeholder="Cantidad"
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <label className="template-toggle">
                <input
                  type="checkbox"
                  checked={saveTemplate}
                  onChange={(event) => setSaveTemplate(event.target.checked)}
                />
                Guardar estos insumos como plantilla para este producto
              </label>

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
                      <th>Método de Pago</th>
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
                        <td>{sale.payment_method === 'transferencia' ? 'Transferencia' : 'Efectivo'}</td>
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
