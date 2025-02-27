// src/components/Sidebar.jsx
import { useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ 
  conversations, 
  currentConversation, 
  onSelect, 
  onNew, 
  onRename,
  onProfileClick 
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleRename = (id, currentTitle) => {
    setEditingId(id);
    setEditingTitle(currentTitle);
  };

  const handleSubmitRename = (e) => {
    e.preventDefault();
    if (editingId && editingTitle.trim()) {
      onRename(editingId, editingTitle.trim());
      setEditingId(null);
      setEditingTitle('');
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
      <h1 className="header-title">Yandex GPT</h1>
        <button className="new-chat" onClick={onNew}>
          Новый диалог
        </button>
        <button className="profile-button" onClick={onProfileClick}>
          Профиль
        </button>
      </div>

      <div className="conversations-list">
        {conversations.map(conv => (
          <div 
            key={conv.id}
            className={`conversation-item ${currentConversation?.id === conv.id ? 'active' : ''}`}
            onClick={() => onSelect(conv)}
          >
            {editingId === conv.id ? (
              <form onSubmit={handleSubmitRename}>
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={handleSubmitRename}
                  autoFocus
                />
              </form>
            ) : (
              <div 
                className="conversation-title"
                onDoubleClick={() => handleRename(conv.id, conv.title)}
              >
                {conv.title}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;