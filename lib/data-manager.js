const fs = require('fs');
const Path = require('path');
const Rx = require('rx');

const GUILD_DATA = "GUILD_DATA";
const USER_DATA = "USER_DATA";

const dataTypeFolderMap = {};
dataTypeFolderMap[GUILD_DATA] = 'guilds';
dataTypeFolderMap[USER_DATA] = 'users';

class DataManager {
  constructor (config) {
    this._dataDir = config.dataDir;

    if (!fs.existsSync(this._dataDir)) {
      fs.mkdirSync(this._dataDir);
    }

    for(let dataType in dataTypeFolderMap) {
      if (!fs.existsSync(Path.join(this._dataDir, dataTypeFolderMap[dataType]))) {
        fs.mkdirSync(Path.join(this._dataDir, dataTypeFolderMap[dataType]));
      }
    }
  }

  setGuildData (guildId, data) {
    let dataFile = this._getDataFilename(GUILD_DATA, guildId);
    return this._setData(dataFile, data);
  };

  getGuildData (guildId) {
    let dataFile = this._getDataFilename(GUILD_DATA, guildId);
    return this._getData(dataFile);
  };

  setUserData(userId, data) {
    let dataFile = this._getDataFilename(USER_DATA, userId);
    return this._setData(dataFile, data);
  };

  getUserData(userId) {
    let dataFile = this._getDataFilename(USER_DATA, userId);
    return this._getData(dataFile);
  };

  _getDataFilename(type, id) {
    let folder = dataTypeFolderMap[type];

    if (typeof folder === "undefined") {
      throw new Error("Unknown data type");
    }

    return Path.join(this._dataDir, folder, id + ".json");
  }

  _setData(dataFile, data) {
    return this._getData(dataFile)
      .map((existingData) => Object.assign(existingData, data))
      .map((newData) => JSON.stringify(newData, null, '  '))
      .flatMap((newContents) => Rx.Observable.fromNodeCallback(fs.writeFile)(dataFile, newContents))
      .flatMap(() => this._getData(dataFile));
  }

  _getData(dataFile) {
    return Rx.Observable.fromNodeCallback(fs.readFile)(dataFile)
      .map((contents) => JSON.parse(contents))
      .catch((err) => {
        if (err.code === "ENOENT") {
          return Rx.Observable.fromNodeCallback(fs.writeFile)(dataFile, "{}")
            .flatMap(() => this._getData(dataFile));
        } else {
          throw err;
        }
      });
  }
}

DataManager.formatForMsg = function(value) {
  switch (typeof value) {
    case "undefined":
      return "[undefined]";
    case "object":
      return JSON.stringify(value, null, '  ');
    default:
      return value.toString();
  }
};

module.exports = DataManager;
