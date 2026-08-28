const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const store = require('../data/store');
const { generateToken, authenticate } = require('../middleware/auth');

// Rate limiting to protect against brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 auth attempts per windowMs
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/login', authLimiter, (req, res) => {
  try {
    let { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    username = String(username).trim();
    const users = store.getAll('users');
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Support both bcrypt hashes and legacy plaintext fallback
    const isMatch = user.password.startsWith('$2')
      ? bcrypt.compareSync(password, user.password)
      : user.password === password;

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken(userWithoutPassword);
    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Authentication service error' });
  }
});

router.get('/me', authenticate, (req, res) => {
  try {
    const users = store.getAll('users');
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User profile not found' });
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

router.post('/signup', authLimiter, (req, res) => {
  try {
    let { username, password, name, role } = req.body;
    
    // Validate required fields & types
    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Full Name, Username, and Password are required fields' });
    }

    username = String(username).trim().toLowerCase();
    name = String(name).trim();
    password = String(password);

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    if (name.length < 2 || name.length > 60) {
      return res.status(400).json({ error: 'Full Name must be between 2 and 60 characters' });
    }
    
    // Check if username already exists  
    const users = store.getAll('users');
    if (users.find(u => u.username.toLowerCase() === username)) {
      return res.status(409).json({ error: 'An account with this username already exists. Please choose another or login.' });
    }
    
    // Only allow citizen and volunteer roles for self-registration (admins created via seed or admin panel)
    const validRole = (role === 'volunteer') ? 'volunteer' : 'citizen';
    
    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = {
      id: `u${Date.now()}`,
      username,
      password: hashedPassword,
      role: validRole,
      name
    };
    
    store.add('users', newUser);
    const { password: _, ...userWithoutPassword } = newUser;
    const token = generateToken(userWithoutPassword);
    res.status(201).json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error('Error during signup:', err);
    res.status(500).json({ error: 'Registration failed due to a server error' });
  }
});

module.exports = router;
