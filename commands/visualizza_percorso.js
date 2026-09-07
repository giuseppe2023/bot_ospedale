const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const LAUREE_PATH = path.join(__dirname, '..', 'lauree.json');
const SPEC_PATH = path.join(__dirname, '..', 'specializzazioni.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('visualizza-percorso_formativo')
        .setDescription('Visualizza il percorso formativo di uno studente')
        .addUserOption(o =>
            o.setName('utente')
                .setDescription('Studente da visualizzare (direzione)')
                .setRequired(false)
        ),

    async execute(interaction) {

        // ───── RUOLI ─────
        const STUDENTI = ['1290684213418528838', '1290684322034090014'];
        const isStudente = interaction.member.roles.cache.some(r => STUDENTI.includes(r.id));
        const isDirezione = interaction.member.roles.cache.has(process.env.DIREZIONE);
        const isUtenteAutorizzato = interaction.user.id === process.env.UTENTE;

        if (!isStudente && !isDirezione && !isUtenteAutorizzato) {
            return interaction.reply({ content: '❌ Non autorizzato.', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('utente') || interaction.user;

        // ───── CARICA DB ─────
        const lauree = fs.existsSync(LAUREE_PATH)
            ? JSON.parse(fs.readFileSync(LAUREE_PATH, 'utf8'))
            : [];

        const specializzazioni = fs.existsSync(SPEC_PATH)
            ? JSON.parse(fs.readFileSync(SPEC_PATH, 'utf8'))
            : [];

        const laureeUtente = lauree.filter(l => l.studenteId === targetUser.id);
        const specUtente = specializzazioni.filter(s => s.studenteId === targetUser.id);

        if (laureeUtente.length === 0 && specUtente.length === 0) {
            return interaction.reply({
                content: '❌ Nessun percorso formativo registrato.',
                ephemeral: true
            });
        }

        // ───── EMBED LAUREE ─────
        const laureeEmbed = new EmbedBuilder()
            .setTitle('🎓 Sezione Universitaria')
            .setColor('Green')
            .setTimestamp();

        if (laureeUtente.length === 0) {
            laureeEmbed.setDescription('Nessuna laurea registrata.');
        } else {
            laureeUtente.forEach(l => {
                laureeEmbed.addFields(
                    { name: 'Esame Abilitante', value: `Esame Abilitante in **${l.laurea}**` },
                    { name: 'Risultato', value: l.risultato },
                    { name: 'Punteggio conseguito', value: l.punteggio },
                    { name: '\u200B', value: '**Tirocinio Universitario**' },
                    { name: 'UOC di riferimento', value: l.uoc },
                    { name: 'Ore completate', value: `${l.ore_completate} su ${l.ore_totali}` },
                    { name: 'Documento', value: l.documento ? `[Apri Documento](${l.documento})` : 'N/D' },
                    { name: '\u200B', value: '━━━━━━━━━━━━━━' }
                );
            });
        }

        // ───── EMBED SPECIALIZZAZIONI ─────
        const specEmbed = new EmbedBuilder()
            .setTitle('🏥 Sezione di Specializzazione')
            .setColor('Gold')
            .setTimestamp();

        if (specUtente.length === 0) {
            specEmbed.setDescription('Nessuna specializzazione registrata.');
        } else {
            specUtente.forEach(s => {
                specEmbed.addFields(
                    { name: 'Tirocinio di Specializzazione', value: s.specializzazione },
                    { name: 'UOC di riferimento', value: s.uoc },
                    { name: 'Ore completate', value: `${s.ore_completate} su ${s.ore_totali}` },
                    { name: '\u200B', value: '**Esame di Specializzazione**' },
                    { name: 'Risultato', value: s.risultato },
                    { name: 'Punteggio finale', value: s.punteggio },
                    { name: 'Documento', value: s.documento ? `[Apri Documento](${s.documento})` : 'N/D' },
                    { name: '\u200B', value: '━━━━━━━━━━━━━━' }
                );
            });
        }

        // ───── BOTTONI ─────
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('lauree')
                .setLabel('🎓 Lauree')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(laureeUtente.length === 0),
            new ButtonBuilder()
                .setCustomId('spec')
                .setLabel('🏥 Specializzazioni')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(specUtente.length === 0)
        );

        const message = await interaction.reply({
            embeds: [laureeUtente.length > 0 ? laureeEmbed : specEmbed],
            components: [row],
            ephemeral: true,
            fetchReply: true
        });

        // ───── COLLECTOR ─────
        const collector = message.createMessageComponentCollector({ time: 120000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: '❌ Non puoi usare questi pulsanti.', ephemeral: true });
            }

            if (i.customId === 'lauree') {
                row.components[0].setDisabled(true);
                row.components[1].setDisabled(false);
                await i.update({ embeds: [laureeEmbed], components: [row] });
            }

            if (i.customId === 'spec') {
                row.components[0].setDisabled(false);
                row.components[1].setDisabled(true);
                await i.update({ embeds: [specEmbed], components: [row] });
            }
        });

        collector.on('end', async () => {
            row.components.forEach(b => b.setDisabled(true));
            await message.edit({ components: [row] });
        });
    }
};
