// src/components/ChatInterface.jsx
import { useState, useEffect, useRef } from 'react';
import { Oval } from 'react-loader-spinner';
import { sendMessageToYandexGPT } from '../services/api';
import './ChatInterface.css';

const ChatInterface = ({ apiKey, conversation, onSendMessage, onReceiveResponse }) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messageListRef = useRef(null);
  const [pendingMessage, setPendingMessage] = useState(null);
  
  useEffect(() => {
    if (conversation?.messages && pendingMessage) {
      const hasMessage = conversation.messages.some(
        msg => msg.timestamp === pendingMessage.timestamp
      );
      if (hasMessage) {
        setPendingMessage(null);
      }
    }
  }, [conversation?.messages]);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [conversation?.messages, pendingMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !conversation) return;
    
    const userMessage = message;
    setMessage('');
    
    const newMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    
    setPendingMessage(newMessage);
    onSendMessage(userMessage);
    
    setIsLoading(true);
    try {
      const history = conversation.messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        text: msg.content
      }));
      
      const response = await sendMessageToYandexGPT(apiKey, {
        messages: [
          ...history,
          { role: 'user', text: userMessage }
        ]
      });
      
      if (response && response.result && response.result.alternatives && response.result.alternatives.length > 0) {
        const gptResponse = response.result.alternatives[0].message.text;
        onReceiveResponse(gptResponse);
      } else {
        onReceiveResponse('Извините, произошла ошибка при получении ответа.');
      }
    } catch (error) {
      console.error('Error sending message to Yandex GPT:', error);
      onReceiveResponse('Ошибка API: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!conversation) {
    return (
      <div className="chat-container">
        <div className="welcome-message">
          <h2>Добро пожаловать в Yandex GPT приложение</h2>
          <p>Создайте новый диалог или выберите существующий, чтобы начать общение с ИИ.</p>
        </div>
      </div>
    );
  }

  const displayMessages = [...(conversation?.messages || [])];
  if (pendingMessage && !displayMessages.some(msg => msg.timestamp === pendingMessage.timestamp)) {
    displayMessages.push(pendingMessage);
  }

  // Сортируем сообщения по timestamp
  displayMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return (
    <div className="chat-container">
      <div className="message-list" ref={messageListRef}>
        {displayMessages.map((msg, index) => (
          <div key={`${msg.timestamp}-${index}`} className={`message-bubble ${msg.role}`}>
            {msg.content}
            <span className={`timestamp ${msg.role}`}>{formatTime(msg.timestamp)}</span>
          </div>
        ))}
        
        {isLoading && (
          <div className="loading-container">
            <Oval
              height={30}
              width={30}
              color="#6b7280"
              secondaryColor="#d1d5db"
              strokeWidth={4}
              strokeWidthSecondary={4}
            />
          </div>
        )}
      </div>
      
      <div className="input-container">
        <textarea
          className="chat-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Введите сообщение..."
          disabled={isLoading}
        />
        <button 
          className="send-button"
          onClick={sendMessage} 
          disabled={isLoading || !message.trim()}
        >
          ▶
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
