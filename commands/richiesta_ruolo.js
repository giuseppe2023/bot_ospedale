const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    PermissionsBitField
} = require('discord.js');

const RUOLO_DIREZIONE = '1412178033275703356'; // Ruolo Direzione
const RUOLO_SEMPRE = '1294378768688873553'; // Ruolo sempre dato se accettata
const RUOLI_CONSENTITI = [
    '1290684322034090014',
    '1290684213418528838'
]; // Ruoli che possono essere richiesti

const allowedUserId = process.env.UTENTE;
const RichiestaRuolo = require('../database/models/RichiestaRuolo');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('richiesta-ruolo')
        .setDescription('Invia una richiesta ruolo')
        .addStringOption(o => o.setName('generalità').setDescription('Nome e Cognome').setRequired(true))
        .addStringOption(o => o.setName('nascita').setDescription('Data di nascita').setRequired(true))
        .addRoleOption(o => o.setName('ruolo').setDescription('Ruolo richiesto').setRequired(true))
        .addAttachmentOption(o => o.setName('prove').setDescription('Eventuali prove').setRequired(false)),

    async execute(interaction) {
        const generalita = interaction.options.getString('generalità');
        const nascita = interaction.options.getString('nascita');
        const ruoloRichiesto = interaction.options.getRole('ruolo');
        const prove = interaction.options.getAttachment('prove');

        // ❌ Validazione ruolo
        if (!RUOLI_CONSENTITI.includes(ruoloRichiesto.id)) {
            return interaction.reply({ content: '❌ Puoi richiedere solo i ruoli autorizzati.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: false });

        const embed = new EmbedBuilder()
            .setTitle('📌 Nuova Richiesta Ruolo')
            .setColor('Blurple')
            .setDescription(
                `**Nome e Cognome:** ${generalita}\n` +
                `**Data di nascita:** ${nascita}\n` +
                `**Ruolo richiesto:** <@&${ruoloRichiesto.id}>\n` +
                `**Prove:** ${prove ? `[Apri file](${prove.url})` : '—'}\n\n` +
                `**Richiedente:** <@${interaction.user.id}>`
            )
            .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 1024 }))
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 1024 })
            })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('accetta_ruolo').setLabel('Accetta').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('rifiuta_ruolo').setLabel('Rifiuta').setStyle(ButtonStyle.Danger)
        );

        // Manda il messaggio vero nel canale (ping incluso)
const message = await interaction.editReply({
    content: `<@&${RUOLO_DIREZIONE}>`,
    embeds: [embed],
    components: [row],
    allowedMentions: { roles: [RUOLO_DIREZIONE] },
    fetchReply: true
});

        // Salva richiesta su Mongo
        const richiesta = await RichiestaRuolo.create({
            messageId: message.id,
            channelId: message.channel.id,
            userId: interaction.user.id,
            ruoloRichiesto: ruoloRichiesto.id,
            generalita,
            nascita,
            proveUrl: prove?.url || null
        });

        // Attacca il collector
        this.attachCollector(interaction.client, message, richiesta);
    },

    attachCollector(client, message, richiesta) {
        const collector = message.createMessageComponentCollector({ dispose: true });

        collector.on('collect', async i => {
            if (
                !i.member.roles.cache.has(RUOLO_DIREZIONE) &&
                !i.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
                i.user.id !== allowedUserId
            ) return i.reply({ content: '❌ Non hai il permesso.', ephemeral: true });

            const embedBase = message.embeds[0];

            // ✅ Accetta
            if (i.customId === 'accetta_ruolo') {
                await i.deferUpdate();

                const guild = i.guild;
                const member = await guild.members.fetch(richiesta.userId).catch(() => null);
                if (!member) return;

                // Gestisci nickname
                const nuovoNick = richiesta.generalita;
                await member.setNickname(nuovoNick).catch(() => {});
                

                // Ruolo sempre dato
                await member.roles.add(RUOLO_SEMPRE).catch(() => {});
                // Ruolo richiesto (già validato)
                await member.roles.add(richiesta.ruoloRichiesto).catch(() => {});

                await message.edit({
                    components: [],
                    embeds: [
                        embedBase,
                        new EmbedBuilder().setColor('Green').setDescription('✅ Richiesta accettata')
                    ]
                });

                await RichiestaRuolo.deleteOne({ _id: richiesta._id });
            }

            // ❌ Rifiuta
            if (i.customId === 'rifiuta_ruolo') {
                const modal = new ModalBuilder()
                    .setCustomId(`rifiuto_ruolo_${message.id}`)
                    .setTitle('Motivo del rifiuto')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('motivo')
                                .setLabel('Motivo del rifiuto')
                                .setStyle(TextInputStyle.Paragraph)
                                .setRequired(true)
                        )
                    );
                await i.showModal(modal);
            }
        });

        // Modal rifiuto
        const modalListener = async modal => {
            if (!modal.isModalSubmit()) return;
            if (modal.customId !== `rifiuto_ruolo_${message.id}`) return;

            await modal.deferReply({ ephemeral: true });

            const motivo = modal.fields.getTextInputValue('motivo');
            const embedBase = message.embeds[0];

            await message.edit({
                components: [],
                embeds: [
                    embedBase,
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription(`❌ Richiesta rifiutata\n**Motivo:** ${motivo}`)
                ]
            });

            await RichiestaRuolo.deleteOne({ _id: richiesta._id });
            await modal.editReply({ content: 'Rifiuto registrato.' });
        };

        // Evita di registrare più volte lo stesso listener
        client.on('interactionCreate', modalListener);
    }
};
