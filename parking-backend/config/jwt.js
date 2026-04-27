module.exports = {
  secret: process.env.JWT_SECRET || 'ParkingSecretMada2026!',
  expire: process.env.JWT_EXPIRE || '8h',
};