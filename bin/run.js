#!/usr/bin/env node

/**
 * @caption Media player example
 *
 *
 * @readme
 * This example is an Node.js media player application based on the
 * OSE framework showcasing some of its principles and capabilities.
 *
 *
 * @features
 * - Playback of predefined streams, local files, items in history
 * - Near-realtime synchronization among all front- and backend
 *   instances
 * - Playback through [VLC]
 * - Volume control using [PulseAudio]
 * - Remote control of keyboard and pointer through xdotool ([xorg])
 * - Integration with other example applications: ([DVB
 *   streamer](#example-dvb), [LIRC](#example-lirc), [Raspberry
 *   Pi](#example-rpi))
 *
 *
 * @planned
 * - Icecast directory search and playback
 * - Youtube search and playback
 *
 *
 * @usage
 * ## Usage
 *
 * For the Media player application to work, you need the following prerequisites:
 * - Node.js > 0.10, npm, git
 * - bower<br>
 *   `sudo npm install -g bower`
 * - PulseAudio configured with the D-Bus control interface<br>
 *   `pactl load-module module-dbus-protocol`
 * - VLC 2.2 or newer<br>
 *   `sudo apt-get install vlc`
 *
 * To install the example application, do the following:
 *
 *     git clone https://github.com/OpenSmartEnvironment/ose-example-player
 *     cd ose-example-player
 *     npm install
 *
 * To configure this example, edit `./bin/run.js`. For example, below
 * you can set the path to your media directory:
 *
 *     // Access to local filesystem
 *     exports.mediaFs = {
 *       id: 'ose/lib/shard',
 *       sid: 4,                    // Shard id unique within the space
 *       schema: 'fs',              // Schema the shard belongs to
 *       alias: 'mediaFs',          // Shard alias
 *       db: {                      // Database containing shards data
 *         id: 'ose-fs/lib/db',     // Database class
 *         // Set directory containing media files:
 *         root: Path.dirname(Path.dirname(module.filename)) + '/media',
 *       }
 *     };
 *
 * To start the Media player example application, execute the startup script from an X.Org session.
 *
 *     ./bin/run.js
 *
 * To access the [HTML5 frontend], open the following URL in Firefox
 * **37 or newer** (Iceweasel in Debian Jessie is too old).<br>
 * **Before opening the link, enable the `dom.webcomponents.enabled` option in `about:config`.**
 *
 *     http://localhost:4431
 *
 *
 * @module example-player
 * @main example-player
 */

/**
 * @caption Media player example startup script
 *
 * @readme
 * Main example application file
 *
 * @class example-player.bin.run
 * @type module
 */


'use strict';

// The OSE framework is initialized by requiring the "ose" package:
var O = require('ose').module(module);
O.package = 'ose-example-player';

var Fs = require('fs');
var Path = require('path');

var McastPool;  // Optional multicast pool

/*!
 * OSE is configured by a configuration object, `module.exports` in
 * this case. Each property of this object defines the configuration
 * for one [OSE plugin].
 */


// Basic properties of OSE instance
exports.ose = {
  name: 'player',         // Name of this OSE instance
  space: 'example.org',  // Space name this instance belongs to
  spid: 1,

  /* To enable HTTPs generate server certificate into 'ose-example/player/private' and uncomment the following lines:
  ssl: {
    key: 'private/server.key',
    cert: 'private/server.crt',
  },
  */
};


// Enable general control package
exports['ose-control'] = {};

// Enable general dvb package
exports['ose-dvb'] = {};

// Enable LevelDB package
exports['ose-level'] = {};

// Enable general media player package
exports['ose-media'] = {};

// Enable PulseAudio control package
exports['ose-pa'] = {};

// Enable local filesystem package
exports['ose-fs'] = {};

// Enable VideoLAN control package
exports['ose-videolan'] = {};

// Enable Icecast package
//exports['ose-icecast'] = {};

// Enable Youtube package
//exports['ose-youtube'] = {};

// Enable X.Org control package
//exports['ose-xorg'] = {};

// Enable Raspberry Pi package
//exports['ose-rpi'] = {};

// Enable CLI interface
exports.cli = {
  id: 'ose/lib/cli',

  // CLI can run some commands:
  script: [
    'wait 2000',
    'space example.org',
    'shard media',
    'entry player',
    'info',

  /*
    'command volume 0.01',
    'sleep 100',
    'command volume 0.02',
    'command fullscreen false',
    'wait 1000',
    'command fullscreen true',
    'command mute true',
    'wait 1000',
    'command mute false',
    'detail',
  */
  ],
};


// Enable HTTP server
exports.http = {
  id: 'ose/lib/http',
  port: 4431,
};


