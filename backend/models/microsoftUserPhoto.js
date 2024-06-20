// models/UserPhoto.js
const mongoose = require('mongoose');

const UserPhotoSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    photo: { type: Buffer, required: true },
    contentType: { type: String, required: true }
});

module.exports = mongoose.model('microsoftUserPhoto', UserPhotoSchema);
