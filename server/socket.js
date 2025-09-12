const Message = require('./models/message.model');
const Conversation = require('./models/conversation.model');

let onlineUsers = [];

const addNewUser = (userId, socketId) => {
  !onlineUsers.some((user) => user.userId === userId) &&
    onlineUsers.push({ userId, socketId });
};

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return onlineUsers.find((user) => user.userId === userId);
};

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Add user to online users list
    socket.on('addUser', (userId) => {
      addNewUser(userId, socket.id);
      io.emit('getUsers', onlineUsers);
    });

    // Join a conversation room
    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${socket.id} joined conversation ${conversationId}`);
    });

    // Handle sending messages
    socket.on('sendMessage', async ({ senderId, conversationId, content }) => {
      try {
        // Save message to database
        const newMessage = new Message({
          conversationId,
          sender: senderId,
          content,
        });
        const savedMessage = await newMessage.save();

        // Update the conversation's last message
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: savedMessage._id,
        });

        // Get the conversation to find the participants
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          // Emit the message to all participants in the conversation room
          io.to(conversationId).emit('getMessage', savedMessage);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        // Optionally, emit an error event back to the sender
        socket.emit('sendMessageError', { error: 'Failed to send message' });
      }
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      removeUser(socket.id);
      io.emit('getUsers', onlineUsers);
    });
  });
};

module.exports = socketHandler;
