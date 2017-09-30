module.exports = {
  name: 'shutdown',
  description: '',
  adminOnly: true,
  showInHelp: false,

  run (context, response) {
    context.nix.shutdown();

    response.type = 'message';
    response.content = "Ok, I'm shutting down now.";
    return response.send();
  },
};
