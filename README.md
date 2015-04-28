# Open Smart Environment - Media player example
This example is an Node.js media player application based on the
OSE framework showcasing some of its principles and capabilities.

## Features
- Playback of predefined streams, local files, items in history
- Near-realtime synchronization among all front- and backend
  instances
- Playback through VLC
- Volume control using PulseAudio
- Integration with other example applications: ([DVB
  streamer](http://opensmartenvironment.github.io/doc/#example-dvb), [LIRC](http://opensmartenvironment.github.io/doc/#example-lirc), [Raspberry
  Pi](http://opensmartenvironment.github.io/doc/#example-rpi))

## Important links
This package is a part of the OSE suite. For more information, see the following links:
- [Media player example documentation](http://opensmartenvironment.github.io/doc/#example-player)
- [OSE suite documentation](http://opensmartenvironment.github.io/doc/)
- [All packages](https://github.com/opensmartenvironment/)

## About OSE
<b>Open Smart Environment software is a suite for creating
multi-instance applications that work as a single whole.</b><br>
Imagine, for example, a personal mesh running on various devices
including HTPCs, phones, tablets, workstations, servers, Raspberry
Pis, home automation gadgets, wearables, drones, etc.

OSE software consists of several npm packages: a [framework](http://opensmartenvironment.github.io/doc/#framework) running
on Node.js, an [HTML5 frontend](http://opensmartenvironment.github.io/doc/#html5frontend), extending
packages and a set of example applications.

<a href="http://opensmartenvironment.github.io/doc/resource/ose.svg"><img width=100% src="http://opensmartenvironment.github.io/doc/resource/ose.svg"></a>

**Set-up of current example applications.** Here,
OSE provides a [Media player](http://opensmartenvironment.github.io/doc/#example-player) running on an HTPC
that can be controlled by an IR remote through
[LIRC](http://opensmartenvironment.github.io/doc/#example-lirc) and is capable of playing streams from a
[DVB streamer](http://opensmartenvironment.github.io/doc/#example-dvb) and control devices through GPIO
pins on a [Raspberry Pi](http://opensmartenvironment.github.io/doc/#example-rpi)

For more information about OSE see **[the documentation](http://opensmartenvironment.github.io/doc/)**.

## Status
- Pre-alpha stage (insecure and buggy)
- Unstable API
- Patchy documentation
- No test suite

This is not yet a piece of download-and-use software. It is important
to understand the basic principles covered by the
[documentation](http://opensmartenvironment.github.io/doc/).

## Platforms
OSE has the following prerequisites:
- Node.js (>0.10) running on Debian Jessie and Raspbian
- Firefox 37 or newer with Web Components enabled

## Usage

For the Media player application to work, you need the following prerequisites:
- Node.js > 0.10, npm, git
- bower<br>
  `sudo npm install -g bower`
- PulseAudio configured with the D-Bus control interface<br>
  `pactl load-module module-dbus-protocol`
- VLC 2.2 or newer<br>
  `sudo apt-get install vlc`

To install the example application, do the following:

    git clone https://github.com/OpenSmartEnvironment/ose-example-player
    cd ose-example-player
    npm install

To start the Media player example application, execute the startup script from an X.Org session.

    ./bin/run.js

To access the [HTML5 frontend](http://opensmartenvironment.github.io/doc/#html5frontend), open the following URL in Firefox
**37 or newer** (Iceweasel in Debian Jessie is too old).<br>
**Before opening the link, enable the `dom.webcomponents.enabled` option in `about:config`.**

    http://localhost:4431

## Licence
This software is released under the terms of the [GNU General
Public Licence v3.0](http://www.gnu.org/copyleft/gpl.html) or
later.
