// routes/dashboard.js
// ============================================================
//  Dashboard & Admin Routes – BIT3208
// ============================================================

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/auth/login');
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/dashboard');
  }
  next();
}

// ── GET /dashboard ────────────────────────────────────────────
router.get('/', requireLogin, async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products LIMIT 6');
    const [orders]   = await db.query(
      'SELECT o.*, COUNT(oi.id) as item_count FROM orders o LEFT JOIN order_items oi ON o.id=oi.order_id WHERE o.user_id=? GROUP BY o.id ORDER BY o.created_at DESC LIMIT 5',
      [req.session.user.id]
    );
    res.render('dashboard', { user: req.session.user, products, orders });
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Dashboard error.' });
  }
});

// ── GET /admin ────────────────────────────────────────────────
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const [products]     = await db.query('SELECT * FROM products ORDER BY created_at DESC');
    const [users]        = await db.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    const [orders]       = await db.query('SELECT o.*, u.name as customer FROM orders o JOIN users u ON o.user_id=u.id ORDER BY o.created_at DESC');
    const [[{ total }]]  = await db.query('SELECT SUM(total) as total FROM orders WHERE status != "pending"');
    res.render('admin', { user: req.session.user, products, users, orders, revenue: total || 0 });
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Admin panel error.' });
  }
});

module.exports = router;
