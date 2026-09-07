const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cercapersone')
        .setDescription('Invia un cercapersone al reparto')

        .addStringOption(option =>
            option.setName('priorita')
                .setDescription('Seleziona la priorità')
                .setRequired(true)
                .addChoices(
                    { name: 'Emergenza', value: 'Emergenza' },
                    { name: 'Urgenza', value: 'Urgenza' },
                    { name: 'Consulto non urgente', value: 'Consulto non urgente' }
                )
        )

        .addStringOption(option =>
            option.setName('reparto')
                .setDescription('Seleziona il reparto destinatario')
                .setRequired(true)
                .addChoices(
                    { name: 'U.O.C. Medicina d\'Urgenza e Pronto Soccorso', value: 'ps' },
                    { name: 'U.O.C. Chirurgia', value: 'chirurgia' },
                    { name: 'U.O.C. Medicina Interna', value: 'medicina' },
                    { name: 'U.O.C. Psichiatria', value: 'psichiatria' }
                )
        )

        .addStringOption(option =>
            option.setName('oggetto')
                .setDescription('Oggetto della richiesta')
                .setRequired(true)
        )

        .addStringOption(option =>
            option.setName('note')
                .setDescription('Note aggiuntive')
                .setRequired(false)
        ),

    async execute(interaction) {

        const priorita = interaction.options.getString('priorita');
        const reparto = interaction.options.getString('reparto');
        const oggetto = interaction.options.getString('oggetto');
        const note = interaction.options.getString('note') || 'Nessuna nota aggiuntiva';
        const user = interaction.user;

        // Mapping reparti → canali e ruoli
        const reparti = {
            ps: {
                nome: "U.O.C. Medicina d'Urgenza e Pronto Soccorso",
                canale: "1466161653316845680",
                ruolo: "1138202229338275880"
            },
            chirurgia: {
                nome: "U.O.C. Chirurgia",
                canale: "1466161624082546708",
                ruolo: "1138202231770984498"
            },
            medicina: {
                nome: "U.O.C. Medicina Interna",
                canale: "1466161723642745148",
                ruolo: "1386337090865860658"
            },
            psichiatria: {
                nome: "U.O.C. Psichiatria",
                canale: "1466161797378740376",
                ruolo: "1459657748189937734"
            }
        };

        const repartoData = reparti[reparto];
        const channel = interaction.guild.channels.cache.get(repartoData.canale);

        if (!channel) {
            return interaction.reply({ content: "Canale non trovato.", ephemeral: true });
        }

        // Creazione embed
        const embed = new EmbedBuilder()
            .setTitle("> Cercapersone Reparto - A.O. S. Giacomo")
            .setDescription(`- **Priorità:** ${priorita}
- **Reparto Destinatario:** ${repartoData.nome}
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

\n- **Oggetto:** ${oggetto}
- **Note:** ${note}
\n*Firma,*\n${user.tag}`)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 1024 }))
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 1024 })
            })
            .setColor('Green')
            .setTimestamp();

        // Invio messaggio con ping ruolo
        await channel.send({
            content: `<@&${repartoData.ruolo}>`,
            embeds: [embed]
        });

        // Risposta ephemeral
        await interaction.reply({
            content: "✅ Cerca Persone attivato con successo",
            ephemeral: true
        });
    }
};
