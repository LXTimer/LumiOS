# LumiOS

A fully functional and interactive, web-based operating system, built for aesthetics.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Apps](#apps)
- [Demo](#demo)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Credits](#credits)

## Overview

LumiOS delivers a fully interactive web‑based operating system, complete with draggable and resizable windows, a taskbar, and functional built‑in applications. It mainly emphasizes aesthetics, focusing on creating fantastic user expereinces.

![LumiOS - 1](./assets/LumiOS-1.png)
![LumiOS - 2](./assets/LumiOS-2.png)


## Features

+ Lock Screen
+ Draggable, resizable windows with minimize / maximize / close
+ Taskbar with pinned app dock, running-app buttons, and system tray
+ Start menu with live search
+ System tray (Wi-Fi toggle, volume popup with slider, calendar popup)
+ Desktop icons, single-click to launch
+ Drifting particle background
+ Custom wallpapers, app icons, and accent colors
+ Dark / light mode, adjustable brightness, adjustable taskbar opacity
+ Desktop widgets
+ Scientific calculator, markdown notes, file preview, and drawing tools
+ Clock with stopwatch, timer, and alarms; calendar with events and agenda
+ Notification settings, security panel, and about information
+ Weather, notes peek, and system stats widgets
+ Terminal with command execution and file system navigation
+ Welcome app for onboarding

## Apps

| App | Description |
|---|---|
| **Clock** | Analog/digital clock, stopwatch, and alarms |
| **Calendar** | Month view, event creation, and agenda list |
| **Calculator** | Standard four-function calculator |
| **Notes** | Rich-text editor for notetaking |
| **Terminal** | Simple terminal with command execution and file system navigation |
| **Files** | File system with navigation and preview |
| **Settings** | Appearance, display, notifications, security, and about panels |
| **Widgets** | Manage desktop-overlay widgets |
| **Paint** | Drawing canvas with tools, colors, and shapes |
| **Welcome** | Onboarding and getting started guide |

### New Apps

| App | Description |
|---|---|
| **Browser** | Integrated web browser using DuckDuckGo for search |
| **Weather** | Real-time weather using OpenWeatherMap API |

## Demo
Visit <[LumiOS](https://lxtimer.github.io/LumiOS/)> for live Demo

## Project Structure

```
LumiOS/
├── index.html
├── assets/
│   ├── icons/
│   ├── wallpaper/
│   └── LumiOS-1.png, LumiOS-2.png
├── css/
│   ├── apps/
│   │   ├── browser.css      # Browser app
│   │   ├── weather.css      # Weather app
│   │   └── [other app styles]
│   ├── theme/
│   ├── ui/
│   └── main.css
├── js/
│   ├── apps/
│   │   ├── browser.js       # Browser app
│   │   ├── weather.js       # Weather app
│   │   └── [other apps]
│   ├── systems/    # Particles, theme handling
│   ├── ui/         # Window management, taskbar
│   ├── utils/      # Helper functions
│   └── main.js
└── README.md
```

## Installation

1. Clone or download the repository
2. Open `index.html` in a modern browser (Chrome, Firefox, Edge)


## Credits
Inspired by Puter, Prozilla OS, and OS.js.