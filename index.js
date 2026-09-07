// index.js
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const express = require('express');
const app = express();
require('dotenv').config();
require('./database/connections');

const RichiestaInattivita = require('./database/models/RichiestaInattivita');
const RichiestaRuolo = require('./database/models/RichiestaRuolo');

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot online');
});

app.listen(PORT, () => {
    console.log(`🌐 Server attivo sulla porta ${PORT}`);
});

// ---------------- CLIENT ----------------
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ---------------- COMANDI ----------------
client.commands = new Collection();
const fs = require('fs');
for (const file of fs.readdirSync('./commands').filter(f => f.endsWith('.js'))) {
    const command = require(`./commands/${file}`);
    if (command.data && command.execute) client.commands.set(command.data.name, command);
}

// ---------------- READY ----------------
client.once('ready', async () => {
    console.log(`✅ Bot online come ${client.user.tag}`);

    // ---------------- RIPRISTINA COLLECTOR SU RICHIESTE INATTIVITÀ ----------------
    const richieste = await RichiestaInattivita.find({});
    for (const r of richieste) {
        try {
            const channel = await client.channels.fetch(r.channelId);
            if (!channel) continue;
            const message = await channel.messages.fetch(r.messageId);
            if (!message) continue;

            const cmd = client.commands.get('richiesta-inattivita');
            if (cmd && cmd.attachCollector) cmd.attachCollector(client, message, r);
        } catch (err) {
            console.log(`⚠️ Impossibile ripristinare collector per inattività: ${r._id}`);
        }
    }

    // ---------------- RIPRISTINA COLLECTOR SU RICHIESTE RUOLO ----------------
    const ruoli = await RichiestaRuolo.find({});
    for (const r of ruoli) {
        try {
            const channel = await client.channels.fetch(r.channelId);
            if (!channel) continue;
            const message = await channel.messages.fetch(r.messageId);
            if (!message) continue;

            const cmd = client.commands.get('richiesta-ruolo');
            if (cmd && cmd.attachCollector) cmd.attachCollector(client, message, r);
        } catch (err) {
            console.log(`⚠️ Impossibile ripristinare collector per ruolo: ${r._id}`);
        }
    }
});

// ---------------- INTERAZIONI ----------------
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);

    } catch (err) {
    console.error(err);

    try {
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({
                content: '❌ Errore durante il comando.'
            });
        } else {
            await interaction.reply({
                content: '❌ Errore durante il comando.',
                ephemeral: true
            });
        }
    } catch {
        console.log('⚠️ Impossibile rispondere: interazione scaduta');
    }
}
});

client.on('messageDelete', async msg => {
    try {
        let message = msg;
        if (message.partial) {
            message = await message.fetch();
        }
        if (!message.guild) return;

        // RICHIESTE INATTIVITÀ
        const richiestaInattivita = await RichiestaInattivita.findOne({ messageId: message.id });
        if (richiestaInattivita) {
            console.log(`🗑️ Messaggio richiesta inattività eliminato: ${message.id}, utente: ${richiestaInattivita.userId}`);
            await RichiestaInattivita.deleteOne({ _id: richiestaInattivita._id });
        }

        // RICHIESTE RUOLO
        const richiestaRuolo = await RichiestaRuolo.findOne({ messageId: message.id });
        if (richiestaRuolo) {
            console.log(`🗑️ Messaggio richiesta ruolo eliminato: ${message.id}, utente: ${richiestaRuolo.userId}`);
            await RichiestaRuolo.deleteOne({ _id: richiestaRuolo._id });
        }
    } catch (err) {
        console.error('Errore gestione messageDelete:', err);
    }
});


// ---------------- LOGIN ----------------
client.login(process.env.TOKEN)