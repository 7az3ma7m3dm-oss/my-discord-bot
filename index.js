require('dotenv').config();
const { Client, GatewayIntentBits, Events, SlashCommandBuilder, REST, Routes } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// ---- Slash commands ----
const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check if the bot is alive'),

  new SlashCommandBuilder()
    .setName('team')
    .setDescription('Create a random team from voice channel members'),

  new SlashCommandBuilder()
    .setName('scrim')
    .setDescription('Announce a scrim')
    .addStringOption(o => o.setName('opponent').setDescription('Opponent team').setRequired(true))
    .addStringOption(o => o.setName('time').setDescription('Time (e.g. 8 PM Cairo)').setRequired(true)),

  new SlashCommandBuilder()
    .setName('roster')
    .setDescription('Show a player roster')
    .addStringOption(o => o.setName('game').setDescription('Game name').setRequired(true)),
].map(c => c.toJSON());

client.once(Events.ClientReady, async (c) => {
  console.log(`Logged in as ${c.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    await rest.put(
      Routes.applicationCommands(c.user.id),
      { body: commands }
    );
    console.log('Slash commands registered.');
  } catch (err) {
    console.error(err);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // /ping
  if (interaction.commandName === 'ping') {
    await interaction.reply(`🏓 Pong! ${client.ws.ping}ms`);
  }

  // /team - random teams from your voice channel
  if (interaction.commandName === 'team') {
    const vc = interaction.member.voice.channel;
    if (!vc) return interaction.reply({ content: 'Join a voice channel first.', ephemeral: true });

    const members = [...vc.members.values()].map(m => m.displayName);
    if (members.length < 2) return interaction.reply({ content: 'Need at least 2 people in VC.', ephemeral: true });

    // shuffle
    members.sort(() => Math.random() - 0.5);
    const half = Math.ceil(members.length / 2);
    const teamA = members.slice(0, half);
    const teamB = members.slice(half);

    await interaction.reply(
      `**Team A:** ${teamA.join(', ') || '—'}\n**Team B:** ${teamB.join(', ') || '—'}`
    );
  }

  // /scrim
  if (interaction.commandName === 'scrim') {
    const opponent = interaction.options.getString('opponent');
    const time = interaction.options.getString('time');
    await interaction.reply(
      `🔥 **SCRIM ANNOUNCED**\n**vs** ${opponent}\n**When:** ${time}\n**React ✅ to confirm**`
    );
  }

  // /roster
  if (interaction.commandName === 'roster') {
    const game = interaction.options.getString('game');
    await interaction.reply(`📋 Roster for **${game}** — edit this in the code to list your players.`);
  }
});

client.login(process.env.TOKEN);
