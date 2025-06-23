import React from 'react';
import { ADMIN_UTILS } from '../utils/constants';

interface AdminIndicatorProps {
  isAdminMode: boolean;
}

/**
 * Componente para mostrar el indicador de modo admin y permitir cambio fácil
 */
export const AdminIndicator: React.FC<AdminIndicatorProps> = ({ isAdminMode }) => {
  const handleToggleMode = () => {
    if (isAdminMode) {
      // Cambiar a modo cliente
      window.location.href = ADMIN_UTILS.getClientUrl();
    } else {
      // Cambiar a modo admin
      window.location.href = ADMIN_UTILS.getAdminUrl();
    }
  };

  if (!isAdminMode) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleToggleMode}
          className="bg-gray-800 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors duration-200 shadow-lg opacity-60 hover:opacity-100"
          title="Activar modo admin"
        >
          🔧
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium shadow-lg">
        <div className="flex items-center gap-1">
          <span>🔧</span>
          <button
            onClick={handleToggleMode}
            className="bg-purple-700 hover:bg-purple-800 px-1 rounded text-xs transition-colors duration-200"
            title="Cambiar a modo cliente"
          >
            👤
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminIndicator; 