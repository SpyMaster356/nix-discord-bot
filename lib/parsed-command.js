const Rx = require('rx');
const Discord = require('discord.js');

const Response = require('./response');

class ParsedCommand {
  constructor (command, context) {
    this._command = command;
    this._context = context;
  }

  run () {
    if (this._command.adminOnly) {
      if (this._context.message.author.id !== this._context.nix.owner.id) {
        let response = new Response(Response.TYPE_NONE);
        return response.respondTo(this._context.message);
      }
    }

    if (Object.keys(this._context.args).length < this._command.requiredArgs.length) {
      let response = this._command.helpResponse();
      response.content = "I'm sorry, but I'm missing some information for that command:";
      return response.respondTo(this._context.message);
    }

    if (this._context.hasFlag('help')) {
      let response = this._command.helpResponse();
      return response.respondTo(this._context.message);
    }

    let response$;

    try {
      response$ = this._command.run(this._context);
    } catch(error) {
      response$ = Rx.Observable.throw(error);
    }

    return response$
      .catch((error) => this._handleError(error))
      .flatMap((response) => response.respondTo(this._context.message));
  }

  _handleError(error) {
    console.error(error);

    let embed = this._createErrorEmbed(error);
    this._context.nix.messageOwner("I ran into an unhandled exception: ", {embed: embed});

    let userResponse = new Response(Response.TYPE_MESSAGE);
    userResponse.content =
      "**CRASH** *Ummm, that wasn't supposed to happen...*\n\n" +
      "Seems like I ran into a *slight* problem while I was working on your request. " +
      "I've let Spy know about the error, and he should be able to fix it later.";

    return Rx.Observable.just(userResponse);
  }

  _createErrorEmbed(error) {
    let context = this._context;

    let embed = new Discord.RichEmbed();

    embed.addField("Error:", error.message);
    embed.addField("Message", context.message.content);

    switch (context.channel.type) {
      case "text":
        embed.addField("Guild", context.channel.guild.name);
        embed.addField("Channel", context.channel.name);
        break;
      case "dm":
        embed.addField("User", context.channel.recipient.tag);
        break;
      case "group":
        let users = context.channel.recipients;
        embed.addField("Users", users.map((user) => user.tag).join(', '));
        break;
      default:
        embed.addField("Channel Type", context.channel.type);
    }

    embed.addField("Stack:", error.stack);

    return embed;
  }
}

module.exports = ParsedCommand;
