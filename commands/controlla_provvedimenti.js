const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const Provvedimento = require('../database/models/Provvedimento');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('controlla-provvedimenti')
        .setDescription('Mostra i provvedimenti di un dipendente')
        .addUserOption(option =>
            option.setName('dipendente')
                .setDescription('Seleziona il dipendente')
                .setRequired(true)
        ),

    async execute(interaction) {
        const allowedRoles = process.env.DIREZIONE;
        const allowedUserId = process.env.UTENTE;

        if (!allowedRoles && interaction.user.id !== allowedUserId && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Permesso negato.', ephemeral: true });
        }

        const dipendente = interaction.options.getUser('dipendente');

        const lista = await Provvedimento.find({ userId: dipendente.id });

        if (!lista || lista.length === 0) {
            return interaction.reply({ content: `✅ Nessun provvedimento per ${dipendente}.`, ephemeral: true });
        }

        const interni = lista.filter(p => p.tipo === 'interno').length;
        const ufficiali = lista.filter(p => p.tipo === 'ufficiale').length;

        const dettagli = lista.map(p => `
**ID:** ${p._id}
**Tipo:** ${p.tipo}
**Applicato da:** <@${p.autoreId}>
**Motivo:** ${p.motivo}
**Data:** ${p.data}
▬▬▬▬▬▬▬▬▬
`).join('\n');

        const embed = new EmbedBuilder()
            .setTitle('📋 PROVVEDIMENTI DISCIPLINARI')
            .setDescription(`
👤 Dipendente: ${dipendente}

🔴 Ufficiali: **${ufficiali}**
🟡 Interni: **${interni}**
📊 Totale: **${lista.length}**

${dettagli}
`)
            .setColor('Blurple');

        interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
