// thingsboard-service.js
const TB_HOST = 'eu.thingsboard.cloud';
const TB_USERNAME = '';  // Your ThingsBoard login
const TB_PASSWORD = '';            // Your ThingsBoard password

let jwtToken = null;
let tokenExpiry = null;

export const thingsboardService = {
  /**
   * Login to ThingsBoard and get JWT token
   */
  async login() {
    try {
      console.log('🔐 Logging in to ThingsBoard...');
      
      const response = await fetch(`https://${TB_HOST}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: TB_USERNAME,
          password: TB_PASSWORD,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Login failed (${response.status}): ${error}`);
      }

      const data = await response.json();
      jwtToken = data.token;
      tokenExpiry = Date.now() + (9 * 60 * 60 * 1000); // Token valid for 9 hours
      
      console.log('✅ Successfully logged in to ThingsBoard');
      return jwtToken;
    } catch (error) {
      console.error('❌ Login error:', error.message);
      throw error;
    }
  },

  /**
   * Ensure we have a valid JWT token
   */
  async ensureAuthenticated() {
    // Check if token exists and hasn't expired
    if (!jwtToken || !tokenExpiry || Date.now() > tokenExpiry) {
      console.log('⚠️ Token expired or missing, logging in...');
      await this.login();
    }
    return jwtToken;
  },

  /**
   * Get device information by name
   * Returns the device UUID needed for API calls
   */
  async getDeviceByName(deviceName) {
    try {
      await this.ensureAuthenticated();

      console.log(`🔍 Looking up device: ${deviceName}`);

      const response = await fetch(
        `https://${TB_HOST}/api/tenant/devices?deviceName=${encodeURIComponent(deviceName)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Authorization': `Bearer ${jwtToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get device (${response.status})`);
      }

      const device = await response.json();
      
      if (!device || !device.id) {
        throw new Error(`Device '${deviceName}' not found`);
      }

      console.log('✅ Device found:', device.id.id);
      return device.id.id; // Return the device UUID
    } catch (error) {
      console.error('❌ Error getting device:', error.message);
      throw error;
    }
  },

  /**
   * Get latest telemetry data for a device
   */
  async getLatestTelemetry(deviceId, keys = []) {
    try {
      await this.ensureAuthenticated();

      const keysParam = keys.length > 0 ? `keys=${keys.join(',')}` : '';
      const url = `https://${TB_HOST}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?${keysParam}`;

      console.log('📡 Fetching telemetry...');

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${jwtToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch telemetry (${response.status})`);
      }

      const data = await response.json();
      console.log('✅ Telemetry received:', Object.keys(data).length, 'keys');
      return data;
    } catch (error) {
      console.error('❌ Error fetching telemetry:', error.message);
      throw error;
    }
  },

  /**
   * Get historical telemetry data
   */
  async getHistoricalTelemetry(deviceId, keys, startTs, endTs, limit = 100) {
    try {
      await this.ensureAuthenticated();

      const keysParam = keys.join(',');
      const url = `https://${TB_HOST}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=${keysParam}&startTs=${startTs}&endTs=${endTs}&limit=${limit}`;

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${jwtToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch historical data (${response.status})`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error fetching historical data:', error.message);
      throw error;
    }
  },

  /**
   * Clear stored credentials (logout)
   */
  logout() {
    jwtToken = null;
    tokenExpiry = null;
    console.log('🔓 Logged out');
  },
};

// Configuration
export const TB_CONFIG = {
  HOST: TB_HOST,
  DEVICE_NAME: 'ESP32_Livestock_Sim', // Your device name from ThingsBoard
  
  TELEMETRY_KEYS: [
    'temperature',
    'bpm',
    'glucose',
    'bloodPressure',
    'latitude',
    'longitude',
    'battery',
  ],
  
  NORMAL_RANGES: {
    temperature: { min: 37.5, max: 39.5, unit: '°C' },
    bpm: { min: 60, max: 80, unit: 'BPM' },
    glucose: { min: 3.5, max: 5.5, unit: 'mmol/L' },
    battery: { min: 20, max: 100, unit: '%' },
  },
};

export default thingsboardService;