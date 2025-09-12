import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppHeader from '@/components/AppHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Users, Shield, MessageCircle, Star } from 'lucide-react';
import api from '@/lib/api';

interface User {
  _id: string;
  username: string;
  email: string;
}

const Chats = () => {
  const [users, setUsers] = useState<User[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Failed to fetch users', error);
      }
    };

    fetchUsers();
  }, []);

  const handleCreateConversation = async (userId: string) => {
    try {
      const response = await api.post('/conversations', { receiverId: userId });
      // Navigate to the conversation page
      navigate(`/app/conversation/${response.data._id}`);
    } catch (error) {
      console.error('Failed to create conversation', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
      <AppHeader title="Chats" showSearch={true} />

      <div className="p-4 space-y-4">
        <Button variant="hero" className="w-full justify-center gap-2 py-6">
          <Plus className="w-5 h-5" />
          Start New Chat
        </Button>

        {/* User List */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground mb-4">Users</h3>
          {users.map((user) => (
            <Card
              key={user._id}
              className="p-4 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => handleCreateConversation(user._id)}
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{user.username}</h3>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Chats;