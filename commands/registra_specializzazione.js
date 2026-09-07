const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { creaDocumentoSpecializzazione } = require('../google/docs-specializzazione');

const FORUM_ID = '1455660596975501356'; // forum specializzazioni
const TAG_ID = '1460006808281288963';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('registra-specializzazione')
        .setDescription('Registra una specializzazione')
        .addStringOption(o => o.setName('nome').setDescription('Nome e Cognome studente').setRequired(true))
        .addStringOption(o => o.setName('luogo_nascita').setDescription('Luogo di nascita').setRequired(true))
        .addStringOption(o => o.setName('data_nascita').setDescription('Data di nascita').setRequired(true))
        .addStringOption(o => 
            o.setName('nome_specializzazione')
             .setDescription('Nome della specializzazione')
             .addChoices(
                 { name: "Medicina d'Emergenza-Urgenza", value: "Medicina d'Emergenza-Urgenza" },
                 { name: "Medicina Interna", value: "Medicina Interna" },
                 { name: "Chirurgia", value: "Chirurgia" },
                 { name: "Psichiatria", value: "Psichiatria" }
             )
             .setRequired(true)
        )
        .addStringOption(o => o.setName('data_rilascio').setDescription('Data rilascio specializzazione').setRequired(true))
        .addUserOption(o => o.setName('docente').setDescription('Docente che rilascia la specializzazione').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const allowedRoles = [process.env.DOCENTE, process.env.DIREZIONE];
        const hasRole = interaction.member.roles.cache.some(r => allowedRoles.includes(r.id));

        if (!hasRole && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.editReply({ content: '❌ Non autorizzato.' });
        }

        const docente = interaction.options.getUser('docente');

        const record = {
            nome: interaction.options.getString('nome'),
            luogo_nascita: interaction.options.getString('luogo_nascita'),
            data_nascita: interaction.options.getString('data_nascita'),
            nome_specializzazione: interaction.options.getString('nome_specializzazione'),
            data_rilascio: interaction.options.getString('data_rilascio'),
            docente: docente.tag,
            registratoDa: interaction.user.id
        };

        // ------------------ CREAZIONE DOCUMENTO ------------------
        try {
            const url = await creaDocumentoSpecializzazione(record, docente.tag);
            record.documento = url;
        } catch (err) {
            console.error(err);
            return interaction.editReply({ content: '❌ Errore nella creazione del documento.' });
        }

        // ------------------ EMBED SPECIALIZZAZIONE ------------------
        const embed = new EmbedBuilder()
            .setTitle('Nuova specializzazione registrata')
            .setColor('Gold')
            .addFields(
                { name: 'Studente', value: record.nome },
                { name: 'Luogo di nascita', value: record.luogo_nascita },
                { name: 'Data di nascita', value: record.data_nascita },
                { name: 'Specializzazione', value: record.nome_specializzazione },
                { name: 'Data rilascio', value: record.data_rilascio },
                { name: 'Docente', value: record.docente },
                { name: 'Documento', value: `[Apri Documento](${record.documento})` }
            )
            .setTimestamp();

        // ------------------ THREAD SPECIALIZZAZIONE ------------------
        const forum = await interaction.guild.channels.fetch(FORUM_ID);

        await forum.threads.create({
            name: `Specializzazione - ${record.nome}`,
            type: 11,
            appliedTags: [TAG_ID],
            message: { embeds: [embed] }
        });

        await interaction.editReply({ content: '✅ Specializzazione registrata e pubblicata correttamente.' });
    }
};