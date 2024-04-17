const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');
const client = new MongoClient('mongodb+srv://gopinath9teen98:pdrJivmoytgmtHHm@cluster0.ynio3.mongodb.net/')
const cookieParser = require('cookie-parser');

client.connect()
    .then(() => console.log('Connected Successfully'))
    .catch(error => console.log('Failed to connect', error))

mongoose.connect('mongodb+srv://gopinath9teen98:pdrJivmoytgmtHHm@cluster0.ynio3.mongodb.net/')
const todoSchemaS = new mongoose.Schema({
    id: Number,
    title: String,
    description: String,
    isCompleted: Boolean,
    userEmail: String
}, {
    collection: 'todo'
})
const TodoSchema = mongoose.model('todo', todoSchemaS)

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: String
});
const User = mongoose.model('User', userSchema);

const app = express();
const port = 3000;
const JWT_TOKEN = "jwtsecretkey";
app.use(bodyParser.json());
app.use(cookieParser());


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ email: user.email }, JWT_TOKEN, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true });
        res.status(200).json({ message: 'Signin successful' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/signout', (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Signout successful' });
});

const verifyToken = (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(403).json({ message: 'Token is not provided' });
        }
        jwt.verify(token, JWT_TOKEN, (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            req.user = {
                email: decoded.email,
                token
            };
            next();
        });
    } catch (error) {
        res.status(403).json({ message: 'Error: ' + error });
    }
};

app.get('/todos', verifyToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        console.log(userEmail)
        const todos = await TodoSchema.find({ userEmail });
        res.json(todos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/secureRoute', verifyToken, (req, res) => {
    res.status(200).json({ message: 'Secure route accessed successfully' });
});


app.post('/todos', verifyToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const { title, description, isCompleted } = req.body;
        const todo = new TodoSchema({
            id: Math.floor(Math.random() * 10000000000),
            title,
            description,
            isCompleted,
            userEmail
        });
        const savedTodo = await todo.save();
        res.status(201).json(savedTodo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/todos/:id', verifyToken, (req, res) => {
    const userEmail = req.user.email;
    TodoSchema.findOne({ id: parseInt(req.params.id), userEmail })
        .then((data) => {
            if (data) res.status(200).json(data);
            else res.status(404).send('Todo not found');
        })
        .catch(err => res.status(500).send(err.toString()));
});

app.delete('/todos/:id', verifyToken, (req, res) => {
    const userEmail = req.user.email;
    TodoSchema.deleteOne({ id: parseInt(req.params.id), userEmail })
        .then((result) => {
            if (result.deletedCount === 0) {
                res.status(404).send('Todo not found');
            } else {
                res.status(200).send('Todo deleted successfully');
            }
        })
        .catch(err => res.status(500).send(err.toString()));
});

app.put('/todos/:id', verifyToken, (req, res) => {
    const userEmail = req.user.email;
    TodoSchema.updateOne({ id: parseInt(req.params.id), userEmail }, {
        $set:
        {
            title: req.body.title,
            description: req.body.description,
            isCompleted: req.body.isCompleted
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


app.listen(port, () => {
    console.log('server is running in ' + port)
})

module.exports = app;








