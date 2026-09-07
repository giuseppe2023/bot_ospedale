const { SlashCommandBuilder, ChannelType, PermissionsBitField} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('aggiorna-cartella')
        .setDescription('Aggiorna una cartella sanitaria')
        .addStringOption(o =>
            o.setName('numero')
             .setDescription('Inserisci il numero cartella')
             .setRequired(true))
        .addStringOption(o =>
            o.setName('link')
             .setDescription('Inserisci il link della documentazione')
             .setRequired(true)),

    async execute(interaction) {

        const forumId = '1238230693851562055';
        const numero = interaction.options.getString('numero').toLowerCase();
        const link = interaction.options.getString('link');

        const allowedRoleId = process.env.DIPENDENTI;
        const allowedUserId = process.env.UTENTE;

        // 🔐 Controllo permessi
        if (
            !interaction.member.roles.cache.has(allowedRoleId) &&
            interaction.user.id !== allowedUserId &&
            interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)
        ) {
            return interaction.reply({
                content: '❌ Non hai il permesso per usare questo comando.',
                ephemeral: true
            });
        }

        const forum = await interaction.guild.channels.fetch(forumId);
        if (!forum || forum.type !== ChannelType.GuildForum) {
            return interaction.reply({
                content: '❌ Canale forum non valido.',
                ephemeral: true
            });
        }

        // ⏳ Defer reply per far capire che sta lavorando
        await interaction.deferReply({ ephemeral: true });

        let lastId = null;
        let threadTrovato = null;

        // 🔎 Ricerca paginata tra i thread
        while (true) {
            const fetched = await forum.threads.fetch({
                limit: 50,
                before: lastId
            });

            if (fetched.threads.size === 0) break;

            threadTrovato = fetched.threads.find(thread =>
                thread.name.toLowerCase().includes(`n.${numero}`)
            );

            if (threadTrovato) break;
            lastId = fetched.threads.last().id;
        }

        if (!threadTrovato) {
            return interaction.editReply({
                content: '❌ Nessuna cartella sanitaria trovata.'
            });
        }

        // 📝 Invio messaggio nel thread trovato
        await threadTrovato.send({
            content: `${interaction.user} ha aggiornato questa cartella\n${link}`,
            allowedMentions: { users: [] }
        });

        await interaction.editReply({
            content: '✅ Cartella aggiornata con successo.'
        });
    }
};
