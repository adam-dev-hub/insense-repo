import paho.mqtt.client as mqtt
import time
import json
import random
from datetime import datetime

THINGSBOARD_HOST = 'mqtt.eu.thingsboard.cloud'
THINGSBOARD_PORT = 1883
UPDATE_INTERVAL = 180  # 3 minutes in seconds

# Animal name pools
COW_NAMES = ["Bessie", "Daisy", "Bella", "Luna", "Rosie", "Molly", "Buttercup", "Clover", "Poppy", "Lily"]
SHEEP_NAMES = ["Wooly", "Cotton", "Cloud", "Fluffy", "Snowball", "Marshmallow", "Puff", "Angel", "Pearl", "Misty"]
GOAT_NAMES = ["Billy", "Nanny", "Pepper", "Ginger", "Rocky", "Scout", "Rebel", "Dusty", "Shadow", "Bandit"]

class Animal:
    def __init__(self, animal_id, name, animal_type, has_illness=False, has_sensor_issue=False):
        self.animal_id = animal_id
        self.name = name
        self.animal_type = animal_type
        self.has_illness = has_illness
        self.has_sensor_issue = has_sensor_issue
        
        # Base location (Tunis area) - each animal gets slight offset
        self.base_lat = 36.0993 + random.uniform(-0.002, 0.002)
        self.base_lon = 9.5811 + random.uniform(-0.002, 0.002)
        
        # Health baseline
        self.battery_level = random.randint(75, 100)
        self.sensor_malfunction_counter = 0
        self.illness_progression = 0
        
        # Normal ranges by animal type
        self.normal_ranges = self.get_normal_ranges()
        
    def get_normal_ranges(self):
        """Get normal vital ranges for each animal type"""
        ranges = {
            'cow': {
                'temp': (37.5, 39.5),
                'bpm': (60, 80),
                'glucose': (3.5, 5.5),
                'breed': 'Holstein'
            },
            'sheep': {
                'temp': (38.5, 40.0),
                'bpm': (70, 90),
                'glucose': (3.0, 5.0),
                'breed': 'Merino'
            },
            'goat': {
                'temp': (38.5, 40.5),
                'bpm': (70, 95),
                'glucose': (3.2, 5.8),
                'breed': 'Nubian'
            }
        }
        return ranges.get(self.animal_type, ranges['cow'])
    
    def generate_telemetry(self):
        """Generate realistic telemetry data"""
        
        # Simulate sensor issues (random failures, wrong data) - but not too often!
        if self.has_sensor_issue and random.random() < 0.08:  # 8% chance per cycle
            self.sensor_malfunction_counter += 1
            
            if self.sensor_malfunction_counter % 4 == 1:  # Every 4th issue
                # Missing/corrupted data
                return {
                    "animalId": self.animal_id,
                    "name": self.name,
                    "type": self.animal_type,
                    "breed": self.normal_ranges.get('breed', 'Unknown'),
                    "rfid": f"RFID-{self.animal_id}",
                    "temperature": random.choice([0, 999, -50]),
                    "bpm": random.choice([0, 300, -1]),
                    "glucose": 0,
                    "bloodPressure": "ERROR",
                    "latitude": self.base_lat,
                    "longitude": self.base_lon,
                    "battery": self.battery_level,
                    "sensorStatus": "MALFUNCTION"
                }, "⚠️"
        
        # Normal operation
        temp_min, temp_max = self.normal_ranges['temp']
        bpm_min, bpm_max = self.normal_ranges['bpm']
        glucose_min, glucose_max = self.normal_ranges['glucose']
        
        # Simulate illness (progressive symptoms)
        if self.has_illness:
            self.illness_progression += random.uniform(0.5, 1.5)
            severity = min(self.illness_progression / 20, 1.0)  # 0 to 1
            
            # Elevated temperature
            temp_offset = severity * random.uniform(1.5, 3.0)
            temperature = round(random.uniform(temp_min, temp_max) + temp_offset, 1)
            
            # Elevated heart rate
            bpm_offset = severity * random.randint(15, 30)
            bpm = round(random.randint(bpm_min, bpm_max) + bpm_offset)            
            # Abnormal glucose
            glucose = round(random.uniform(glucose_min - 0.5, glucose_min + 0.2), 1)
            
            status = "SICK"
            icon = "🤒"
        else:
            # Healthy animal - normal variations
            temperature = round(random.uniform(temp_min, temp_max), 1)
            bpm = random.randint(bpm_min, bpm_max)
            glucose = round(random.uniform(glucose_min, glucose_max), 1)
            status = "HEALTHY"
            icon = "✅"
        
        # Blood pressure
        systolic = random.randint(110, 130) if not self.has_illness else random.randint(135, 155)
        diastolic = random.randint(70, 85) if not self.has_illness else random.randint(90, 105)
        
        # Location (slight movement)
        latitude = self.base_lat + random.uniform(-0.001, 0.001)
        longitude = self.base_lon + random.uniform(-0.001, 0.001)
        
        # Battery drain (more significant over 3 minutes)
        if random.random() < 0.003:  # 30% chance to drain
            self.battery_level = max(0, self.battery_level - random.randint(1, 2))
        
        data = {
            "animalId": self.animal_id,
            "name": self.name,
            "type": self.animal_type,
            "breed": self.normal_ranges.get('breed', 'Unknown'),
            "rfid": f"RFID-{self.animal_id}",
            "temperature": temperature,
            "bpm": bpm,
            "glucose": glucose,
            "bloodPressure": f"{systolic}/{diastolic}",
            "latitude": latitude,
            "longitude": longitude,
            "battery": self.battery_level,
            "sensorStatus": status
        }
        
        return data, icon


