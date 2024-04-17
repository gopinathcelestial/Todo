const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema({
    id: Number,
    title: String,
    description: String,
    isCompleted: Boolean,
    userEmail: String
}, {
    collection: 'todo'
});

module.exports = mongoose.model('Todo', todoSchema);
