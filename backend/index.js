const express = require('express');
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(error => console.error('Failed to connect to MongoDB:', error));

// Routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/api', require('./routes/todoRoutes'));

app.listen(port, () => {
    console.log('Server is running on port', port);
});
