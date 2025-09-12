const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversation.controller');
const authMiddleware = require('../middleware/auth.middleware');

// All routes in this file are protected
router.use(authMiddleware);

router.post('/', conversationController.createConversation);
router.get('/', conversationController.getUserConversations);
router.get('/:conversationId/messages', conversationController.getMessagesForConversation);

module.exports = router;
