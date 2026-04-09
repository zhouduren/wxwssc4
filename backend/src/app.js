require('dotenv').config();
const express = require('express');
const cors = require('cors');
const auth = require('./middleware/auth');
const errorHandler = require('./middleware/error');
const { ok } = require('./utils/http');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const reviewRoutes = require('./routes/reviews');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));

app.get('/health', (req, res) => ok(res, { now: Date.now() }));
app.use('/api/auth', authRoutes);

app.use('/api', auth('user'), productRoutes);
app.use('/api', auth('user'), cartRoutes);
app.use('/api', auth('user'), orderRoutes);
app.use('/api', auth('user'), reviewRoutes);
app.use('/api', auth('user'), messageRoutes);

app.use('/api/admin', auth('merchant'), adminRoutes);

app.use(errorHandler);

module.exports = app;
