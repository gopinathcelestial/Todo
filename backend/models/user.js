const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: String,
    Fname: String,
    Lname: String,
    profileImg: String,
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sharedTodos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Todo' }]
    

});

module.exports = mongoose.model('User', userSchema);