class DataAccumulator:
    def __init__(self, access_token):
        self.access_token = access_token
        self.animals = []
        
        # MQTT Client
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        self.client.username_pw_set(access_token)
        self.client.on_connect = self.on_connect
        self.connected = False
        
    def on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            self.connected = True
            print("✅ Data Accumulator connected to ThingsBoard!")
        else:
            print(f"❌ Connection failed, code {rc}")
    
    def connect(self):
        """Connect to ThingsBoard"""
        try:
            self.client.connect(THINGSBOARD_HOST, THINGSBOARD_PORT, 60)
            self.client.loop_start()
            time.sleep(1)
        except Exception as e:
            print(f"❌ Connection error: {e}")
    
    def add_animal(self, animal):
        """Add an animal to the accumulator"""
        self.animals.append(animal)
    
    def publish_all(self):
        """Publish telemetry for all animals in one payload"""
        if not self.connected:
            return
        
        animals_data = []
        status_messages = []
        
        for animal in self.animals:
            data, icon = animal.generate_telemetry()
            animals_data.append(data)
            
            status_msg = f"{icon} {animal.name}: Temp={data['temperature']}°C, BPM={data['bpm']}, Battery={data['battery']}%"
            status_messages.append(status_msg)
        
        # Create payload with all animals
        payload = {
            "animalData": json.dumps(animals_data),
            "totalAnimals": len(self.animals),
            "timestamp": int(datetime.now().timestamp() * 1000)
        }
        
        try:
            self.client.publish('v1/devices/me/telemetry', json.dumps(payload), 1)
            
            # Print status for each animal
            for msg in status_messages:
                print(f"   {msg}")
                
        except Exception as e:
            print(f"❌ Publish error: {e}")
    
    def disconnect(self):
        """Disconnect from ThingsBoard"""
        self.client.loop_stop()
        self.client.disconnect()


def get_user_input():
    """Get simulation parameters from user"""
    print("=" * 60)
    print("🐄 LIVESTOCK MONITORING - DATA ACCUMULATOR SIMULATOR 🐑")
    print("=" * 60)
    print()
    print("This simulator sends data from MULTIPLE animals through")
    print("a SINGLE ThingsBoard device (the data accumulator)")
    print(f"⏱️  Update interval: {UPDATE_INTERVAL // 60} minutes")
    print("=" * 60)
    print()
    
    # Number of animals
    while True:
        try:
            total_animals = int(input("📊 How many animals to simulate? (1-50): "))
            if 1 <= total_animals <= 50:
                break
            print("❌ Please enter a number between 1 and 50")
        except ValueError:
            print("❌ Please enter a valid number")
    
    print()
    
    # Number with illness
    while True:
        try:
            sick_count = int(input(f"🤒 How many should be sick? (0-{total_animals}): "))
            if 0 <= sick_count <= total_animals:
                break
            print(f"❌ Please enter a number between 0 and {total_animals}")
        except ValueError:
            print("❌ Please enter a valid number")
    
    print()
    
    # Number with sensor issues
    while True:
        try:
            sensor_issues = int(input(f"⚠️  How many with sensor problems? (0-{total_animals}): "))
            if 0 <= sensor_issues <= total_animals:
                break
            print(f"❌ Please enter a number between 0 and {total_animals}")
        except ValueError:
            print("❌ Please enter a valid number")
    
    print()
    print("=" * 60)
    print()
    
    return total_animals, sick_count, sensor_issues


