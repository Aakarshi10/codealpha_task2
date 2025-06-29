const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Connect MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/social_app', { useNewUrlParser: true, useUnifiedTopology: true });

// ✅ Define User model directly
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String
});
const User = mongoose.model('User', userSchema);

// ✅ Define Post model directly
const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String
}, { timestamps: true });
const Post = mongoose.model('Post', postSchema);

// 🔐 Register
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ username, password: hashed });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Username might be taken' });
  }
});

// 🔐 Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const isMatch = await bcrypt.compare(password, user.password);
  if (isMatch) {
    const token = jwt.sign({ userId: user._id }, 'secretkey');
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// 📝 Create post
app.post('/api/posts', async (req, res) => {
  const { token, text } = req.body;
  try {
    const decoded = jwt.verify(token, 'secretkey');
    const post = await Post.create({ user: decoded.userId, text });
    res.json(post);
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// 📄 Get all posts
app.get('/api/posts', async (req, res) => {
  const posts = await Post.find().populate('user', 'username').sort({ createdAt: -1 });
  res.json(posts);
});

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
