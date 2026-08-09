import React, { useState, useEffect, useRef, useContext } from 'react';
import { MessageSquare, Send, X, ShieldAlert } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import api from '../../utils/api';

export default function ChatWidget({ orderId, deliveryPartnerId }) {
  const { user } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef(null);

  // Load chat history and join room
  useEffect(() => {
    if (!orderId || !socket) return;

    const fetchHistory = async () => {
      try {
        const res = await api.get(`/orders/${orderId}/chat`);
        if (res.data.success) {
          setMessages(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };

    fetchHistory();

    // Join room
    socket.emit('joinChatRoom', { orderId });

    // Listen for new messages
    const handleNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (!isOpen && msg.sender._id !== user?._id) {
        setUnreadCount((c) => c + 1);
      }
    };

    socket.on('receiveChatMessage', handleNewMessage);

    return () => {
      socket.off('receiveChatMessage', handleNewMessage);
    };
  }, [orderId, socket, isOpen]);

  // Scroll to bottom on updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;

    socket.emit('sendChatMessage', {
      orderId,
      message: inputText,
      senderId: user?._id,
      senderRole: user?.role === 'delivery_partner' ? 'delivery_partner' : 'customer',
    });

    setInputText('');
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
      // Mark read API
      api.post(`/orders/${orderId}/chat`).catch(console.error);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="w-80 h-96 bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col mb-4 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-[#FF6B00] px-4 py-3 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="text-xs font-black tracking-tight">Delivery Chat</span>
            </div>
            <button onClick={toggleOpen} className="hover:opacity-85 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-neutral-800">
            {messages.length === 0 ? (
              <div className="text-center text-neutral-500 py-12 text-[10px] space-y-1">
                <ShieldAlert className="w-8 h-8 mx-auto text-neutral-600 mb-1" />
                <p>Chat is secured end-to-end.</p>
                <p>Send a message to coordinate delivery.</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.sender._id === user?._id;
                return (
                  <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] text-neutral-500 mb-0.5 px-1">{msg.sender.name}</span>
                    <div className={`px-3 py-2 rounded-2xl text-xs max-w-[85%] break-words ${isMe ? 'bg-[#FF6B00] text-white rounded-tr-none' : 'bg-neutral-800 text-neutral-200 rounded-tl-none'}`}>
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer */}
          <form onSubmit={handleSendMessage} className="p-3 bg-neutral-950 border-t border-neutral-800 flex gap-2">
            <input
              type="text"
              placeholder="Type your message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6B00] transition-colors"
            />
            <button type="submit" className="bg-[#FF6B00] hover:bg-[#e05e00] text-white p-2 rounded-xl transition-colors shrink-0">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Trigger Button */}
      <button
        onClick={toggleOpen}
        className="bg-[#FF6B00] hover:bg-[#e05e00] text-white p-4 rounded-full shadow-2xl flex items-center justify-center relative transition-transform hover:scale-105"
      >
        <MessageSquare className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-neutral-950">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
