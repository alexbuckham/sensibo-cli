# Overview
This Sensibo CLI (Command Line Interface) utility is designed to interact with Sensibo devices through the Sensibo API. It allows users to control their Sensibo devices directly from the command line, providing functionalities such as turning devices on or off, setting temperature, mode, fan level, temperature unit, and swing mode.

# Installation
Before using this utility, ensure that you have Node.js installed on your system. You will also need to install the required dependencies by running npm install in the directory where the utility is located.

# Configuration
Upon first use, the utility will prompt you to enter your Sensibo API key. This key will be stored locally in a file within your home directory (~/.config/sensibo/.auth). For security, the file permissions are set to read/write for the owner only.

# Usage
The utility offers two primary commands: on and off, to control the state of your Sensibo devices.

## Turning a Device On
```bash
node sensibo.js on [deviceId] [options]
```
Options:

- `-t, --temperature <temperature>`: Set the target temperature.
- `-m, --mode <mode>`: Set the operating mode (e.g., cool, heat).
- `-f, --fanLevel <fanLevel>`: Set the fan level.
- `-u, --temperatureUnit <unit>`: Set the temperature unit (C or F).
- `-s, --swing <swing>`: Set the swing mode.

If the `deviceId` is not provided, the utility will prompt to choose a device from the list of available devices.

## Turning a Device Off
```bash
node sensibo.js off [deviceId]
```

If the deviceId is not provided, the utility will prompt to choose a device.

# Contributing
If you encounter any issues or have suggestions for improvement, please feel free to contribute to the project's repository.
