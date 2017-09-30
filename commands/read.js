let BoopCommand = {
  name: 'read',
  description: 'Reads a value from the server\'s data',
  adminOnly: true,
  showInHelp: false,
  args: [
    {
      name: 'key',
      description: 'The key to write data to',
      required: true,
    },
  ],

  run (context, response) {
    let dataManager = context.nix.dataManager;

    if (context.channel.type !== 'text') {
      response.type = 'reply';
      response.content = 'This command can only be run from a server.';
      return response.send();
    }


    return dataManager.getGuildData(context.guild.id)
      .map((savedData) => savedData[context.args.key])
      .map((savedValue) => dataManager.formatForMsg(savedValue))
      .flatMap((stringValue) => {
        response.type = 'message';
        response.content = stringValue;
        return response.send();
      });
  },
};

module.exports = BoopCommand;
