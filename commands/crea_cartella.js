const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crea-cartella')
        .setDescription('Crea una nuova cartella clinica')
        .addStringOption(o =>
            o.setName('generalità')
             .setDescription('Inserisci il nome e cognome')
             .setRequired(true))
        .addStringOption(o =>
            o.setName('sesso')
             .setDescription('Inserisci il sesso')
             .addChoices(
                { name: 'Maschio', value: 'Maschio' },
                { name: 'Femmina', value: 'Femmina' }
             )
             .setRequired(true))
        .addStringOption(o =>
            o.setName('nascita')
             .setDescription('Inserisci la data di nascita')
             .setRequired(true))
        .addStringOption(o =>
            o.setName('recapito')
             .setDescription('Inserisci username Roblox')
             .setRequired(true))
        .addStringOption(o =>
            o.setName('emergenza')
             .setDescription('Inserisci i contatti di emergenza')
             .setRequired(true))
        .addStringOption(o =>
            o.setName('gruppo')
             .setDescription('Inserisci il gruppo sanguigno')
             .setRequired(true))
        .addStringOption(o =>
            o.setName('allergie')
             .setDescription('Inserisci eventuali allergie')
             .setRequired(true))
        .addStringOption(o =>
            o.setName('patologie')
             .setDescription('Inserisci eventuali patologie')
             .setRequired(true))
        .addStringOption(o =>
            o.setName('lavoro')
             .setDescription('Inserisci il lavoro')
             .setRequired(true)),

    async execute(interaction) {
        const forumId = '1238230693851562055';
        const TAG_ID = '1238231214289190933';

        const generalità = interaction.options.getString('generalità');
        const sesso = interaction.options.getString('sesso');
        const nascita = interaction.options.getString('nascita');
        const recapito = interaction.options.getString('recapito');
        const emergenza = interaction.options.getString('emergenza');
        const gruppo = interaction.options.getString('gruppo');
        const allergie = interaction.options.getString('allergie');
        const patologie = interaction.options.getString('patologie');
        const lavoro = interaction.options.getString('lavoro');

        const allowedRoleId = process.env.DIPENDENTI;
        const allowedUserId = process.env.UTENTE;

        if (!interaction.member.roles.cache.has(allowedRoleId) && interaction.user.id !== allowedUserId && interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: "❌ Non hai il permesso per eseguire questo comando.", ephemeral: true });
        }

        const forum = await interaction.guild.channels.fetch(forumId);
        if (!forum || forum.type !== ChannelType.GuildForum) {
            return interaction.reply({ content: '❌ Canale forum non valido.', ephemeral: true });
        }

        // 🔢 Calcolo numero cartella progressivo
        let lastNumber = 0;
        const threads = await forum.threads.fetch({ limit: 100 });
        threads.threads.forEach(thread => {
            const match = thread.name.match(/N\.(\d+)/);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > lastNumber) lastNumber = num;
            }
        });
        const numero = lastNumber + 1;

        const embed = new EmbedBuilder()
            .setTitle('📁 Cartella Clinica')
            .setDescription(`
            \n**Nome e Cognome:** ${generalità}
            \n**Sesso:** ${sesso}
            \n**Data di Nascita:** ${nascita}
            \n**Username Roblox:** ${recapito}
            \n**Contatto Emergenza:** ${emergenza}
            \n**Gruppo Sanguigno:** ${gruppo}
            \n**Allergie:** ${allergie}
            \n**Patologie:** ${patologie}
            \n**Lavoro:** ${lavoro}
            \n**Numero Cartella:** ${numero}
            \n**Dipendente:** ${interaction.user}
            `)
            .setColor('Blurple')
            .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 1024 }))
            .setAuthor({
                name: interaction.client.user.username,
                iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        await forum.threads.create({
            name: `${generalità} - N.${numero}`,
            appliedTags: [TAG_ID],
            message: {
                embeds: [embed],
                allowedMentions: { users: [interaction.user.id] }
            }
        });

        await interaction.reply({
            content: '✅ Cartella creata con successo',
            ephemeral: true
        });
    }
};
