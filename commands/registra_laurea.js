const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionsBitField,
    MessageFlags
} = require('discord.js');

const { creaDocumentoLaurea } = require('../google/docs-laurea');

const FORUM_ID = '1455660358093115443';
const TAG_ID = '1459997845896827046';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('registra-laurea')
        .setDescription('Registra una laurea')
        .addStringOption(o =>
            o.setName('nome')
             .setDescription('Nome e Cognome studente')
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
            o.setName('tipo_laurea')
             .setDescription('Tipo di laurea')
             .addChoices(
                 { name: 'Medicina e Chirurgia', value: 'Medicina e Chirurgia' },
                 { name: 'Infermieristica', value: 'Infermieristica' }
             )
             .setRequired(true)
        )
        .addStringOption(o =>
            o.setName('data_rilascio')
             .setDescription('Data esame / rilascio')
             .setRequired(true)
        )
        .addStringOption(o =>
            o.setName('voto')
             .setDescription('Voto ottenuto')
             .setRequired(true)
        )
        .addUserOption(o =>
            o.setName('docente')
             .setDescription('Docente')
             .setRequired(true)
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply({
                flags: MessageFlags.Ephemeral
            });

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

            const docente = interaction.options.getUser('docente');

            const record = {
                nome: interaction.options.getString('nome'),
                luogo_nascita: interaction.options.getString('luogo_nascita'),
                data_nascita: interaction.options.getString('data_nascita'),
                tipo_laurea: interaction.options.getString('tipo_laurea'),
                data_rilascio: interaction.options.getString('data_rilascio'),
                voto: interaction.options.getString('voto'),
                docente: docente.tag,
                registratoDa: interaction.user.id
            };

            const url = await creaDocumentoLaurea(
                record,
                docente.tag
            );

            record.documento = url;

            const embed = new EmbedBuilder()
                .setTitle('Nuova laurea registrata')
                .setColor('Green')
                .addFields(
                    { name: 'Studente', value: record.nome },
                    { name: 'Luogo di nascita', value: record.luogo_nascita },
                    { name: 'Data di nascita', value: record.data_nascita },
                    {
                        name: 'Esame Abilitante',
                        value: `Esame Abilitante in **${record.tipo_laurea}**`
                    },
                    { name: 'Data rilascio', value: record.data_rilascio },
                    { name: 'Voto ottenuto', value: record.voto },
                    { name: 'Docente', value: record.docente },
                    {
                        name: 'Documento',
                        value: `[Apri Documento](${record.documento})`
                    }
                )
                .setTimestamp();

            const forum = await interaction.guild.channels.fetch(FORUM_ID);

            if (!forum) {
                return interaction.editReply({
                    content: '❌ Forum lauree non trovato.'
                });
            }

            await forum.threads.create({
                name: `Laurea - ${record.nome}`,
                appliedTags: [TAG_ID],
                message: {
                    embeds: [embed]
                }
            });

            await interaction.editReply({
                content: '✅ Laurea registrata e pubblicata correttamente.'
            });

        } catch (err) {
            console.error(err);

            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({
                        content:
                            '❌ Errore durante la registrazione della laurea.'
                    });
                }
            } catch (replyError) {
                console.error(
                    '⚠️ Impossibile rispondere: interazione scaduta',
                    replyError
                );
            }
        }
    }
};