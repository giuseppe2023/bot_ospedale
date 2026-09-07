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
        .setName('gestione-scuola')
        .setDescription(`Registra un'azione disciplinare nei confronti di uno studente`)
        .addStringOption(option => option.setName('generalità').setDescription('Inserire il Nome e Cognome del compilatore').setRequired(true))
        .addRoleOption(option => option.setName('qualifica').setDescription('Inserire la qualifica del compilatore').setRequired(true))
        .addUserOption(option => option.setName('discord').setDescription('Inserire il discord del dipendente').setRequired(true))
        .addStringOption(option => option.setName('generalità_studente').setDescription('Inserire il Nome e Cognome dello studente').setRequired(true))
        .addStringOption(option => option.setName('corso').setDescription('Inserire il corso di appartenenza')
            .addChoices({ name: 'Medicina', value: 'Medicina' }, { name: 'Infermieristica', value: 'Infermieristica' })
            .setRequired(true))
        .addStringOption(option => option.setName('tipo').setDescription('Inserire il tipo di provvedimento')
            .addChoices({ name: 'Avvertimento', value: 'Avvertimento' }, { name: 'Licenziamento', value: 'Licenziamento' })
            .setRequired(true))
        .addStringOption(option => option.setName('inizio').setDescription('Inserire la data di decorrenza').setRequired(true))
        .addStringOption(option => option.setName('motivo').setDescription('Inserire il motivo del provvedimento').setRequired(true)),

    async execute(interaction) {
        const generalità = interaction.options.getString('generalità');
        const qualifica = interaction.options.getRole('qualifica');
        const discord = interaction.options.getUser('discord');
        const generalità_studente = interaction.options.getString('generalità_studente');
        const corso = interaction.options.getString('corso');
        const tipo = interaction.options.getString('tipo');
        const inizio = interaction.options.getString('inizio');
        const motivo = interaction.options.getString('motivo');

        const allowedRoleId = process.env.DOCENTI;
        const allowedUserId = process.env.UTENTE;

        if (!interaction.member.roles.cache.has(allowedRoleId) && interaction.user.id !== allowedUserId && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: "❌ Non hai il permesso per eseguire questo comando.", ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle("> **PROVVEDIMENTO DISCIPLINARE – SCUOLA DI FORMAZIONE**")
            .setDescription(`
*Il sottoscritto,*\n
- **Nome e Cognome:** ${generalità}
- **Qualifica:** ${qualifica}\n
*con la presente comunica formale provvedimento disciplinare nei confronti di:*\n
- **Nome DS:** ${discord.tag}
- **Nome e Cognome:** ${generalità_studente}
- **Corso di Appartenenza:** ${corso}\n
- **Tipo di provvedimento:** ${tipo}
**A decorrere dal giorno:** ${inizio}\n
- **Per il seguente motivo:**\n${motivo}\n
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n
**Firma:** ${interaction.user}`)
            .setColor("Blurple")
            .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 1024 }))
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 1024 })
            })
            .setTimestamp();

        const nuovo = new Provvedimento({
            userId: discord.id,
            tipo: 'interno',
            origine: 'gestione_scuola',
            data: formatData(),
            motivo,
            autoreId: interaction.user.id
        });

        await nuovo.save();

        await interaction.reply({ content: `<@${discord.id}>`, embeds: [embed], ephemeral: false });
    }
};
