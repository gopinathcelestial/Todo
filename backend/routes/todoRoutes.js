const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const Todo = require('../models/todo');
const todoNotifier = require('../middlewares/eventScheduler');
const User = require('../models/user');



todoNotifier.setupSSERoute(router);

router.get('/todos', verifyToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const todos = await Todo.find({ userEmail });
        res.json(todos);
        process.nextTick(() => todoNotifier.scheduleTodoNotification(todos));

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.post('/todos', verifyToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const createdAt = new Date();
        const { title, description, isCompleted, dueDate, reminderTime, reminderDays } = req.body;
        const todo = new Todo({
            id: Math.floor(Math.random() * 10000000000),
            title,
            description,
            isCompleted: false,
            dueDate,
            reminderTime,
            reminderDays,
            userEmail,
            createdAt,
        });
        const savedTodo = await todo.save();
        res.status(201).json(savedTodo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.get('/todos/:id', verifyToken, async (req, res) => {
    try {
        const todo = await Todo.findOne({ id: parseInt(req.params.id), userEmail: req.user.email });
        if (todo) res.status(200).json(todo);
        else res.status(404).send('Todo not found');
    } catch (error) {
        res.status(500).send(error.toString());
    }
});


router.delete('/todos/:id', verifyToken, async (req, res) => {
    try {
        const result = await Todo.deleteOne({ id: parseInt(req.params.id), userEmail: req.user.email });
        if (result.deletedCount === 0) res.status(404).send('Todo not found');
        else res.status(200).send('Todo deleted successfully');
    } catch (error) {
        res.status(500).send(error.toString());
    }
});


router.put('/todos/:id', verifyToken, async (req, res) => {
    try {
        const result = await Todo.updateOne(
            { id: parseInt(req.params.id), userEmail: req.user.email },
            {
                $set: req.body
            }
        );
        if (result.nModified === 0) res.status(404).send('Todo not found');
        else res.status(200).send('Todo updated successfully');
    } catch (error) {
        res.status(500).send(error.toString());
    }
});


router.get('/shared-todos/:userId', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email }).populate('sharedTodos');
        res.json(user.sharedTodos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
