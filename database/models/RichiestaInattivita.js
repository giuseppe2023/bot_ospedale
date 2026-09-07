const mongoose = require('mongoose');

const RichiestaInattivitaSchema = new mongoose.Schema({
    messageId: { type: String, required: true },       // ID messaggio embed
    channelId: { type: String, required: true },       // ID canale
    userId: { type: String, required: true },          // ID utente richiedente
    generalità: { type: String, required: true },
    numero_identificativo: { type: String, required: true },
    qualificaId: { type: String, required: true },     // ID ruolo qualifica
    repartoId: { type: String, default: null },        // ID ruolo reparto
    inizio: { type: Date, required: true },           // data inizio inattività
    fine: { type: Date, required: true },             // data fine inattività
    motivo: { type: String, required: true },
    dataInvio: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RichiestaInattivita', RichiestaInattivitaSchema);
