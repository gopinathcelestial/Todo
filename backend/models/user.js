const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: String,
    Fname: String,
    Lname: String,
    profileImg: { type: String}

});

module.exports = mongoose.model('User', userSchema);
