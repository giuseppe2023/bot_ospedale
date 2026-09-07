const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('attivazione-peimaf')
        .setDescription('Attiva il protocollo PEIMAF'),

    async execute(interaction) {

        const user = interaction.user;

        // Tutti i reparti
        const reparti = [
            {
                nome: "U.O.C. Medicina d'Urgenza e Pronto Soccorso",
                canale: "1466161653316845680",
                ruolo: "1138202229338275880"
            },
            {
                nome: "U.O.C. Chirurgia",
                canale: "1466161624082546708",
                ruolo: "1138202231770984498"
            },
            {
                nome: "U.O.C. Medicina Interna",
                canale: "1466161723642745148",
                ruolo: "1386337090865860658"
            },
            {
                nome: "U.O.C. Psichiatria",
                canale: "1466161797378740376",
                ruolo: "1459657748189937734"
            }
        ];

        // Creazione embed
        const embed = new EmbedBuilder()
            .setTitle("> Attivazione P.E.I.M.A.F. - A.O. S. Giacomo")
            .setColor('Red')
            .setDescription(`- **Priorità:** Emergenza
- **Reparto Destinatario:** Tutti i Reparti
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
\n**Tutto il personale disponibile deve presentarsi immediatamente secondo il piano aziendale PEIMAF.
Seguite le istruzioni dei coordinatori di reparto.
Questa comunicazione ha carattere prioritario e vincolante.
Nessun intervento ulteriore deve essere intrapreso senza indicazioni del coordinamento.**
\n*Firma,*\n${user.tag}`)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 1024 }))
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 1024 })
            })
            .setColor('Red')
            .setTimestamp();

        // Invio in tutti i canali
        for (const reparto of reparti) {

            const channel = interaction.guild.channels.cache.get(reparto.canale);
            if (!channel) continue;

            await channel.send({
                content: `<@&${reparto.ruolo}>`,
                embeds: [embed]
            });
        }

        // Risposta ephemeral
        await interaction.reply({
            content: "✅ Attivazione PEIMAF inviata a tutti i reparti",
            ephemeral: true
        });
    }
};
