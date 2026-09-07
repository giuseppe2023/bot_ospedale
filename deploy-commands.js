const { REST, Routes } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const CLIENT_ID = process.env.CLIENT_ID;
const TOKEN = process.env.TOKEN;

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Registriamo solo i comandi che hanno .data (cioè slash commands)
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data) {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🔁 Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log('✅ Successfully registered application commands.');
  } catch (error) {
    console.error(error);
  }
})();
