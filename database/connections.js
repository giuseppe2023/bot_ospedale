const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ Connesso a MongoDB'))
.catch(err => console.error('❌ Errore connessione MongoDB:', err));

module.exports = mongoose;
