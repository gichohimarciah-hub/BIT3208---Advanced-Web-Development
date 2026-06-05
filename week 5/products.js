// routes/products.js
// ============================================================
//  Product Routes – CRUD operations – BIT3208
// ============================================================

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// Middleware: require login
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/auth/login');
  next();
}

// Middleware: require admin
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).render('error', { message: 'Access denied. Admins only.' });
  }
  next();
}

// ── GET /products ─────────────────────────────────────────────
// Public product listing
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    let query  = 'SELECT * FROM products WHERE 1=1';
    let params = [];

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    const [products]   = await db.query(query, params);
    const [categories] = await db.query('SELECT DISTINCT category FROM products');

    res.render('products/index', {
      products,
      categories,
      search:   search   || '',
      category: category || '',
      user:     req.session.user || null
    });
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Could not load products.' });
  }
});

// ── GET /products/:id ─────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.render('error', { message: 'Product not found.' });
    res.render('products/show', { product: rows[0], user: req.session.user || null });
  } catch (err) {
    res.render('error', { message: 'Error loading product.' });
  }
});

// ── GET /products/admin/new ───────────────────────────────────
router.get('/admin/new', requireAdmin, (req, res) => {
  res.render('products/form', { product: null, error: null, user: req.session.user });
});

// ── POST /products/admin/create ───────────────────────────────
router.post('/admin/create', requireAdmin, async (req, res) => {
  const { name, description, price, stock, category } = req.body;
  if (!name || !price) {
    return res.render('products/form', { product: null, error: 'Name and price are required.', user: req.session.user });
  }
  try {
    await db.query(
      'INSERT INTO products (name, description, price, stock, category) VALUES (?, ?, ?, ?, ?)',
      [name, description, price, stock || 0, category]
    );
    res.redirect('/admin');
  } catch (err) {
    res.render('products/form', { product: null, error: 'Error saving product.', user: req.session.user });
  }
});

// ── GET /products/admin/edit/:id ──────────────────────────────
router.get('/admin/edit/:id', requireAdmin, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.render('error', { message: 'Product not found.' });
  res.render('products/form', { product: rows[0], error: null, user: req.session.user });
});

// ── POST /products/admin/update/:id ──────────────────────────
router.post('/admin/update/:id', requireAdmin, async (req, res) => {
  const { name, description, price, stock, category } = req.body;
  try {
    await db.query(
      'UPDATE products SET name=?, description=?, price=?, stock=?, category=? WHERE id=?',
      [name, description, price, stock, category, req.params.id]
    );
    res.redirect('/admin');
  } catch (err) {
    res.render('error', { message: 'Error updating product.' });
  }
});

// ── POST /products/admin/delete/:id ──────────────────────────
router.post('/admin/delete/:id', requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.redirect('/admin');
  } catch (err) {
    res.render('error', { message: 'Error deleting product.' });
  }
});

module.exports = router;
