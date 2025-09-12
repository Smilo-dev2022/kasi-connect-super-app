const Conversation = require('../models/conversation.model');
const Message = require('../models/message.model');

// Create a new conversation
exports.createConversation = async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.user.id;

  if (!receiverId) {
    return res.status(400).json({ message: 'Receiver ID is required.' });
  }

  try {
    // Check if a conversation between these two users already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (conversation) {
      // If conversation exists, return it
      return res.status(200).json(conversation);
    }

    // If not, create a new one
    const newConversation = new Conversation({
      participants: [senderId, receiverId],
    });

    const savedConversation = await newConversation.save();
    res.status(201).json(savedConversation);
  } catch (error) {
    res.status(500).json({ message: 'Server error while creating conversation.', error: error.message });
  }
};

// Get all conversations for a user
exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', '-password')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching conversations.', error: error.message });
  }
};

// Get all messages for a conversation
exports.getMessagesForConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversationId }).populate('sender', '-password');
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching messages.', error: error.message });
  }
};
