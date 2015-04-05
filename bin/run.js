#!/usr/bin/env node

/**
 * @caption Media player example
 *
 * @readme
 * This example is an stand-alone application based on the OSE
 * framework, showcasing some of its principles and capabilities. This
 * application works as a currently half-featured media player and
 * remote control on Linux boxes. The example application has the
 * following features:
 *
 * - Node.js backend
 * - Control via HTML5 frontend instances
 * - Near-realtime synchronization among all front- and backend
 *   instances
 * - Playback of different media using VLC
 * - Predefined media streams
 * - Local files playback
 * - Playback from history
 *
 * See our other example applications:
 * - [ose-example-dvb]
 * - [ose-example-lirc]
 * - [ose-example-rpi]
 *
 * These three examples provide example OSE instances that connect to
 * the instance provided by this example instance.
 *
 *
 * @planned
 * - Keyboard and pointer remote control using xdotool
 * - Icecast directory search and playback
 * - Youtube search and playback
 *
 *
 * @oseExample
 *
 * @description
 *
 * ## Installation
 *
 * For the Media player application to work, you need the following prerequisities:
 * - Node.js and npm
 * - PulseAudio configured with the D-Bus control interface
 * - Python 3
 * - VLC
 *
 * If you run Debian Jessie, just run:
 *
 *     sudo apt-get install pulseaudio python3 vlc libdbus-1-dev vlc
 *
 *
 * To enable the dbus control interface, do:
 *
 *     pactl load-module module-dbus-protocol
 *
 *
 * To install the example application, do one of the following:
 *
 *     npm install ose-example-player
 *
 * or
 *    
 *     git clone https://github.com/OpenSmartEnvironment/ose-example-player
 *
 *
 * To start the Media player example application, change to the installation
 * directory and execute the startup script from an X.Org session. To
 * run the example from outside an X.Org session (in a console or
 * through ssh), export the display variable in the shell:
 *
 *     export DISPLAY=":0.0"
 *
 * To start the application from the install directory:
 *
 *     cd ose-example-player
 *     ./bin/run.js
 *
 * To access the [HTML5 frontend], open the following URL in Firefox
 * 37 or newer with the `dom.webcomponents.enabled` option enabled in
 * `about:config`:
 *
 *     http://localhost:4431
 *
 *
 * @module bundle
 * @submodule bundle.media
 * @main bundle.media
 */


'use strict';

// The OSE framework is initialized by requiring the "ose" package:
var O = require('ose').app(module, 'example');

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
  name: 'media',         // Name of this OSE instance
  space: 'example.org',  // Space name this instance belongs to
};


// Enable general control package
exports['ose-control'] = {};

// Enable general dvb package
exports['ose-dvb'] = {};

// Enable LIRC package
//exports['ose-lirc'] = {};

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
exports['ose-xorg'] = {};

// Enable Raspberry Pi package
exports['ose-rpi'] = {};

