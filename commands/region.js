const Rx = require('rx');

const regions = require('../config/regions');

module.exports = {
  name: 'region',
  description: 'Sets the Overwatch region that you most often play on.',
  args: [
    {
      name: 'region',
      description: 'The region server/system you play on',
      required: true,
    },
  ],

  run: (context, response) => {
    let member = context.message.member;

    if (context.message.channel.type !== 'text') {
      response.type = 'reply';
      response.content = 'You can only change your region from a server.';
      return Rx.Observable.just(response);
    }

    let foundRegion = findRegionWithName(context.args.region);
    if (!foundRegion) {
      response.type = 'reply';
      response.content = 'I\'m sorry, but \'' + region + '\' is not an available region.';
      return response.send();
    }

    let newRole = findRole(context.message.guild, foundRegion.role);
    if (!newRole) {
      response.type = 'message';
      response.content = 'Looks like the role ' + foundRegion.role + ' doesn\'t exist. Can you ask an admin to create that role?';
      return response.send();
    }

    return setRegionRole(member, newRole)
      .map(() => {
        response.type = 'reply';
        response.content = 'I\'ve updated your region to ' + foundRegion.name;
        return response.send();
      })
      .catch(() => {
        response.type = 'message';
        response.content = 'Looks like I\'m unable to update your roles. Can you ask an admin to check my permissions?';
        return response.send();
      });
  },
};

function findRegionWithName(name) {
  return regions.find((region) => regionHasName(region, name));
}

function regionHasName(region, name) {
  let regionNames = region.alias
    .map((alias) => alias.toLowerCase());
  regionNames.push(region.name.toLowerCase());

  return regionNames.indexOf(name.toLowerCase()) !== -1;
}

function findRole(guild, roleName) {
  return guild.roles
    .find((role) => role.name.toLowerCase() === roleName.toLowerCase());
}

function setRegionRole(member, newRole) {
  let regionRoles = regions.map((region) => region.role);

  let roleIdsToRemove = member.roles
    .filter((role) => regionRoles.includes(role.name) && role.id !== newRole.id)
    .map((role) => role.id);

  return Rx.Observable.return()
    .flatMap(() => Rx.Observable.fromPromise(member.removeRoles(roleIdsToRemove)))
    .flatMap(() => Rx.Observable.fromPromise(member.addRole(newRole.id)));
}

