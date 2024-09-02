const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema({
    id: Number,
    title: String,
    description: String,
    isCompleted: Boolean,
    dueDate: Date,
    reminderTime: String, 
    reminderDays: [String],
    userEmail: String,
    createdAt: Date,
}, {
    collection: 'todo',
    timestamps: true 
});

module.exports = mongoose.model('Todo', todoSchema);