def main():
    print()
    total_animals, sick_count, sensor_issues = get_user_input()
    
    print("🔧 SETUP INSTRUCTIONS:")
    print("=" * 60)
    print("Create ONE device in ThingsBoard:")
    print("1. Go to: https://eu.thingsboard.cloud")
    print("2. Devices → Add Device")
    print("3. Name: 'ESP32_Livestock_Accumulator' (or any name)")
    print("4. Copy the access token")
    print("5. Paste it below")
    print("=" * 60)
    print()
    
    # Get device token
    while True:
        token = input("Enter ThingsBoard device access token: ").strip()
        if len(token) >= 10:
            break
        print("❌ Token too short, please enter valid token")
    
    print()
    print("=" * 60)
    print("🐾 GENERATING ANIMALS...")
    print("=" * 60)
    print()
    
    # Create data accumulator
    accumulator = DataAccumulator(token)
    
    # Generate animals
    sick_indices = random.sample(range(total_animals), sick_count)
    sensor_issue_indices = random.sample(range(total_animals), sensor_issues)
    
    # Distribute animal types
    type_distribution = []
    for i in range(total_animals):
        if i % 3 == 0:
            type_distribution.append('cow')
        elif i % 3 == 1:
            type_distribution.append('sheep')
        else:
            type_distribution.append('goat')
    random.shuffle(type_distribution)
    
    # Create animals
    for i in range(total_animals):
        animal_type = type_distribution[i]
        
        # Select name from appropriate pool
        if animal_type == 'cow':
            name = random.choice(COW_NAMES)
        elif animal_type == 'sheep':
            name = random.choice(SHEEP_NAMES)
        else:
            name = random.choice(GOAT_NAMES)
        
        name = f"{name}_{i+1:03d}"
        animal_id = f"animal_{i+1:03d}"
        
        has_illness = i in sick_indices
        has_sensor_issue = i in sensor_issue_indices
        
        status_tags = []
        if has_illness:
            status_tags.append("🤒 SICK")
        if has_sensor_issue:
            status_tags.append("⚠️ SENSOR ISSUE")
        if not status_tags:
            status_tags.append("✅ HEALTHY")
        
        print(f"Animal {i+1}/{total_animals}: {name} ({animal_type.upper()}) - {', '.join(status_tags)}")
        
        animal = Animal(
            animal_id=animal_id,
            name=name,
            animal_type=animal_type,
            has_illness=has_illness,
            has_sensor_issue=has_sensor_issue
        )
        accumulator.add_animal(animal)
    
    print()
    print("=" * 60)
    print("🚀 STARTING SIMULATION...")
    print("=" * 60)
    print()
    
    # Connect
    accumulator.connect()
    time.sleep(2)
    
    if not accumulator.connected:
        print("❌ Failed to connect. Check your token and internet connection.")
        return
    
    print(f"📡 Publishing telemetry every {UPDATE_INTERVAL // 60} minutes ({UPDATE_INTERVAL} seconds)...")
    print("Press Ctrl+C to stop")
    print("=" * 60)
    print()
    
    # Main loop
    try:
        cycle = 1
        while True:
            print(f"📊 Cycle {cycle} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            accumulator.publish_all()
            
            # Show countdown for next update
            next_update = datetime.now().timestamp() + UPDATE_INTERVAL
            next_update_time = datetime.fromtimestamp(next_update).strftime('%H:%M:%S')
            print(f"⏳ Next update at: {next_update_time}")
            print()
            
            cycle += 1
            time.sleep(UPDATE_INTERVAL)
            
    except KeyboardInterrupt:
        print()
        print("=" * 60)
        print("🛑 Stopping simulation...")
        print("=" * 60)
        accumulator.disconnect()
        print("✅ Disconnected. Goodbye!")


if __name__ == "__main__":
    main()