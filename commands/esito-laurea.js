const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { creaDocumentoLaurea } = require('../google/docs-laurea');

const FORUM_ID = '1455660358093115443'; // forum lauree
const TAG_ID = '1459997845896827046';
const THREAD_ESITI_ID = '1328012082251169833'; // thread esiti laurea

module.exports = {
    data: new SlashCommandBuilder()
        .setName('esito-laurea')
        .setDescription('Pubblica l’esito di un esame di laurea')
        .addStringOption(o => o.setName('nome').setDescription('Nome studente').setRequired(true))
        .addStringOption(o => o.setName('data_nascita').setDescription('Data di nascita (gg/mm/aaaa)').setRequired(true))
        .addStringOption(o => o.setName('luogo_nascita').setDescription('Luogo di nascita').setRequired(true))
        .addStringOption(o =>
            o.setName('tipo_laurea')
                .setDescription('Tipo di laurea')
                .addChoices(
                    { name: 'Medicina e Chirurgia', value: 'Medicina e Chirurgia' },
                    { name: 'Infermieristica', value: 'Infermieristica' }
                )
                .setRequired(true)
        )
        .addStringOption(o => o.setName('data').setDescription('Data esame').setRequired(true))
        .addUserOption(o => o.setName('studente').setDescription('Studente').setRequired(true))
        .addStringOption(o =>
            o.setName('esito')
                .setDescription('Esito')
                .addChoices(
                    { name: 'Passato', value: 'Passato' },
                    { name: 'Non Passato', value: 'Non Passato' }
                )
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName('voto')
                .setDescription('Voto (es. 30/35)')
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const allowedRoles = [process.env.DOCENTE, process.env.DIREZIONE];
        const hasRole = interaction.member.roles.cache.some(r => allowedRoles.includes(r.id));

        if (!hasRole && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.editReply({ content: '❌ Non autorizzato.' });
        }

        const studente = interaction.options.getUser('studente');

        // ✅ RECORD IDENTICO A "registra-laurea"
        const record = {
            nome: interaction.options.getString('nome'),
            luogo_nascita: "N/D", // non presente nel comando → fallback
            data_nascita: "N/D",  // non presente nel comando → fallback
            tipo_laurea: interaction.options.getString('tipo_laurea'),
            data_rilascio: interaction.options.getString('data'),
            docente: interaction.user.tag,
            registratoDa: interaction.user.id
        };

        const esito = interaction.options.getString('esito');
        const voto = interaction.options.getString('voto') || 'N/D';

        // ------------------ DOCUMENTO SOLO SE PASSATO ------------------
        if (esito === 'Passato') {
            try {
                const url = await creaDocumentoLaurea(record, record.docente);
                record.documento = url;
            } catch (err) {
                console.error(err);
                return interaction.editReply({ content: '❌ Errore nella creazione del documento.' });
            }

            // ------------------ EMBED LAUREA ------------------
            const embed = new EmbedBuilder()
                .setTitle('Nuova laurea registrata')
                .setColor('Green')
                .addFields(
                    { name: 'Studente', value: record.nome },
                    { name: 'Luogo di nascita', value: record.luogo_nascita },
                    { name: 'Data di nascita', value: record.data_nascita },
                    { name: 'Esame Abilitante', value: `Esame Abilitante in **${record.tipo_laurea}**` },
                    { name: 'Data rilascio', value: record.data_rilascio },
                    { name: 'Docente', value: record.docente },
                    { name: 'Documento', value: `[Apri Documento](${record.documento})` }
                )
                .setTimestamp();

            const forum = await interaction.guild.channels.fetch(FORUM_ID);

            await forum.threads.create({
                name: `Laurea - ${record.nome}`,
                type: 11,
                appliedTags: [TAG_ID],
                message: { embeds: [embed] }
            });
        }

        // ------------------ EMBED ESITO ------------------
        const embedEsito = new EmbedBuilder()
            .setDescription(
`> **Esito Esami - ${record.data_rilascio}**

*Di seguito vengono comunicati gli esiti degli esami eseguiti in data ${record.data_rilascio},*

> ***\`Corso di ${record.tipo_laurea}:\`***
- ${studente} - ${record.nome} ||${esito}, ${voto}||

*Invitiamo tutti i passati a iniziare a visionare le specializzazioni.*`
            )
            .setColor(esito === 'Passato' ? 'Green' : 'Red');

        const thread = await interaction.guild.channels.fetch(THREAD_ESITI_ID).catch(() => null);

        if (!thread) {
            return interaction.editReply({ content: '❌ Thread esiti non trovato o accesso negato.' });
        }

        await thread.send({ embeds: [embedEsito] });

        await interaction.editReply({ content: '✅ Esito pubblicato correttamente.' });
    }
};