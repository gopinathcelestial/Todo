const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema({
    id: Number,
    title: String,
    description: String,
    isCompleted: Boolean,
    dueDate: Date,
    reminderTime: String, 
    reminderDays: [String],
    userEmail: String
}, {
    collection: 'todo'
});

module.exports = mongoose.model('Todo', todoSchema);
