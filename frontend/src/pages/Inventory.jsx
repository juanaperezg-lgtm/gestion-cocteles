import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import Navigation from '../components/Navigation';
import '../styles/Inventory.css';

function Inventory() {
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await dashboardAPI.getInventory();
      setInventory(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setLoading(false);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) return <div className="loading">Cargando inventario...</div>;

  if (!inventory) return <div className="error">Error al cargar el inventario</div>;

  return (
    <div className="inventory-page">
      <Navigation onLogout={handleLogout} />

      <div className="container">
        <h1>📦 Estado del Inventario</h1>

        <div className="inventory-summary">
          <div className="summary-card">
            <div className="summary-label">Valor Total de Inventario (Costo)</div>
            <div className="summary-value">
              ${inventory.total_inventory_cost?.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Valor Total de Inventario (Venta)</div>
            <div className="summary-value">
              ${inventory.total_inventory_value?.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="summary-card highlight">
            <div className="summary-label">Ganancia Potencial</div>
            <div className="summary-value">
              ${inventory.potential_profit?.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Total de Productos</div>
            <div className="summary-value">{inventory.products?.length || 0}</div>
          </div>
        </div>

        <div className="inventory-table-section">
          <h2>Detalle de Productos en Stock</h2>

          {inventory.products && inventory.products.length > 0 ? (
            <div className="table-wrapper">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Stock</th>
                    <th>Precio Compra</th>
                    <th>Precio Venta</th>
                    <th>Costo de Inventario</th>
                    <th>Valor de Venta</th>
                    <th>Ganancia Potencial</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.products.map((product) => (
                    <tr key={product.id}>
                      <td className="product-name">{product.name}</td>
                      <td className="stock">{product.stock_quantity || 0}</td>
                      <td>${product.purchase_price?.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</td>
                      <td>${product.sale_price?.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</td>
                      <td className="cost">
                        ${product.inventory_cost?.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="value">
                        ${product.inventory_value?.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="profit">
                        ${(product.inventory_value - product.inventory_cost)?.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-message">No hay productos en inventario</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Inventory;
