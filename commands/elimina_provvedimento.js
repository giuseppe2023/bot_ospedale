const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const Provvedimento = require('../database/models/Provvedimento');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('elimina-provvedimento')
        .setDescription('Elimina un provvedimento tramite ID')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('ID del provvedimento')
                .setRequired(true)
        ),

    async execute(interaction) {
        const allowedRoles = process.env.DIRIGENZA.split(',');
        const allowedUserId = process.env.UTENTE;

        const hasAllowedRole = interaction.member.roles.cache.some(role => allowedRoles.includes(role.id));

        if (!hasAllowedRole && interaction.user.id !== allowedUserId && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Permesso negato.', ephemeral: true });
        }

        const id = interaction.options.getString('id');

        const result = await Provvedimento.deleteOne({ _id: id });

        if (result.deletedCount === 0) {
            return interaction.reply({ content: '❌ ID non trovato.', ephemeral: true });
        }

        interaction.reply({ content: `✅ Provvedimento **${id}** eliminato correttamente.`, ephemeral: true });
    }
};
