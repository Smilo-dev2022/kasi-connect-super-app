const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

// This route is protected and requires a valid JWT
router.get('/', authMiddleware, userController.getUsers);

module.exports = router;
