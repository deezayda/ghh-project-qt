const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timer')
        .setDescription('Start a countdown timer')
        .addIntegerOption(option => 
            option.setName('duration')
                .setDescription('How long in minutes')
                .setRequired(true)),
    
    async execute(interaction) {
        const duration = interaction.options.getInteger('duration');
        if (duration <= 0) {
            await interaction.reply('Please enter a valid duration greater than 0');
            return;
        }

        const endTime = Math.floor(Date.now() / 1000) + duration * 60;

        const embed = new EmbedBuilder()
            .setTitle('⏳ Timer Started')
            .setDescription(`Time's up in <t:${endTime}:R>`)
            .setFooter({ text: 'Timer ends ' })
            .setTimestamp(endTime * 1000);

        await interaction.reply({ embeds: [embed] });

        setTimeout(async () => {
            const finishedEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('⏰ Countdown Complete')
                .setDescription('Your time is up')
                .setFooter({ text: 'Timer finished' })
                .setTimestamp();

            await interaction.followUp({ embeds: [finishedEmbed] });
        }, duration * 60 * 1000);
    }
};
