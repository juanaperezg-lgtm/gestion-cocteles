import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import { productsAPI } from '../services/api';
import '../styles/Products.css';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    purchase_price: '',
    sale_price: '',
    category: 'cocktail',
    unit: 'unit',
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
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

    if (!formData.name || !formData.purchase_price || !formData.sale_price) {
      setMessage('error:Todos los campos son requeridos');
      return;
    }

    try {
      await productsAPI.create({
        ...formData,
        purchase_price: parseFloat(formData.purchase_price),
        sale_price: parseFloat(formData.sale_price),
      });

      setMessage('success:Producto creado exitosamente');
      setFormData({
        name: '',
        description: '',
        purchase_price: '',
        sale_price: '',
        category: 'cocktail',
        unit: 'unit',
      });
      fetchProducts();

      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`error:${error.response?.data?.error || 'Error al crear producto'}`);
    }
  };

  const calculateMargin = (purchase, sale) => {
    if (!purchase || !sale) return 0;
    return (((sale - purchase) / purchase) * 100).toFixed(1);
  };

  if (loading) return <div className="loading">Cargando...</div>;

  const [messageType, messageText] = message.split(':');

  return (
    <div className="products-page">
      <Navigation />

      <div className="container">
        <h1>🍹 Gestión de Productos</h1>

        <div className="products-content">
          <div className="form-section">
            <h2>Crear Nuevo Producto</h2>
            {message && (
              <div className={`message ${messageType}`}>
                {messageText}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre del Producto</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                ></textarea>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Precio Compra ($)</label>
                  <input
                    type="number"
                    name="purchase_price"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Precio Venta ($)</label>
                  <input
                    type="number"
                    name="sale_price"
                    step="0.01"
                    value={formData.sale_price}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Categoría</label>
                  <select name="category" value={formData.category} onChange={handleChange}>
                    <option value="cocktail">Cócteles</option>
                    <option value="ingredient">Ingredientes</option>
                    <option value="beverage">Bebidas</option>
                    <option value="other">Otros</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Unidad</label>
                  <select name="unit" value={formData.unit} onChange={handleChange}>
                    <option value="ml">ml</option>
                    <option value="cl">cl</option>
                    <option value="unit">Unidad</option>
                    <option value="bottle">Botella</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="submit-btn">
                Crear Producto
              </button>
            </form>
          </div>

          <div className="products-list-section">
            <h2>Catálogo de Productos ({products.length})</h2>
            {products.length === 0 ? (
              <p className="empty-message">No hay productos registrados</p>
            ) : (
              <div className="products-table-wrapper">
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Categoría</th>
                      <th>Precio Compra</th>
                      <th>Precio Venta</th>
                      <th>Margen</th>
                      <th>Unidad</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="product-name">
                          <strong>{product.name}</strong>
                          {product.description && <div className="desc">{product.description}</div>}
                        </td>
                        <td>{product.category || '-'}</td>
                        <td>${product.purchase_price.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</td>
                        <td>${product.sale_price.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</td>
                        <td className="margin">
                          {calculateMargin(product.purchase_price, product.sale_price)}%
                        </td>
                        <td>{product.unit || 'unit'}</td>
                        <td>{product.stock_quantity || 0}</td>
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

export default Products;
