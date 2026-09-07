const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { creaDocumentoSpecializzazione } = require('../google/docs-specializzazione');

const THREAD_ESITI_ID = '1457507413023260855'; // thread specializzazioni
const FORUM_ID = '1455660596975501356'; // forum specializzazioni
const TAG_ID = '1460006808281288963';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('esito-specializzazione')
        .setDescription('Pubblica l’esito di una specializzazione')
        .addStringOption(o =>
            o.setName('nome')
                .setDescription('Nome studente')
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName('specializzazione')
                .setDescription('Nome della specializzazione')
                .addChoices(
                    {
                        name: "Medicina d'Emergenza-Urgenza",
                        value: "Medicina d'Emergenza-Urgenza"
                    },
                    {
                        name: 'Medicina Interna',
                        value: 'Medicina Interna'
                    },
                    {
                        name: 'Chirurgia',
                        value: 'Chirurgia'
                    },
                    {
                        name: 'Psichiatria',
                        value: 'Psichiatria'
                    }
                )
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName('data')
                .setDescription('Data esame')
                .setRequired(true)
        )
        .addUserOption(o =>
            o.setName('studente')
                .setDescription('Seleziona studente')
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName('luogo_nascita')
                .setDescription('Luogo di nascita')
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName('data_nascita')
                .setDescription('Data di nascita')
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName('esito')
                .setDescription('Esito')
                .addChoices(
                    {
                        name: 'Passato',
                        value: 'Passato'
                    },
                    {
                        name: 'Non Passato',
                        value: 'Non Passato'
                    }
                )
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName('voto')
                .setDescription('Voto (es. 60/70)')
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        // ------------------ CONTROLLO PERMESSI ------------------
        const allowedRoles = [
            process.env.DOCENTE,
            process.env.DIREZIONE
        ];

        const hasRole = interaction.member.roles.cache.some(
            r => allowedRoles.includes(r.id)
        );

        if (
            !hasRole &&
            !interaction.member.permissions.has(
                PermissionsBitField.Flags.Administrator
            )
        ) {
            return interaction.editReply({
                content: '❌ Non autorizzato.'
            });
        }

        // ------------------ DATI STUDENTE ------------------
        const studente = interaction.options.getUser('studente');

        // ------------------ CREAZIONE RECORD ------------------
        const record = {
            nome: interaction.options.getString('nome'),
            luogo_nascita: interaction.options.getString('luogo_nascita'),
            data_nascita: interaction.options.getString('data_nascita'),
            nome_specializzazione: interaction.options.getString('specializzazione'),
            data_rilascio: interaction.options.getString('data'),
            docente: interaction.user.tag,
            registratoDa: interaction.user.id
        };

        const esito = interaction.options.getString('esito');
        const voto = interaction.options.getString('voto') || 'N/D';

        // ------------------ DOCUMENTO + THREAD SOLO SE PASSATO ------------------
        if (esito === 'Passato') {

            // ------------------ CREAZIONE DOCUMENTO ------------------
            try {
                const url = await creaDocumentoSpecializzazione(
                    record,
                    record.docente
                );

                record.documento = url;

            } catch (err) {
                console.error(
                    'Errore nella creazione del documento specializzazione:',
                    err
                );

                return interaction.editReply({
                    content: '❌ Errore nella creazione del documento.'
                });
            }

            // ------------------ EMBED SPECIALIZZAZIONE ------------------
            const embed = new EmbedBuilder()
                .setTitle('Nuova specializzazione registrata')
                .setColor('Gold')
                .addFields(
                    {
                        name: 'Studente',
                        value: record.nome
                    },
                    {
                        name: 'Luogo di nascita',
                        value: record.luogo_nascita
                    },
                    {
                        name: 'Data di nascita',
                        value: record.data_nascita
                    },
                    {
                        name: 'Specializzazione',
                        value: record.nome_specializzazione
                    },
                    {
                        name: 'Data rilascio',
                        value: record.data_rilascio
                    },
                    {
                        name: 'Docente',
                        value: record.docente
                    },
                    {
                        name: 'Documento',
                        value: `[Apri Documento](${record.documento})`
                    }
                )
                .setTimestamp();

            // ------------------ THREAD SPECIALIZZAZIONE ------------------
            try {
                const forum = await interaction.guild.channels.fetch(FORUM_ID);

                await forum.threads.create({
                    name: `Specializzazione - ${record.nome}`,
                    type: 11,
                    appliedTags: [TAG_ID],
                    message: {
                        embeds: [embed]
                    }
                });

            } catch (err) {
                console.error(
                    'Errore nella creazione del thread specializzazione:',
                    err
                );

                return interaction.editReply({
                    content: '❌ Documento creato, ma si è verificato un errore nella creazione del thread.'
                });
            }
        }

        // ------------------ EMBED ESITO ------------------
        const embedEsiti = new EmbedBuilder()
            .setDescription(
`> **Esito Esame Specializzazione - ${record.data_rilascio}**

*Di seguito vengono comunicati gli esiti degli esami eseguiti in data ${record.data_rilascio},*

> ***\`${record.nome_specializzazione}:\`***
- ${studente} - ${record.nome} ||${esito}, ${voto}||`
            )
            .setColor(esito === 'Passato' ? 'Green' : 'Red');

        // ------------------ THREAD ESITI ------------------
        const thread = await interaction.guild.channels
            .fetch(THREAD_ESITI_ID)
            .catch(() => null);

        if (!thread) {
            return interaction.editReply({
                content: '❌ Thread esiti non trovato o accesso negato.'
            });
        }

        // ------------------ PUBBLICAZIONE ESITO ------------------
        await thread.send({
            embeds: [embedEsiti]
        });

        // ------------------ CONFERMA ------------------
        await interaction.editReply({
            content: '✅ Esito pubblicato correttamente.'
        });
    }
};