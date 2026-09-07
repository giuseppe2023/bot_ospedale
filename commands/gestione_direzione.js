const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const Provvedimento = require('../database/models/Provvedimento');

function formatData() {
    const now = new Date();

    const giorno = String(now.getDate()).padStart(2, '0');
    const mese = String(now.getMonth() + 1).padStart(2, '0');
    const anno = now.getFullYear();

    const ore = String(now.getHours()).padStart(2, '0');
    const minuti = String(now.getMinutes()).padStart(2, '0');

    return `${giorno}/${mese}/${anno} alle ore ${ore}:${minuti}`;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gestione-direzione-sanitaria')
        .setDescription('Registra un provvedimento disciplinare della Direzione')
        .addStringOption(option =>
            option.setName('generalità')
                .setDescription('Nome e Cognome del compilatore')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('qualifica')
                .setDescription('Qualifica')
                .addChoices(
                    { name: 'Direttore Generale', value: 'Direttore Generale' },
                    { name: 'Vice Direttore Generale', value: 'Vice Direttore Generale' },
                    { name: 'Direttore Sanitario', value: 'Direttore Sanitario' },
                    { name: 'Vice Direttore Sanitario', value: 'Vice Direttore Sanitario' },
                    { name: 'Direttore Amministrativo', value: 'Direttore Amministrativo' },
                    { name: 'Vice Direttore Amministrativo', value: 'Vice Direttore Amministrativo' }
                )
                .setRequired(true))
        .addUserOption(option =>
            option.setName('discord')
                .setDescription('Dipendente')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('generalità_dipendente')
                .setDescription('Nome e Cognome del dipendente')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('numero_identificativo')
                .setDescription('Numero identificativo')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('tipo')
                .setDescription('Tipo di provvedimento')
                .addChoices(
                    { name: 'Avvertimento Ufficiale', value: 'Avvertimento Ufficiale' },
                    { name: 'Sospensione Qualifica', value: 'Sospensione Qualifica' },
                    { name: 'Degrado', value: 'Degrado' },
                    { name: 'Radiazione dall’Albo', value: 'Radiazione dall’Albo' },
                    { name: 'Promozione', value: 'Promozione' },
                    { name: 'Licenziamento', value: 'Licenziamento' }
                )
                .setRequired(true))
        .addStringOption(option =>
            option.setName('inizio')
                .setDescription('Data di decorrenza')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo del provvedimento')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('fine')
                .setDescription('Data di scadenza (solo sospensione)')
                .setRequired(false)),

                
    async execute(interaction) {
        const ruoloDirezione = process.env.DIREZIONE;
        const allowedUserId = process.env.UTENTE;

        if (
            !interaction.member.roles.cache.has(ruoloDirezione) &&
            interaction.user.id !== allowedUserId &&
            !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)
        ) return interaction.reply({ content: '❌ Non hai il permesso per eseguire questo comando.', ephemeral: true });

        const generalità = interaction.options.getString('generalità');
        const qualifica = interaction.options.getString('qualifica');
        const dipendente = interaction.options.getUser('discord');
        const generalitàDip = interaction.options.getString('generalità_dipendente');
        const numeroId = interaction.options.getString('numero_identificativo');
        const tipo = interaction.options.getString('tipo');
        const inizio = interaction.options.getString('inizio');
        const fine = interaction.options.getString('fine');
        const motivo = interaction.options.getString('motivo');

        const fineText = tipo === 'Sospensione Qualifica' && fine ? `- **Fino al giorno:** ${fine}\n` : '';

        const embed = new EmbedBuilder()
            .setTitle('> **PROVVEDIMENTO DISCIPLINARE – DIREZIONE SANITARIA**')
            .setDescription(`
*Il sottoscritto,*

- **Nome e Cognome:** ${generalità}
- **Qualifica:** ${qualifica}

*adotta il seguente provvedimento disciplinare nei confronti di:*

- **Nome DS:** ${dipendente.tag}
- **Nome e Cognome:** ${generalitàDip}
- **Numero Identificativo:** ${numeroId}

- **Tipo di provvedimento:** ${tipo}
- **A decorrere dal giorno:** ${inizio}
${fineText}
- **Motivo:**
${motivo}

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

**Firma:** ${interaction.user}
`)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 1024 }))
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 1024 })
            })
            .setColor('Blurple')
            .setTimestamp();

        // 🔹 SALVATAGGIO SU MONGO
        const nuovo = new Provvedimento({
            userId: dipendente.id,
            tipo: 'ufficiale',
            origine: 'gestione_direzione',
            data: formatData(),
            motivo,
            autoreId: interaction.user.id
        });

        await nuovo.save();

        await interaction.reply({ content: `<@${dipendente.id}>`, embeds: [embed] });
    }
};
