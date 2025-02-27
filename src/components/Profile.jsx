import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './Profile.css';

const Profile = ({ session, onSignOut, onApiKeyChange }) => {
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Получаем API ключ из профиля
      const { data: profile } = await supabase
        .from('profiles')
        .select('yandex_api_key')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setApiKey(profile.yandex_api_key);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Ошибка при загрузке данных пользователя');
    }
  };

  const handleApiKeyUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage('');

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          yandex_api_key: apiKey,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      setSuccessMessage('API ключ успешно обновлен');
      setIsEditing(false);
      onApiKeyChange(apiKey);
    } catch (error) {
      console.error('Error updating API key:', error);
      setError('Ошибка при обновлении API ключа');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      onSignOut();
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Ошибка при выходе из системы');
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-box">
        <h2>Профиль пользователя</h2>
        
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        
        <div className="profile-info">
          <div className="info-group">
            <label>Email:</label>
            <span>{session.user.email}</span>
          </div>
          
          <div className="info-group">
            <label>API ключ Yandex GPT:</label>
            {isEditing ? (
              <form onSubmit={handleApiKeyUpdate}>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                />
                <div className="button-group">
                  <button type="submit" disabled={loading}>
                    {loading ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsEditing(false)}
                    className="secondary"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            ) : (
              <>
                <span>••••••••</span>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="secondary"
                >
                  Изменить
                </button>
              </>
            )}
          </div>
        </div>
        
        <button 
          onClick={handleSignOut}
          className="sign-out"
        >
          Выйти
        </button>
      </div>
    </div>
  );
};

export default Profile; 