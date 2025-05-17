
require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.DirectMessages],
  partials: [Partials.Channel]
});

const LOG_CHANNEL_NAME = 'logs-bot-securité';
const roleName = '🟤 Visiteur';

client.once('ready', () => {
  console.log(`🤖 Bot prêt : ${client.user.tag}`);
});

client.on('guildMemberAdd', async member => {
  const code = Math.random().toString(36).substring(2, 7).toUpperCase();
  const dm = await member.createDM();

  const embed = new EmbedBuilder()
    .setTitle("🥧 Vérification des Pâtés Lorrains")
    .setDescription(`Bienvenue **${member.user.username}** !\n\nCe serveur est réservé aux **18 ans et +**.\n\n**Code de vérification :** \`${code}\`\n\nMerci de répondre avec ce code, puis ton **âge**.`)
    .setColor(0xFFA500)
    .setImage('https://i.ibb.co/kWr3PZn/e42e854f1dd3.png')
    .setFooter({ text: "Réponds ici dans les 60 secondes." });

  await dm.send({ embeds: [embed] });

  const filter = m => m.author.id === member.id;
  const collector = dm.channel.createMessageCollector({ filter, time: 60000, max: 2 });

  let step = 0;

  collector.on('collect', async msg => {
    if (step === 0 && msg.content.trim().toUpperCase() === code) {
      step++;
      await dm.send("✅ Code accepté. Maintenant, indique ton âge.");
    } else if (step === 1) {
      const age = parseInt(msg.content.trim());
      if (age < 18) {
        await dm.send("🚫 Tu dois avoir au moins 18 ans pour rejoindre. Tu vas être expulsé dans 10 secondes.");
        setTimeout(() => member.kick("Âge inférieur à 18 ans"), 10000);
      } else {
        const role = member.guild.roles.cache.find(r => r.name === roleName);
        if (role) await member.roles.add(role);

        const successEmbed = new EmbedBuilder()
          .setTitle("✅ Accès accordé !")
          .setDescription("Bienvenue dans le monde sacré des Pâtés Lorrains !")
          .setColor(0x00FF00)
          .setImage("https://media.giphy.com/media/3orieVVSG6z8gXHlu8/giphy.gif");

        await dm.send({ embeds: [successEmbed] });

        const logChannel = member.guild.channels.cache.find(c => c.name === LOG_CHANNEL_NAME);
        if (logChannel) {
          logChannel.send(`✅ ${member.user.tag} a passé la vérification avec succès.`);
        }
      }
    } else if (step === 0) {
      await dm.send("❌ Code incorrect. Réessaie ou contacte le staff.");
    }
  });
});

console.log("Token utilisé :", process.env.TOKEN ? "OK ✅" : "Manquant ❌");
client.login(process.env.TOKEN);
