import { useState } from 'react';
import { supabase } from '../lib/supabase';
import './Auth.css';

const Auth = ({ onAuth }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Регистрация
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              yandex_api_key: apiKey
            }
          }
        });

        if (signUpError) throw signUpError;

        // Создаем профиль вручную
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              yandex_api_key: apiKey
            }
          ]);

        if (profileError) throw profileError;

        onAuth(apiKey);
      } else {
        // Вход
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        // Получаем данные пользователя после успешной авторизации
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('yandex_api_key')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        
        onAuth(profile.yandex_api_key);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{isSignUp ? 'Регистрация' : 'Вход'}</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="apiKey">API ключ Yandex GPT</label>
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
            </div>
          )}
          
          <button type="submit" disabled={loading}>
            {loading ? 'Загрузка...' : (isSignUp ? 'Зарегистрироваться' : 'Войти')}
          </button>
        </form>
        
        <button 
          className="switch-mode" 
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
        </button>
      </div>
    </div>
  );
};

export default Auth; 