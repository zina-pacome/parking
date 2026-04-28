require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://parking-oj7a-24iyq78n5-zina-pacomes-projects.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true
}));
app.use(express.json());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Trop de requêtes, réessaie dans 15 minutes' }
}));

// Routes
app.use('/api/dashboard',  require('./routes/dashboard.routes'));
app.use('/api/auth',    require('./routes/auth.routes'));
app.use('/api/entrees', require('./routes/entrees.routes'));
app.use('/api/places',  require('./routes/places.routes'));
app.use('/api/paiements', require('./routes/paiements.routes'));
app.use('/api/reservations', require('./routes/reservations.routes'));
app.use('/api/utilisateurs', require('./routes/utilisateurs.routes'));
app.get('/api/ping', (req, res) => {
  res.json({ message: 'Serveur OK', date: new Date() });
});

app.listen(PORT, async () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
  try {
    const pool = require('./config/db');
    await pool.query('SELECT 1');
    console.log('✅ Connecté à MySQL !');
  } catch (err) {
    console.error('❌ Erreur MySQL :', err.message);
  }

  // Démarrer les tâches automatiques
  require('./utils/cron')();
});
app.use('/api/historique', require('./routes/historique.routes'));
