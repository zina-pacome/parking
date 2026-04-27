const cron        = require('node-cron');
const { annulerExpirees } = require('../controllers/reservations.controller');

module.exports = () => {
  // Toutes les 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('🕐 Vérification des réservations expirées...');
    await annulerExpirees();
  });

  console.log('✅ Tâches automatiques démarrées');
};