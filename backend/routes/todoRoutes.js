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
        console.log(req.body)
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


router.get('/todos/:id', verifyToken, (req, res) => {
    const userEmail = req.user.email;
    Todo.findOne({ id: parseInt(req.params.id), userEmail })
        .then((data) => {
            if (data) res.status(200).json(data);
            else res.status(404).send('Todo not found');
        })
        .catch(err => res.status(500).send(err.toString()));
});

router.delete('/todos/:id', verifyToken, (req, res) => {
    const userEmail = req.user.email;
    Todo.deleteOne({ id: parseInt(req.params.id), userEmail })
        .then((result) => {
            if (result.deletedCount === 0) {
                res.status(404).send('Todo not found');
            } else {
                res.status(200).send('Todo deleted successfully');
            }
        })
        .catch(err => res.status(500).send(err.toString()));
});

router.put('/todos/:id', verifyToken, (req, res) => {
    const userEmail = req.user.email;
    Todo.updateOne({ id: parseInt(req.params.id), userEmail }, {
        $set:
        {
            title: req.body.title,
            description: req.body.description,
            isCompleted: req.body.isCompleted,
            dueDate: req.body.dueDate,
            reminderDays: req.body.reminderDays,
            reminderTime: req.body.reminderTime
        }
    })
        .then((data) => {
            if (data.nModified === 0) {
                res.status(404).send('Todo not found');
            } else {
                res.status(200).send('Todo updated successfully');
            }
        })
        .catch(err => res.status(500).send(err.toString()));
});

router.get('/shared-todos', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email }).populate('sharedTodos');
        res.json(user.sharedTodos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;
