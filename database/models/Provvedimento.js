const mongoose = require('mongoose');
require('../connections');

const provvedimentoSchema = new mongoose.Schema({
    userId: String,
    tipo: String,
    origine: String,
    data: String, // ✅ SOLO QUESTO
    motivo: String,
    autoreId: String
});

module.exports = mongoose.model('Provvedimento', provvedimentoSchema);