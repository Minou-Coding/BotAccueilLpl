
require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ChannelType } = require('discord.js');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

const ROLE_NON_VERIFIE = 'Non vérifié';
const ROLE_VERIFIE = '🟤 Visiteur';
const CHANNEL_ACCUEIL = '🚪-accueil';

client.once('ready', () => {
  console.log(`🤖 Bot connecté en tant que ${client.user.tag}`);
});

client.on('guildMemberAdd', async member => {
  const role = member.guild.roles.cache.find(r => r.name === ROLE_NON_VERIFIE);
  if (role) await member.roles.add(role);

  const channel = member.guild.channels.cache.find(c => c.name === CHANNEL_ACCUEIL && c.type === ChannelType.GuildText);
  if (!channel) return;

  const code = Math.random().toString(36).substring(2, 7).toUpperCase();

  const embed = new EmbedBuilder()
    .setTitle("🥧 Vérification des Pâtés Lorrains")
    .setDescription(`Bienvenue **${member.user.username}** !

Ce serveur est réservé aux **18 ans et +**.

**Code de vérification :** \`${code}\`

Merci de répondre dans ce canal avec ce code, puis ton **âge**.`)
    .setColor(0xFF9900)
    .setImage('https://i.ibb.co/kWr3PZn/e42e854f1dd3.png')
    .setFooter({ text: "Réponds ici dans les 60 secondes." });

  await channel.send({ content: `<@${member.id}>`, embeds: [embed] });

  const filter = m => m.author.id === member.id;
  const collector = channel.createMessageCollector({ filter, time: 60000, max: 2 });

  let step = 0;

  collector.on('collect', async msg => {
    if (step === 0 && msg.content.trim().toUpperCase() === code) {
      step++;
      await channel.send(`<@${member.id}> ✅ Code accepté. Maintenant, entre ton âge.`);
    } else if (step === 1) {
      const age = parseInt(msg.content.trim());
      if (age < 18) {
        await channel.send(`<@${member.id}> 🚫 Tu dois avoir au moins 18 ans. Tu seras expulsé dans 10 secondes.`);
        setTimeout(() => member.kick("Âge < 18"), 10000);
      } else {
        const roleToRemove = member.guild.roles.cache.find(r => r.name === ROLE_NON_VERIFIE);
        const roleToAdd = member.guild.roles.cache.find(r => r.name === ROLE_VERIFIE);
        if (roleToRemove) await member.roles.remove(roleToRemove);
        if (roleToAdd) await member.roles.add(roleToAdd);

        const successEmbed = new EmbedBuilder()
          .setTitle("🎉 Accès accordé !")
          .setDescription(`<@${member.id}> Bienvenue chez Les Pâtés Lorrains ! Tu peux maintenant accéder au serveur.`)
          .setColor(0x00FF00)
          .setImage("https://media.giphy.com/media/3orieVVSG6z8gXHlu8/giphy.gif");

        await channel.send({ embeds: [successEmbed] });
      }
    } else if (step === 0) {
      await channel.send(`<@${member.id}> ❌ Code incorrect. Réessaie.`);
    }
  });
});

client.login(process.env.TOKEN);
