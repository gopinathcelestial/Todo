const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const User = require('../models/user');
const Todo = require('../models/todo');


router.get('/users', verifyToken, async (req, res) => {
    try {
        const users = await User.find({}, 'email');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/friend-request/:userId', verifyToken, async (req, res) => {
    try {
        const sender = await User.findOne({ email: req.user.email });
        const receiver = await User.findById(req.params.userId);

        if (!receiver) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (receiver.friendRequests.includes(sender._id)) {
            return res.status(400).json({ message: 'Friend request already sent' });
        }

        receiver.friendRequests.push(sender._id);
        await receiver.save();

        res.json({ message: 'Friend request sent' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/accept-request/:userId', verifyToken, async (req, res) => {
    try {
        const receiver = await User.findOne({ email: req.user.email });
        const sender = await User.findById(req.params.userId);

        if (!sender) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!receiver.friendRequests.includes(sender._id)) {
            return res.status(400).json({ message: 'No friend request from this user' });
        }

        receiver.friendRequests = receiver.friendRequests.filter(id => !id.equals(sender._id));
        receiver.friends.push(sender._id);
        sender.friends.push(receiver._id);

        await receiver.save();
        await sender.save();

        res.json({ message: 'Friend request accepted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/friends', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email }).populate('friends', 'email');
        res.json(user.friends);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/friends/:userId', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email });
        const friend = await User.findById(req.params.userId);

        if (!friend) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.friends = user.friends.filter(id => !id.equals(friend._id));
        friend.friends = friend.friends.filter(id => !id.equals(user._id));

        await user.save();
        await friend.save();

        res.json({ message: 'Friend removed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/share-todo/:todoId/:friendId', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email });
        const friend = await User.findById(req.params.friendId);
        const todo = await Todo.findById(req.params.todoId);

        if (!friend || !todo) {
            return res.status(404).json({ message: 'Friend or Todo not found' });
        }

        if (!user.friends.includes(friend._id)) {
            return res.status(400).json({ message: 'User is not your friend' });
        }

        friend.sharedTodos.push(todo._id);
        await friend.save();

        res.json({ message: 'Todo shared successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;