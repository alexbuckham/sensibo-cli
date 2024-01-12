const fs = require('fs-extra');
const path = require('path');
const readlineSync = require('readline-sync');
const program = require('commander').program;
const axios = require('axios');
const os = require('os');
const cache = require('./cache.js');


const API_BASE = 'https://home.sensibo.com/api/v2/';
const CONFIG_DIR = path.join(os.homedir(), '.config', 'sensibo');
const AUTH_FILE = path.join(CONFIG_DIR, '.auth');

let apiKey = '';

process.on('SIGINT', () => {
  console.log('\nOperation cancelled by user.');
  process.exit(0);
});


async function getApiKey() {
  try {
    if (await fs.pathExists(AUTH_FILE)) {
      // Ensure the file has the right permissions when it exists
      await fs.chmod(AUTH_FILE, 0o600);
      return await fs.readFile(AUTH_FILE, 'utf8');
    } else {
      console.log('Sensibo API key not found.');
      const key = readlineSync.question('Enter your Sensibo API key: ', {
        hideEchoBack: true, // This hides the API key while typing
      });

      await fs.ensureDir(CONFIG_DIR);
      await fs.writeFile(AUTH_FILE, key);
      await fs.chmod(AUTH_FILE, 0o600); // Set file permissions to read/write for the owner only
      return key;
    }
  } catch (error) {
    console.error('Error handling API key:', error.message);
    process.exit(1);
  }
}

// ES6 style IIFE (Immediately Invoked Function Expression) for async initialization
(async () => {
  apiKey = await getApiKey();
  program.parse(process.argv);
})();

async function changeDeviceState({ deviceId, on, mode = 'cool', fanLevel = 'auto', targetTemperature, temperatureUnit = 'C', swing }) {
  try {
    const payload = {
      acState: {
        on: on ?? true, // Default to true if not provided
        mode,
        fanLevel,
        targetTemperature: parseInt(targetTemperature),
        temperatureUnit,
        swing
      }
    };

    // Remove undefined properties
    Object.keys(payload.acState).forEach(key => payload.acState[key] === undefined && delete payload.acState[key]);

	console.log(payload)

    const response = await axios.post(`${API_BASE}/pods/${deviceId}/acStates?apiKey=${apiKey}`, payload);
    console.log(`Changed state of device ${deviceId}.`);
  } catch (error) {
	  console.log(error)
    console.error('Error changing device state:', error.message);
  }
}

async function fetchDeviceDetails(deviceId) {
  const cacheKey = `deviceDetails_${deviceId}`;
  const cachedDetails = await cache().get(cacheKey);

  if (cachedDetails) {
    return cachedDetails;
  }

  try {
    const response = await axios.get(`${API_BASE}/pods/${deviceId}`, {
      params: { apiKey, fields: '*' }
    });

    const deviceDetails = response.data.result;
    await cache().put(cacheKey, deviceDetails, 24 * 60 * 60 * 1000); // Cache for 24 hours
    return deviceDetails;
  } catch (error) {
    console.error(`Error fetching details for device ${deviceId}:`, error.message);
    return null;
  }
}

async function fetchDevices() {
  const cacheKey = 'allDevices';
  const cachedDevices = await cache().get(cacheKey);

  if (cachedDevices) {
    return cachedDevices;
  }

  try {
    const devicesResponse = await axios.get(`${API_BASE}/users/me/pods`, {
      params: { apiKey }
    });

    const devices = devicesResponse.data.result;
    const detailedDevices = [];

    for (const device of devices) {
      const details = await fetchDeviceDetails(device.id);
      if (details) {
        detailedDevices.push({
          id: device.id,
          name: details.room.name
        });
      }
    }

    // Cache the retrieved devices for 24 hours
    await cache().put(cacheKey, detailedDevices, 5 * 60 * 60 * 1000); // 24 hours

    return detailedDevices;
  } catch (error) {
    console.error('Error fetching devices:', error.message);
    return [];
  }
}

async function selectDevice() {
  const devices = await fetchDevices();
  if (devices.length === 0) {
    console.log('No devices found.');
    process.exit(0);
  }

  const selection = readlineSync.keyInSelect(
    devices.map(device => `${device.name} (${device.id})`),
    'Choose a device'
  );

  return devices[selection].id;
}

program
  .command('on [deviceId]')
  .description('Turn on a Sensibo device')
  .option('-t, --temperature <temperature>', 'Set target temperature')
  .option('-m, --mode <mode>', 'Set mode (e.g., cool, heat)')
  .option('-f, --fanLevel <fanLevel>', 'Set fan level')
  .option('-u, --temperatureUnit <unit>', 'Set temperature unit (e.g., C, F)')
  .option('-s, --swing <swing>', 'Set swing mode')
  .action(async (deviceId, cmdObj) => {
    const { temperature, mode, fanLevel, temperatureUnit, swing } = cmdObj;

    if (!deviceId) {
      deviceId = await selectDevice();
    }

    await changeDeviceState({
      deviceId,
      targetTemperature: temperature,
      mode,
      fanLevel,
      temperatureUnit,
      swing
    });
  });


program
  .command('off [deviceId]')
  .description('Turn off a Sensibo device')
  .action(async (deviceId) => {
    if (!deviceId) {
      deviceId = await selectDevice();
    }
    await changeDeviceState(deviceId, false);
  });

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