// Enable HTML5 frontend
exports['ose-gaia'] = {

  // Define dashboard content
  dashboard: [
    {
      caption: 'Media player',
      view: 'detail',
      ident: {
        entry: 'player',
        shard: 'media',
      }
    },
    {
      caption: 'X.Org remote control',
      view: 'gesture',
      ident: {
        entry: 'xorg',
        shard: 'mediaControl',
      }
    },
    {
      caption: 'Raspberry Pi',
      view: 'detail',
      ident: {
        entry: 'rpi',
        shard: 'rpi',
      }
    },
  ],
};


// Definition of data structure. – The space named "example.org"
// contains all your data
exports.space = {
  id: 'ose/lib/space',        // Module id
  name: 'example.org',        // Name of the space
  home: 'player',             // Home instance of the space – This
                              // instance is the home instance of the
                              // space.
};


// The space is partitioned into shards:
exports.mediaControl = {
  id: 'ose/lib/shard',
  sid: 2,                // Shard id unique within the space
  schema: 'control',     // Schema the shard belongs to
  alias: 'mediaControl', // Shard alias
  entries: initControl,  // Method initializing entries belonging
                         // to the shard, defined below
};

// Media shard
exports.media = {
  id: 'ose/lib/shard',
  sid: 3,              // Shard id unique within the space
  schema: 'media',     // Schema the shard belongs to
  alias: 'media',      // Shard alias
  entries: initMedia,  // Method initializing entries belonging
                       // to the shard, defined below
  leveldb: 'memdown',
};

// Access to local filesystem
exports.mediaFs = {
  id: 'ose/lib/shard',
  sid: 4,                    // Shard id unique within the space
  schema: 'fs',              // Schema the shard belongs to
  alias: 'mediaFs',          // Shard alias
    // Set directory containing media files:
//  root: Path.dirname(Path.dirname(module.filename)) + '/media',
  root: '/opt/media',
};

  /*

// Xiph.org data namespace
exports.xiph = {
  id: 'ose/lib/space',
  name: 'xiph',
  home: 'media.example.org',
  shards: [{
    sid: 1,
    schema: 'icecast',
    sal: 'icecast'
  }]
};


// Google data namespace
exports.google = {
  id: 'ose/lib/space',
  name: 'google',
  home: 'media.example.org',
  shards: [{
    sid: 1,
    schema: 'youtube',
    sal: 'youtube'
  }]
};

*/

// "control" shard initialization method.
function initControl(shard) {
  var trans = shard.startTrans();

  // Create volume control entry
  trans.add('paDbus', {
    alias: 'volume',
    name: 'PulseAudio'
  });

  // Create playback control entry
  trans.add('vlc', {
    alias: 'playback',
    name: 'VLC',
    mcast: 'mcastPool',  // Pool used for multicast streaming

    // IP used as input for unicast streams
    ucast: {
      ip: '10.166.25.8',
      port: '5000',
    },
  });

  McastPool = trans.add('ippool', {
    alias: 'mcastPool',
    name: 'Multicast address pool',
    start: '239.255.0.1',
    end: '239.255.255.254',
  });

  /*
  // Create X.Org server control entry
  trans.add('xorg', {
    alias: 'xorg',
    name: 'X.Org server'
  });
  */

  return trans.commit(O.log.bindError());
}

// "media" shard initialization method.
function initMedia(shard) {
  var trans = shard.startTrans();

  // Create entry representing generic Media player
  trans.add(
    'player',  // Entry kind

    // Entry data
    {
      alias: 'player',       // Entry alias
      name: 'Media Player',  // Displayed name

      // Identification of playback entry
      playback: {
        entry: 'playback',
        shard: 'mediaControl',
      },

      // Identification of volume control entry
      volume: {
        entry: 'volume',
        shard: 'mediaControl',
      },

      // List of sources, each source is identification for "list" view or full view "stateObj"
      sources: {
        history: {
          ident: {
            shard: 'media',
            kind: 'item',
            map: 'item-score',
          },
        },
        stream: {
          ident: {
            shard: 'media',
            kind: 'stream',
            map: 'stream-name',
          },
        },
        fs: {
          ident: {
            shard: 'mediaFs',
            map: 'all',
          }
        },
        dvb: {
          ident: {
            shard: 'media',
            map: 'dvbChannel-title',
          },
        }
      },

      // Identification of DVB streamer entry
      dvb: {
        entry: 'dvbstreamer',
        shard: 'dvb',
      },
    }
  );

  // Run following method after plugins initialization.
  shard.afterHome(function() {
    require('ose-media').addStreams(trans, require('../data/streams'));

    Fs.readFile(Path.dirname(Path.dirname(module.filename)) + '/data/channels.conf', {encoding: 'utf8'}, function(err, val) {
      if (err) {
        O.log.error(err);
        return trans.commit(O.log.bindError());
      }

      return require('ose-dvb').parseChannels(trans, val, McastPool, function(err) {
        if (err) {
          O.log.error(err);
        } else {
          O.log.notice('Channels file successfully parsed');
        }

        return trans.commit(O.log.bindError());
      });
    });
  });
}

// Start OSE instance
O.run();
