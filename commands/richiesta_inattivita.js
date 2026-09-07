const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const RichiestaInattivita = require('../database/models/RichiestaInattivita');

function parseDate(input) {
    const match = input.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
    if (!match) return null;
    const [, d, m, y] = match;
    return new Date(`${y}-${m}-${d}T00:00:00`);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('richiesta-inattività')
        .setDescription('Invia una richiesta inattività')
        .addStringOption(o => o.setName('generalità').setDescription('Nome e Cognome').setRequired(true))
        .addStringOption(o => o.setName('numero_identificativo').setDescription('Numero identificativo').setRequired(true))
        .addRoleOption(o => o.setName('qualifica').setDescription('Qualifica').setRequired(true))
        .addStringOption(o => o.setName('inizio').setDescription('Data inizio (DD/MM/YYYY)').setRequired(true))
        .addStringOption(o => o.setName('fine').setDescription('Data fine (DD/MM/YYYY)').setRequired(true))
        .addStringOption(o => o.setName('motivo').setDescription('Motivo').setRequired(true))
        .addRoleOption(o => o.setName('reparto').setDescription('Reparto di appartenenza').setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const { generalità, numero_identificativo, inizio, fine, motivo } = Object.fromEntries(interaction.options.data.map(o => [o.name, o.value]));
        const qualifica = interaction.options.getRole('qualifica');
        const reparto = interaction.options.getRole('reparto');

        const inizioDate = parseDate(inizio);
        const fineDate = parseDate(fine);
        if (!inizioDate || !fineDate || fineDate < inizioDate) return interaction.editReply('❌ Date non valide.');

        const timestamp = Math.floor(Date.now() / 1000);

        const embed = new EmbedBuilder()
            .setTitle('> **RICHIESTA DI INATTIVITÀ TEMPORANEA DAL SERVIZIO**')
            .setDescription(`*Il sottoscritto,*
- **Nome e Cognome:** ${generalità}
- **Numero Identificativo:** ${numero_identificativo}
- **Qualifica:** ${qualifica}
- **Reparto di appartenenza:** ${reparto ? `<@&${reparto.id}>` : 'N/A'}
\n*con la presente formula formale richiesta di inattività temporanea dal servizio,*\n
- **A decorrere dal giorno:** ${inizio}
- **Fino al giorno:** ${fine}
\n- **Per il seguente motivo:**\n${motivo}
\n*Il sottoscritto dichiara che, durante il periodo indicato, non svolgerà alcuna attività riconducibile alle proprie mansioni, impegnandosi a riprendere regolarmente il servizio alla data stabilita, salvo diversa comunicazione ufficiale.* 
\n-  **Data della richiesta:** <t:${timestamp}:F>
\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n
**Firma del Richiedente:**\n<@${interaction.user.id}>`)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 1024 }))
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 1024 })
            })
            .setColor('Blurple')
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('accetta').setLabel('Accetta').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('rifiuta').setLabel('Rifiuta').setStyle(ButtonStyle.Danger)
        );

        const channel = await interaction.guild.channels.fetch('1138207899571724368');
        const message = await channel.send({ content: '<@&1412178033275703356>', embeds: [embed], components: [row] });

        const nuovaRichiesta = new RichiestaInattivita({
            messageId: message.id,
            channelId: channel.id,
            userId: interaction.user.id,
            generalità,
            numero_identificativo,
            qualificaId: qualifica.id,
            repartoId: reparto ? reparto.id : null,
            inizio: inizioDate,
            fine: fineDate,
            motivo
        });
        await nuovaRichiesta.save();

        await interaction.editReply('✅ Richiesta inviata con successo.');

        this.attachCollector(interaction.client, message, nuovaRichiesta);
    },

    attachCollector(client, message, richiesta) {
        const collector = message.createMessageComponentCollector({ dispose: true });

        collector.on('collect', async i => {
            const RUOLO_DIREZIONE = process.env.DIREZIONE;
            const allowedUserId = process.env.UTENTE;

            if (!i.member.roles.cache.has(RUOLO_DIREZIONE) && i.user.id !== allowedUserId) {
                return i.reply({ content: '❌ Non hai permesso.', ephemeral: true });
            }

            const embedBase = EmbedBuilder.from(message.embeds[0]);

            if (i.customId === 'accetta') {
                const embedEsito = new EmbedBuilder().setColor('Green').setDescription('✅ Richiesta accettata');

                await i.update({
                    components: [],
                    embeds: [embedBase, embedEsito]
                });

                // 👉 Invio nel secondo canale
                const logChannel = await i.guild.channels.fetch('1455181996182732873');
                await logChannel.send({ embeds: [embedBase, embedEsito] });
            }

            if (i.customId === 'rifiuta') {
                const modal = new ModalBuilder()
                    .setCustomId(`rifiuto_${message.id}`)
                    .setTitle('Motivo del rifiuto')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder().setCustomId('motivo').setLabel('Motivo del rifiuto').setStyle(TextInputStyle.Paragraph).setRequired(true)
                        )
                    );
                await i.showModal(modal);
            }
        });

        client.on('interactionCreate', async modal => {
            if (!modal.isModalSubmit()) return;
            if (!modal.customId.startsWith('rifiuto_')) return;
            const messageId = modal.customId.replace('rifiuto_', '');
            if (message.id !== messageId) return;

            const motivo = modal.fields.getTextInputValue('motivo');
            const embedBase = EmbedBuilder.from(message.embeds[0]);
            const embedEsito = new EmbedBuilder().setColor('Red').setDescription(`❌ Richiesta rifiutata\nMotivo: ${motivo}`);

            await message.edit({
                components: [],
                embeds: [embedBase, embedEsito]
            });

            // 👉 Invio nel secondo canale
            const logChannel = await modal.guild.channels.fetch('1455181996182732873');
            await logChannel.send({ embeds: [embedBase, embedEsito] });

            await modal.reply({ content: 'Rifiuto registrato.', ephemeral: true });
        });
    }
};
