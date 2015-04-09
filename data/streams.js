'use strict';

/**
 * @module example-player
 */

/**
 * @caption Predefined media streams
 *
 * @readme
 * Personalize this file with your favourite streams.
 *
 * Each property of `exports` contains data of one media stream entry.
 *
 * @class example-player.data.streams
 * @type module
 */

exports.psr = {
  name: 'Prague Show Radio',  // Name of stream
  url: 'http://212.96.160.160:7978/',  // URL of stream
  preset: 1,  // Number to be pressed on remote controller to play
              // this stream.
};

exports.rebel = {
  name: 'Rebel Radio Brod',
  url: 'http://37.157.195.10:7100/',
  preset: 2,
};

exports.cr1 = {
  name: 'Radiozurnal',
  url: 'http://icecast7.play.cz:8000/cro1-128.mp3',
  preset: 3,
};

exports.rockzone = {
  name: 'Rockzone',
  url: 'http://icecast5.play.cz/rockzone128.mp3.m3u',
  preset: 4,
};

exports.beat = {
  name: 'Radio Beat',
  url: 'http://ice.abradio.cz:80/beat128.mp3',
  preset: 5,
};
