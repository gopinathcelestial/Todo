const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const Todo = require('../models/todo');
const schedule = require('node-schedule');
var cron = require('node-cron');

function scheduleTodoNotification(res, todo) {
    let cronExpression = new Date(2024, 6, 28, 12, 20, 0);
    const rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [0, new schedule.Range(4, 6)];
    rule.hour = 11;
    rule.minute = 54;

    const job = cron.schedule(cronExpression, async function () {
        console.log('Testing todo')
        res.write(`data: ${JSON.stringify({ message: 'Testing Todo' })}\n\n`);
    });
}

let todosLocal = []

router.get('/sseevents', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Credentials', 'true');


    res.write(`data: ${JSON.stringify({ message: 'Hello from server!' })}\n\n`);
    // setInterval(() => {
    //     if(todosLocal.length>0){
            scheduleTodoNotification(res)
    //     }
    // }, 2000);

    req.on('close', () => {
        res.end();
    });
});

router.get('/todos', verifyToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const todos = await Todo.find({ userEmail });
        // todosLocal = todos
        res.json(todos);

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

module.exports = router;
