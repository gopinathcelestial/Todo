const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { z } = require('zod');
const { verifyToken } = require('../middlewares/auth');

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });

router.post('/signup', async (req, res) => {
    try {
        const { email, password } = signupSchema.parse(req.body);
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/signin', async (req, res) => {
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
        const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie("authorization", `Bearer ${token}`, {
            httpOnly: true,
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          });
          return res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/signout', (req, res) => {
    res.clearCookie('authorization');
    res.status(200).json({ message: 'Signout successful' });
});

router.get('/isloggedin', verifyToken, (req, res) => {
    try {
      const { email, token } = req.user;
      const toastMessage = token
      ? `You are already logged in as ${email}. Sign out to switch accounts.`
      : 'Please sign in to access your account.';
      res.status(200).json({ isLoggedIn: true, email , toastMessage});
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

module.exports = router;
