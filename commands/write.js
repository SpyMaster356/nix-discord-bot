let WriteCommand = {
  name: 'write',
  description: 'Writes a value to the server\'s data',
  adminOnly: true,
  showInHelp: false,
  args: [
    {
      name: 'key',
      description: 'The key to write data to',
      required: true,
    },
    {
      name: 'value',
      description: 'The value to write',
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

    let dataToSave;

    try {
      dataToSave = JSON.parse(context.args.value);
    } catch (e) {
      if (e instanceof SyntaxError) {
        dataToSave = context.args.value;
      } else {
        throw e;
      }
    }

    let newData = {};
    newData[context.args.key] = dataToSave;

    return dataManager.setGuildData(context.guild.id, newData)
      .flatMap((data) => {
        let value = dataManager.formatForMsg(data[context.args.key]);

        response.type = 'message';
        response.content = "Saved to " + context.args.key + ":\n" + value;
        return response.send();
      });
  },
};

module.exports = WriteCommand;
