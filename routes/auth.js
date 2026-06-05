// routes/auth.js
// ============================================================
//  Authentication Routes – BIT3208
//  Register / Login / Logout using bcryptjs (no cookies for sessions)
//  Session data is stored SERVER-SIDE via express-session
// ============================================================

const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const db       = require('../config/db');

// ── GET /auth/register ───────────────────────────────────────
router.get('/register', (req, res) => {
  res.render('auth/register', { error: null, success: null });
});

// ── POST /auth/register ──────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res.render('auth/register', { error: 'All fields are required.', success: null });
  }
  if (password !== confirmPassword) {
    return res.render('auth/register', { error: 'Passwords do not match.', success: null });
  }
  if (password.length < 6) {
    return res.render('auth/register', { error: 'Password must be at least 6 characters.', success: null });
  }

  try {
    // Check if email already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.render('auth/register', { error: 'Email already registered.', success: null });
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into database
    await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'customer']
    );

    res.render('auth/register', { error: null, success: 'Account created! You can now log in.' });

  } catch (err) {
    console.error('Register error:', err);
    res.render('auth/register', { error: 'Server error. Please try again.', success: null });
  }
});

// ── GET /auth/login ──────────────────────────────────────────
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('auth/login', { error: null });
});

// ── POST /auth/login ─────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('auth/login', { error: 'Please enter email and password.' });
  }

  try {
    // Fetch user from database
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.render('auth/login', { error: 'Invalid email or password.' });
    }

    const user = rows[0];

    // Compare password with hashed version in DB
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render('auth/login', { error: 'Invalid email or password.' });
    }

    // Store user in SERVER-SIDE session (not cookies)
    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };

    // Redirect based on role
    if (user.role === 'admin') return res.redirect('/admin');
    res.redirect('/dashboard');

  } catch (err) {
    console.error('Login error:', err);
    res.render('auth/login', { error: 'Server error. Please try again.' });
  }
});

// ── GET /auth/logout ─────────────────────────────────────────
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
});

module.exports = router;
