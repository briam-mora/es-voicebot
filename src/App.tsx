import VoiceBot from './components/VoiceBot'
import AdminIndicator from './components/AdminIndicator'
import { ADMIN_UTILS } from './utils/constants'
import { useState, useEffect } from 'react'

function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);

  useEffect(() => {
    const adminMode = ADMIN_UTILS.isAdminMode();
    setIsAdminMode(adminMode);
  }, []);

  return (
    <div className="w-full h-screen bg-white dark:bg-gray-900">
      <VoiceBot />
      <AdminIndicator isAdminMode={isAdminMode} />
    </div>
  )
}

export default App 