import { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { resetAPI } from '../services/api';
import '../styles/MasterReset.css';

function MasterReset() {
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetInfo, setResetInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [safetyInput, setSafetyInput] = useState('');

  const openModal = async () => {
    setShowModal(true);
    setFeedback(null);
    setLoading(true);
    try {
      const response = await resetAPI.getInfo();
      setResetInfo(response.data);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: 'Error al obtener información del reseteo'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (safetyInput !== 'RESETEAR_TODO') {
      setFeedback({
        type: 'error',
        message: 'Debe escribir "RESETEAR_TODO" para confirmar'
      });
      return;
    }
    setShowConfirm(true);
  };

  const executeReset = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const response = await resetAPI.execute({ confirmed: true });
      setFeedback({
        type: 'success',
        message: '✓ Reseteo maestro completado exitosamente',
        details: response.data
      });
      // Limpiar modal después de 3 segundos
      setTimeout(() => {
        setShowModal(false);
        setShowConfirm(false);
        setSafetyInput('');
      }, 3000);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.error || 'Error al ejecutar reseteo',
        details: error.response?.data?.message
      });
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setShowConfirm(false);
    setSafetyInput('');
    setFeedback(null);
  };

  return (
    <div className="master-reset-container">
      <button
        className="master-reset-btn"
        onClick={openModal}
        title="Elimina todos los registros de ventas, compras, productos e inventario"
      >
        <Trash2 size={18} />
        Reseteo Maestro
      </button>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Etapa 1: Info */}
            {!showConfirm && feedback?.type !== 'success' && (
              <>
                <div className="modal-header warning">
                  <AlertTriangle size={24} />
                  <h2>Reseteo Maestro</h2>
                </div>

                {loading ? (
                  <div className="loading-spinner">Cargando información...</div>
                ) : (
                  <>
                    <div className="modal-body">
                      <p className="warning-text">
                        ⚠️ Esta operación <strong>eliminará permanentemente</strong> todos los registros de:
                      </p>

                      {resetInfo && (
                        <div className="records-summary">
                          <div className="record-item">
                            <span>Productos</span>
                            <span className="count">{resetInfo.recordsToDelete.products || 0}</span>
                          </div>
                          <div className="record-item">
                            <span>Ventas</span>
                            <span className="count">{resetInfo.recordsToDelete.sales || 0}</span>
                          </div>
                          <div className="record-item">
                            <span>Compras</span>
                            <span className="count">{resetInfo.recordsToDelete.purchases || 0}</span>
                          </div>
                          <div className="record-item">
                            <span>Inventario</span>
                            <span className="count">{resetInfo.recordsToDelete.inventory || 0}</span>
                          </div>
                          <div className="record-item total">
                            <span>Total de registros a eliminar</span>
                            <span className="count">{resetInfo.totalRecords}</span>
                          </div>
                        </div>
                      )}

                      <div className="safety-notice">
                        ℹ️ Los usuarios del sistema se mantendrán intactos.
                      </div>

                      <p className="warning-text critical">
                        Se recomienda hacer un <strong>backup de la base de datos</strong> antes de proceder.
                      </p>
                    </div>

                    {feedback && (
                      <div className={`feedback-message ${feedback.type}`}>
                        {feedback.type === 'error' && <XCircle size={18} />}
                        <div>
                          <p>{feedback.message}</p>
                          {feedback.details && <small>{feedback.details}</small>}
                        </div>
                      </div>
                    )}

                    <div className="modal-actions">
                      <button
                        className="btn-cancel"
                        onClick={closeModal}
                        disabled={loading}
                      >
                        Cancelar
                      </button>
                      <button
                        className="btn-proceed"
                        onClick={() => setShowConfirm(true)}
                        disabled={loading}
                      >
                        Proceder a Confirmación
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Etapa 2: Confirmación */}
            {showConfirm && feedback?.type !== 'success' && (
              <>
                <div className="modal-header critical">
                  <AlertTriangle size={24} />
                  <h2>Confirmación Final</h2>
                </div>

                <div className="modal-body">
                  <p className="critical-warning">
                    🚨 Punto de no retorno - Esta acción no puede deshacerse
                  </p>

                  <div className="confirmation-input">
                    <label>
                      Escriba <strong>"RESETEAR_TODO"</strong> para confirmar:
                    </label>
                    <input
                      type="text"
                      value={safetyInput}
                      onChange={(e) => setSafetyInput(e.target.value.toUpperCase())}
                      placeholder="Escriba aquí..."
                      disabled={loading}
                      autoFocus
                    />
                  </div>

                  {feedback && (
                    <div className={`feedback-message ${feedback.type}`}>
                      {feedback.type === 'error' && <XCircle size={18} />}
                      <p>{feedback.message}</p>
                    </div>
                  )}
                </div>

                <div className="modal-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      setShowConfirm(false);
                      setSafetyInput('');
                      setFeedback(null);
                    }}
                    disabled={loading}
                  >
                    Volver Atrás
                  </button>
                  <button
                    className="btn-reset"
                    onClick={executeReset}
                    disabled={loading || safetyInput !== 'RESETEAR_TODO'}
                  >
                    {loading ? 'Reseteando...' : 'Ejecutar Reseteo'}
                  </button>
                </div>
              </>
            )}

            {/* Etapa 3: Éxito */}
            {feedback?.type === 'success' && (
              <>
                <div className="modal-header success">
                  <CheckCircle size={24} />
                  <h2>¡Reseteo Completado!</h2>
                </div>

                <div className="modal-body success-content">
                  <div className="success-message">
                    <CheckCircle size={48} />
                    <p>Todos los datos transaccionales han sido eliminados exitosamente.</p>
                  </div>

                  <div className="success-details">
                    <p>El sistema está listo para comenzar de nuevo.</p>
                    <small>Este modal se cerrará automáticamente...</small>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MasterReset;
