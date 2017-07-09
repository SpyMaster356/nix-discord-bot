const fs = require('fs');
const Path = require('path');
const Rx = require('rx');

class DataManager {
  constructor (config) {
    this._dataDir = config.dataDir;

    if (!fs.existsSync(this._dataDir)) {
      fs.mkdirSync(this._dataDir);
    }

    if (!fs.existsSync(Path.join(this._dataDir, 'guilds'))) {
      fs.mkdirSync(Path.join(this._dataDir, 'guilds'));
    }
  }

  setGuildData (guildId, data) {
    let guildDataFilename = this._getGuildDataFilename(guildId);
    return this._setData(guildDataFilename, data);
  };

  getGuildData (guildId) {
    let guildDataFilename = this._getGuildDataFilename(guildId);
    return this._getData(guildDataFilename);
  };

  _getGuildDataFilename(guildId) {
    return Path.join(this._dataDir, "guilds", guildId + ".json");
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
