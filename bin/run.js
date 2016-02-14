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
 * - Playback through [VLC] of:
 *   - predefined streams
 *   - local files
 *   - items in history
 *   - Icecast directory
 * - Volume control using [PulseAudio]
 * - Remote control of keyboard and pointer through xdotool ([xorg])
 * - Integration with other example applications:
 *   - [DVB streamer](#example-dvb)
 *   - [LIRC](#example-lirc)
 *   - [Raspberry Pi](#example-rpi)
 *
 *
 * @usage
 * ## Usage
 *
 * For the Media player application to work, you need the following prerequisites:
 * - Node.js > 0.12, npm, git
 * - PulseAudio configured with the D-Bus control interface<br>
 *   `pactl load-module module-dbus-protocol`
 * - VLC 2.2 or newer<br>
 *   `sudo apt-get install vlc`
 *
 *
 * To install the example application, do the following:
 *
 *     sudo apt-get install libdbus-1-dev pkg-config
 *     git clone https://github.com/OpenSmartEnvironment/ose-example-player
 *     cd ose-example-player
 *     npm install
 *
 *
 * To configure this example, edit `ose-example-player/bin/run.js`. Find and replace "CHANGE_ME" text with appropriate values.
 *
 * To start the Media player example application, execute the startup script from an X.Org session.
 *
 *     ./ose-example-player/bin/run.js
 *
 *
 * To access the [HTML5 frontend], open the following URL in [supported browser]
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
const O = require('ose')(module)
  .setPackage('ose-example-player')
;

var Fs = require('fs');
var Path = require('path');

// Multicast address pool
var McastPool;

// OSE is configured by a configuration object, `module.exports` in
// this case. Each property of this object defines the configuration
// for one OSE plugin.

// Basic properties of OSE instance
exports.ose = {
  // Name of this OSE instance
  name: 'player',
  // Space name this instance belongs to
  space: 'example.org',
  // Instance id unique within the space
  spid: 1,
  // Directory to store instance data
  dataDir: Path.dirname(Path.dirname(module.filename)) + '/data',

  /* To enable HTTPs generate server certificate into 'ose-example/player/private' and uncomment the following lines:
  ssl: {
    key: 'private/server.key',
    cert: 'private/server.crt',
  },
  */
};

// Enable control package
exports['ose-control'] = {};

// Enable dvb package
exports['ose-dvb'] = {};

// Enable media player package
exports['ose-media'] = {};

// Enable PulseAudio control package
exports['ose-pa'] = {};

// Enable local filesystem package
exports['ose-fs'] = {};

// Enable VideoLAN control package
exports['ose-videolan'] = {};

// Enable Icecast package
exports['ose-icecast'] = {};

// Enable X.Org control package
exports['ose-xorg'] = {};

// Enable Raspberry Pi package
exports['ose-rpi'] = {};

// Enable CLI interface
exports.cli = {
  id: 'ose/lib/cli',

  // CLI can run some commands:
  script: [
    'wait 2000',
    'space example.org',
    'shard playerControl',
    'entry player',
    'info',
    /*
    'wait 10000',
    'shard dvb',
    'entry dvbstreamer',
    'info',
    'detail',

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
exports['ose-html5'] = {
  // Define dashboard content
  dashboard: [
    {
      caption: 'Media player',
      view: 'detail',
      ident: {
        entry: 'player',
        shard: 'playerControl',
      }
    },
    {
      caption: 'X.Org remote control',
      view: 'gesture',
      ident: {
        entry: 'xorg',
        shard: 'playerControl',
      }
    },
    {
      caption: 'Raspberry Pi',
      view: 'detail',
      ident: {
        entry: 'rpi',
        shard: 'rpi',
      }
    }, {
      caption: 'Camera',
      view: 'detail',
      ident: {
        entry: 'camera1',
        shard: 'rpi',
      }
    }, {
      caption: 'Images',
      view: 'list',
      ident: {
        query: 'all',
        shard: 'rpiImages',
      }
    },
  ],
};

// Definition of data structure. – The space named "example.org"
// contains all your data
exports.space = {
  // Module id
  id: 'ose/lib/space',
  // Name of the space
  name: 'example.org',
  // Home instance of the space – This
  // instance is the home instance of the
  // space.
  home: 'player',
};

// The space is partitioned into shards:
exports.playerControl = {
  id: 'ose/lib/shard',
  // Shard id unique within the space
  sid: 2,
  // Schema the shard belongs to
  schema: 'control',
  // Shard alias
  alias: 'playerControl',
  // Fill new empty shard with some data
  upgrades: [
    // Method initializing entries belonging to the shard, defined below
    initControl,
  ],
};

// Media shard
exports.media = {
  id: 'ose/lib/shard',
  sid: 3,
  schema: 'media',
  alias: 'media',
  leveldb: 'memdown',
  upgrades: [
    initMedia,
  ],
};

// Access to local filesystem
exports.mediaFs = {
  id: 'ose/lib/shard',
  sid: 4,
  schema: 'fs',
  alias: 'mediaFs',

  // Change to directory containing media files:
//  root: Path.dirname(Path.dirname(module.filename)) + '/media',
//  root: 'CHANGE_ME',
  root: '/opt/media',
};

// Access to Icecast directory
exports.icecast = {
  id: 'ose/lib/shard',
  sid: 30,
  schema: 'icecast',
  alias: 'icecast',
};

// "control" shard initialization method.
function initControl(transaction, cb) {
  // Create volume control entry
  transaction.add('paDbus', {
    alias: 'volume',
    name: 'PulseAudio'
  });

  // Create playback control entry
  transaction.add('vlc', {
    alias: 'playback',
    name: 'VLC',

    // Pool used for multicast streaming, enable this to allow multicast streaming
//    mcast: 'mcastPool',

    // IP used as input for unicast streams
    ucast: {
      // Change to ip address of this host that will receive unicast media streams, required for DVB streamer to work
//      ip: 'CHANGE_ME'
      ip: '10.166.26.2',
      port: '5000',
    },
  });

  // Create multicast address pool
  McastPool = transaction.add('ippool', {
    alias: 'mcastPool',
    name: 'Multicast address pool',
    start: '239.255.0.1',
    end: '239.255.255.254',
  });

  // Create X.Org server control entry
  transaction.add('xorg', {
    alias: 'xorg',
    name: 'X.Org server'
  });

  // Create entry representing generic Media player
  transaction.add('player', {
    alias: 'player',
    name: 'Media Player',

    // Identification of playback entry
    playback: {
      entry: 'playback',
      shard: 'playerControl',
    },

    // Identification of volume control entry
    volume: {
      entry: 'volume',
      shard: 'playerControl',
    },

    // Identification of DVB streamer entry, ose-example-dvb must be running for DVB streaming to work
    dvb: {
      entry: 'dvbstreamer',
      shard: 'dvb',
    },

    // List of media sources
    sources: {
      history: {
        ident: {
          query: 'item-score',
          shard: 'media',
          kind: 'item',
        },
      },
      stream: {
        ident: {
          query: 'stream-name',
          shard: 'media',
          kind: 'stream',
        },
      },
      fs: {
        ident: {
          query: 'all',
          shard: 'mediaFs',
          kind: 'inode',
        }
      },
      icecast: {
        filterField: 'name',
        ident: {
          query: 'all',
          shard: 'icecast',
          kind: 'stream',
        },
      },
      dvb: {
        ident: {
          query: 'dvbChannel-title',
          shard: 'media',
          kind: 'dvbChannel',
        },
      },
    },
  });

  return cb();
}

// "media" shard initialization method.
function initMedia(transaction, cb) {
  require('ose-media').addStreams(transaction, require('../data/streams'));

  Fs.readFile(Path.dirname(Path.dirname(module.filename)) + '/data/channels.conf', {encoding: 'utf8'}, function(err, val) {
    if (err) return cb(err);

    return require('ose-dvb').parseChannels(transaction, val, McastPool, cb);
  });
}

// Start OSE instance
O.run();
