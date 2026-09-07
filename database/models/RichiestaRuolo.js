const mongoose = require('mongoose');

const RichiestaRuoloSchema = new mongoose.Schema({
    messageId: { type: String, required: true },
    channelId: { type: String, required: true },
    userId: { type: String, required: true },
    ruoloRichiesto: { type: String, required: true },

    generalita: { type: String, required: true },
    nascita: { type: String, required: true },
    proveUrl: { type: String },

    dataInvio: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RichiestaRuolo', RichiestaRuoloSchema);

