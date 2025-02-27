import { useState, useCallback, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';
import Profile from './components/Profile';
import { supabase } from './lib/supabase';
import { generateChatTitle } from './services/api';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  // Проверяем сессию при загрузке
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadUserData(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadUserData(session.user.id);
      } else {
        // Очищаем данные при выходе
        setApiKey('');
        setConversations([]);
        setCurrentConversation(null);
        setShowProfile(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Загружаем данные пользователя
  const loadUserData = async (userId) => {
    try {
      // Загружаем API ключ
      const { data: profile } = await supabase
        .from('profiles')
        .select('yandex_api_key')
        .eq('id', userId)
        .single();

      if (profile) {
        setApiKey(profile.yandex_api_key);
      }

      // Загружаем историю диалогов
      const { data: conversations } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (conversations) {
        setConversations(conversations);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const createNewConversation = async () => {
    if (!session) return;

    const newConv = {
      id: Date.now().toString(),
      title: 'Новый диалог',
      messages: [],
      user_id: session.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert(newConv)
        .select()
        .single();

      if (error) throw error;

      setConversations([data, ...conversations]);
      setCurrentConversation(data);
      setShowProfile(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const updateConversationTitle = useCallback(async (id, title) => {
    if (!session) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ 
          title,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      const updatedConversations = conversations.map(conv => 
        conv.id === id ? { ...conv, title } : conv
      );
      setConversations(updatedConversations);
    } catch (error) {
      console.error('Error updating conversation title:', error);
    }
  }, [conversations, session]);

  const addMessageToConversation = async (id, message) => {
    if (!session) return;

    try {
      // Обновляем локальное состояние
      const updatedConversations = conversations.map(conv => {
        if (conv.id === id) {
          const updatedMessages = [...conv.messages, message];
          return {
            ...conv,
            messages: updatedMessages,
            updated_at: new Date().toISOString()
          };
        }
        return conv;
      });
      
      setConversations(updatedConversations);
      const updatedCurrentConv = updatedConversations.find(conv => conv.id === id);
      if (updatedCurrentConv) {
        setCurrentConversation(updatedCurrentConv);

        // Сохраняем в базу данных
        const { error } = await supabase
          .from('conversations')
          .update({ 
            messages: updatedCurrentConv.messages,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) throw error;

        // Если это ответ ассистента и это первый обмен сообщениями,
        // генерируем название для диалога
        if (message.role === 'assistant' && updatedCurrentConv.messages.length === 2) {
          const userMessage = updatedCurrentConv.messages[0].content;
          const assistantResponse = message.content;
          
          try {
            const newTitle = await generateChatTitle(apiKey, userMessage, assistantResponse);
            await updateConversationTitle(id, newTitle);
          } catch (error) {
            console.error('Failed to generate chat title:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error adding message:', error);
    }
  };

  const handleAuth = async (key) => {
    setApiKey(key);
  };

  const handleSignOut = () => {
    setSession(null);
  };

  const handleApiKeyChange = (newApiKey) => {
    setApiKey(newApiKey);
  };

  const handleBackToChat = () => {
    setShowProfile(false);
  };

  if (!session) {
    return <Auth onAuth={handleAuth} />;
  }

  if (showProfile) {
    return (
      <div className="app-container">
        <Sidebar 
          conversations={conversations} 
          currentConversation={currentConversation}
          onSelect={(conv) => {
            setCurrentConversation(conv);
            setShowProfile(false);
          }}
          onNew={createNewConversation}
          onRename={updateConversationTitle}
          onProfileClick={() => setShowProfile(true)}
        />
        <Profile 
          session={session}
          onSignOut={handleSignOut}
          onApiKeyChange={handleApiKeyChange}
          onBack={handleBackToChat}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar 
        conversations={conversations} 
        currentConversation={currentConversation}
        onSelect={setCurrentConversation}
        onNew={createNewConversation}
        onRename={updateConversationTitle}
        onProfileClick={() => setShowProfile(true)}
      />
      <ChatInterface 
        apiKey={apiKey}
        conversation={currentConversation}
        onSendMessage={(message) => {
          if (currentConversation) {
            addMessageToConversation(currentConversation.id, {
              role: 'user',
              content: message,
              timestamp: new Date().toISOString()
            });
          }
        }}
        onReceiveResponse={(response) => {
          if (currentConversation) {
            addMessageToConversation(currentConversation.id, {
              role: 'assistant',
              content: response,
              timestamp: new Date().toISOString()
            });
          }
        }}
      />
    </div>
  );
}

export default App;