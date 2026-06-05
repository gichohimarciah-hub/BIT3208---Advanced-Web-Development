// server.js
// ============================================================
//  SmartShop – Node.js + Express + MySQL
//  BIT3208: Advanced Web Design and Development
//  Lecturer: Lec Nyoro
// ============================================================

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path    = require('path');
const db      = require('./config/db');   // ← triggers connection test on start

const app = express();

// ── View Engine ───────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Middleware ────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));   // parse form POST bodies
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session stored SERVER-SIDE (no cookies for session data)
app.use(session({
  secret:            process.env.SESSION_SECRET,
  resave:            false,
  saveUninitialized: false,
  cookie: {
    secure:   false,   // set true when using HTTPS in production
    httpOnly: true,    // prevents JS access to session cookie
    maxAge:   1000 * 60 * 60 * 2  // 2 hours
  }
}));

// Make session user available in all EJS templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// ── Routes ────────────────────────────────────────────────────
const authRoutes      = require('./routes/auth');
const productRoutes   = require('./routes/products');
const dashboardRoutes = require('./routes/dashboard');

app.use('/auth',      authRoutes);
app.use('/products',  productRoutes);
app.use('/',          dashboardRoutes);

// ── Home Page ─────────────────────────────────────────────────
app.get('/', async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products LIMIT 6');
    res.render('index', { products });
  } catch (err) {
    res.render('index', { products: [] });
  }
});

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found.' });
});

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 SmartShop running at http://localhost:${PORT}`);
  console.log(`📦 BIT3208 – Advanced Web Design and Development\n`);
});
