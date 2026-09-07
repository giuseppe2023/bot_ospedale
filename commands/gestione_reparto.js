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
        .setName('gestione-reparto')
        .setDescription('Registra un provvedimento interno di reparto')
        .addStringOption(option =>
            option.setName('generalità')
                .setDescription('Nome e Cognome del compilatore')
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
                    { name: 'Assunzione', value: 'Assunzione' },
                    { name: 'Avvertimento Interno', value: 'Avvertimento Interno' },
                    { name: 'Degrado', value: 'Degrado' },
                    { name: 'Licenziamento Reparto', value: 'Licenziamento Reparto' }
                )
                .setRequired(true))
        .addStringOption(option =>
            option.setName('inizio')
                .setDescription('Data di decorrenza')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo del provvedimento')
                .setRequired(true)),

    async execute(interaction) {
        const ruoloResponsabile = '1290682814265561179';
        const allowedUserId = process.env.UTENTE;

        if (
            !interaction.member.roles.cache.has(ruoloResponsabile) &&
            interaction.user.id !== allowedUserId &&
            !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)
        ) return interaction.reply({ content: '❌ Non hai il permesso per eseguire questo comando.', ephemeral: true });

        const generalità = interaction.options.getString('generalità');
        const dipendente = interaction.options.getUser('discord');
        const generalitàDip = interaction.options.getString('generalità_dipendente');
        const numeroId = interaction.options.getString('numero_identificativo');
        const tipo = interaction.options.getString('tipo');
        const inizio = interaction.options.getString('inizio');
        const motivo = interaction.options.getString('motivo');

        const embed = new EmbedBuilder()
            .setTitle('> **PROVVEDIMENTO DISCIPLINARE / ORGANIZZATIVO – U.O.C.**')
            .setDescription(`
*Il sottoscritto,*

- **Nome e Cognome:** ${generalità}
- **Qualifica:** Responsabile U.O.C.
- **Reparto:** U.O.C. Medicina d'Urgenza e Pronto Soccorso

*adotta il seguente provvedimento nei confronti di:*

- **Nome DS:** ${dipendente.tag}
- **Nome e Cognome:** ${generalitàDip}
- **Numero Identificativo:** ${numeroId}

- **Tipo di provvedimento:** ${tipo}
- **A decorrere dal giorno:** ${inizio}

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

        const nuovo = new Provvedimento({
            userId: dipendente.id,
            tipo: 'interno',
            origine: 'gestione_reparto',
            data: formatData(),
            motivo,
            autoreId: interaction.user.id
        });

        await nuovo.save();

        await interaction.reply({ content: `<@${dipendente.id}>`, embeds: [embed] });
    }
};
