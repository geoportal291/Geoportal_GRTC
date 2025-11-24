import React, { useState, useEffect, useRef } from 'react';
import './ChatAnonimo.css';

export default function ChatAnonimo({ onClose }) {
  const [messages, setMessages] = useState([
    { id: 1, text: '¡Hola! Me gustan mucho las ideas de tu lista de deseos.', sender: 'self' },
    { id: 2, text: '¡Qué bueno que te gusten! Gracias por el mensaje, amigo secreto :)', sender: 'other' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;

    const newMsg = {
      id: Date.now(),
      text: newMessage,
      sender: 'self'
    };
    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');

    // Simular respuesta del amigo secreto
    setTimeout(() => {
      const replyMsg = {
        id: Date.now() + 1,
        text: '¡Entendido! Gracias por la pista ;)',
        sender: 'other'
      };
      setMessages(prev => [...prev, replyMsg]);
    }, 1500);
  };

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-window" onClick={(e) => e.stopPropagation()}>
        <header className="chat-header">
          <h3><i className="fas fa-mask"></i> Mensajes con tu Amigo Secreto</h3>
          <button className="chat-close-btn" onClick={onClose}>&times;</button>
        </header>

        <div className="chat-body">
          {messages.map(msg => (
            <div key={msg.id} className={`message-bubble-container ${msg.sender === 'self' ? 'self' : 'other'}`}>
              <div className="message-bubble">
                <p className="message-text">{msg.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <footer className="chat-footer">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Escribe un mensaje anónimo..."
          />
          <button onClick={handleSendMessage}>
            <i className="fas fa-paper-plane"></i>
          </button>
        </footer>
      </div>
    </div>
  );
}