// Enable CLI interface
exports.cli = {
  id: 'ose/lib/cli',

  // CLI can run some commands:
  script: [
    'wait 1000',
    'space example.org',
    'shard media',
    'entry player',
    'info',
  /*
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
      pagelet: 'detail',
      ident: {
        id: 'player',
        alias: 'media',
      }
    },
    {
      caption: 'X.Org remote control',
      pagelet: 'gesture',
      ident: {
        id: 'xorg',
        alias: 'mediaControl',
      }
    },
    {
      caption: 'Raspberry Pi',
      pagelet: 'detail',
      ident: {
        id: 'rpi',
        alias: 'rpi',
      }
    },
  ],
};


// Definition of data structure. – The space named "example.org"
// contains all your data
exports.space = {
  id: 'ose/lib/space',        // Module id
  name: 'example.org',        // Name of the space
  home: 'media',              // Home instance of the space – This
                              // instance is the home instance of the
                              // space.
};


// The space is partitioned into shards:
exports.mediaControl = {
  id: 'ose/lib/shard',
  sid: 2,                // Shard id unique within the space
  scope: 'control',      // Scope the shard belongs to
  alias: 'mediaControl', // Shard alias
  entries: initControl,  // Method initializing entries belonging
                         // to the shard, defined below
};

// Media shard
exports.media = {
  id: 'ose/lib/shard',
  sid: 3,              // Shard id unique within the space
  scope: 'media',      // Scope the shard belongs to
  alias: 'media',      // Shard alias
  entries: initMedia,  // Method initializing entries belonging
                       // to the shard, defined below
};

// Access to local filesystem
exports.mediaFs = {
  id: 'ose/lib/shard',
  sid: 4,                    // Shard id unique within the space
  scope: 'fs',               // Scope the shard belongs to
  alias: 'mediaFs',          // Shard alias
  db: {                      // Database containing shards data
    class: 'ose-fs/lib/db',  // Database class
    root: '/opt/media',      // Directory containing media files
  }
};

  /*

// Xiph.org data namespace
exports.xiph = {
  id: 'ose/lib/space',
  name: 'xiph',
  home: 'media.example.org',
  shards: [{
    sid: 1,
    scope: 'icecast',
    alias: 'icecast'
  }]
};


// Google data namespace
exports.google = {
  id: 'ose/lib/space',
  name: 'google',
  home: 'media.example.org',
  shards: [{
    sid: 1,
    scope: 'youtube',
    alias: 'youtube'
  }]
};

*/

// "control" shard initialization method.
function initControl(shard) {

  // Create volume control entry
  shard.entry('volume', 'paDbus', {name: 'PulseAudio'});

  // Create playback control entry
  shard.entry('playback', 'vlc', {
    name: 'VLC',
    mcast: 'mcastPool',  // Pool used for multicast streaming

    // IP used as input for unicast streams
    ucast: {
      ip: '10.166.25.8',
      port: '5000',
    },
  });

  McastPool = shard.entry('mcastPool', 'ippool', {
    name: 'Multicast address pool',
    start: '239.255.0.1',
    end: '239.255.255.254',
  });

  // Create X.Org server control entry
  shard.entry('xorg', 'xorg', {name: 'X.Org server'});
}

// "media" shard initialization method.
function initMedia(shard) {

  // Create entry representing generic Media player
  shard.entry(
    'player',  // Entry id
    'player',  // Entry kind

    // Entry data
    {
      name: 'Media Player',  // Displayed name

      // Identification of playback entry
      playback: {
        id: 'playback',
        alias: 'mediaControl',
      },

      // Identification of volume control entry
      volume: {
        id: 'volume',
        alias: 'mediaControl',
      },

      // List of sources, each source is identification for "list" pagelet or full pagelet "stateObj"
      sources: {
        history: {
          kind: 'item',
          alias: 'media',
        },
        stream: {
          kind: 'stream',
          alias: 'media',
        },
        fs: {
          scope: 'fs',
          alias: 'mediaFs',
        },
        dvb: {
          kind: 'dvbChannel',
          alias: 'media',
        }
      },

      // Identification of DVB streamer entry
      dvb: {
        id: 'dvbstreamer',
        alias: 'dvb',
      },
    }
  );

  // Run following method after plugins initialization.
  shard.afterHome(function() {
    addMedia('stream', require('../data/streams'));

    Fs.readFile(Path.dirname(Path.dirname(module.filename)) + '/data/channels.conf', {encoding: 'utf8'}, function(err, data) {
      if (err) {
        O.log.error(err);
        return;
      }

      require('ose-dvb').parseChannels(shard, data, McastPool, function(err) {
        if (err) {
          O.log.error(err);
        } else {
          O.log.notice('Channels file successfully parsed');
        }
      });
      return;
    });
  });


  function addMedia(name, data) {
    for (var key in data) {
      // Create new media item entry
      shard.entry(key, name, data[key]);
    }
  }

}

// Start OSE instance
O.run();
