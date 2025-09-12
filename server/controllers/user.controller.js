const User = require('../models/user.model');

exports.getUsers = async (req, res) => {
  try {
    // We get the current user's ID from the auth middleware
    const currentUserId = req.user.id;

    // Find all users except the current one
    const users = await User.find({ _id: { $ne: currentUserId } }).select('-password');

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching users.', error: error.message });
  }
};
