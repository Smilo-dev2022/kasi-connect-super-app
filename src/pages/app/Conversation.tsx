import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import AppHeader from '@/components/AppHeader';
import api from '@/lib/api';
import { socket } from '@/lib/socket';
import { Send } from 'lucide-react';
import jwt_decode from 'jwt-decode';

interface Message {
  _id: string;
  sender: {
    _id: string;
    username: string;
  };
  content: string;
  createdAt: string;
}

interface DecodedToken {
  id: string;
}

const Conversation = () => {
  const { id: conversationId } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken: DecodedToken = jwt_decode(token);
      setCurrentUserId(decodedToken.id);
    }
  }, []);

  useEffect(() => {
    if (conversationId) {
      const fetchMessages = async () => {
        try {
          const response = await api.get(`/conversations/${conversationId}/messages`);
          setMessages(response.data);
        } catch (error) {
          console.error('Failed to fetch messages', error);
        }
      };
      fetchMessages();

      socket.connect();
      socket.emit('joinConversation', conversationId);

      socket.on('getMessage', (message: Message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });

      return () => {
        socket.off('getMessage');
        socket.disconnect();
      };
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && currentUserId && conversationId) {
      socket.emit('sendMessage', {
        senderId: currentUserId,
        conversationId,
        content: newMessage,
      });
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <AppHeader title="Conversation" />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`flex items-end gap-2 ${
              message.sender._id === currentUserId ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.sender._id !== currentUserId && (
              <Avatar className="w-8 h-8">
                <AvatarFallback>{message.sender.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            )}
            <div
              className={`max-w-xs md:max-w-md p-3 rounded-lg ${
                message.sender._id === currentUserId
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 bg-background border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <Button type="submit" size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Conversation;
