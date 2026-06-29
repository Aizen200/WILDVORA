import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function useAuthGuard() {
  const { user } = useAuth();
  const [promptVisible, setPromptVisible] = useState(false);

  const requireAuth = (action) => (...args) => {
    if (user) {
      action?.(...args);
    } else {
      setPromptVisible(true);
    }
  };

  const hidePrompt = () => setPromptVisible(false);

  return { requireAuth, promptVisible, hidePrompt };
}
