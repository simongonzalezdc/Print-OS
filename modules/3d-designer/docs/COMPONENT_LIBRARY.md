# VoiceForge 3D - Component Library

> **Purpose:** Standard dimensions and specifications for common components that the AI can reference when generating enclosures, mounts, and brackets.

---

## 1. Single Board Computers

### Raspberry Pi Family

```typescript
const RASPBERRY_PI = {
  'pi-5': {
    name: 'Raspberry Pi 5',
    pcb: { width: 85, height: 56, thickness: 1.6 },
    mounting: {
      holes: [[3.5, 3.5], [61.5, 3.5], [3.5, 52.5], [61.5, 52.5]],
      pattern: 'standard-pi',
      screw: 'M2.5',
      standoff_height: 5,
    },
    total_height: 21, // with heatsink
    ports: {
      usb3: [{ x: 85, y: 8, w: 17, h: 16 }],
      usb2: [{ x: 85, y: 27, w: 14, h: 14 }],
      ethernet: { x: 85, y: 45, w: 16, h: 13.5 },
      hdmi: [
        { x: 25.5, y: -1, w: 8.5, h: 3.5 },
        { x: 38.5, y: -1, w: 8.5, h: 3.5 },
      ],
      usbc_power: { x: 11, y: -1, w: 9, h: 3.5 },
      sd_card: { x: -2, y: 22, w: 12, h: 14 },
      gpio: { x: 7.1, y: 29, w: 51, h: 5 },
    },
    heat_zones: [
      { x: 45, y: 30, r: 12, component: 'SoC' },
    ],
    power_consumption: 27, // watts max
    recommended_ventilation: true,
  },

  'pi-4': {
    name: 'Raspberry Pi 4 Model B',
    pcb: { width: 85.6, height: 56.5, thickness: 1.6 },
    mounting: {
      holes: [[3.5, 3.5], [61.5, 3.5], [3.5, 52.5], [61.5, 52.5]],
      pattern: 'standard-pi',
      screw: 'M2.5',
      standoff_height: 5,
    },
    total_height: 17,
    ports: {
      usb3: [{ x: 85.6, y: 8, w: 17, h: 16 }],
      usb2: [{ x: 85.6, y: 27, w: 14, h: 14 }],
      ethernet: { x: 85.6, y: 45, w: 16, h: 13.5 },
      hdmi: [
        { x: 26, y: -1, w: 8, h: 4.5 },
        { x: 39.5, y: -1, w: 8, h: 4.5 },
      ],
      usbc_power: { x: 10.6, y: -1, w: 9, h: 3 },
      sd_card: { x: -2, y: 22, w: 15, h: 12 },
      gpio: { x: 7.1, y: 29, w: 51, h: 5 },
    },
    heat_zones: [
      { x: 43, y: 28, r: 10, component: 'SoC' },
    ],
    power_consumption: 15, // watts max
    recommended_ventilation: true,
  },

  'pi-zero-2w': {
    name: 'Raspberry Pi Zero 2 W',
    pcb: { width: 65, height: 30, thickness: 1.6 },
    mounting: {
      holes: [[3.5, 3.5], [61.5, 3.5], [3.5, 26.5], [61.5, 26.5]],
      screw: 'M2.5',
      standoff_height: 3,
    },
    total_height: 5,
    ports: {
      mini_hdmi: { x: 12.4, y: -1, w: 11, h: 3.5 },
      micro_usb_data: { x: 41.4, y: -1, w: 8, h: 3 },
      micro_usb_power: { x: 54, y: -1, w: 8, h: 3 },
      sd_card: { x: -2, y: 8, w: 12, h: 14 },
      gpio: { x: 7.1, y: 1, w: 51, h: 5 },
    },
  },

  'pico': {
    name: 'Raspberry Pi Pico',
    pcb: { width: 51, height: 21, thickness: 1.0 },
    mounting: {
      holes: [[2, 4.8], [2, 16.2], [49, 4.8], [49, 16.2]],
      screw: 'M2',
      standoff_height: 2,
    },
    total_height: 3.5,
    pin_spacing: 17.78,
  },
};
```

### Arduino Family

```typescript
const ARDUINO = {
  'uno-r3': {
    name: 'Arduino Uno R3',
    pcb: { width: 68.6, height: 53.4, thickness: 1.6 },
    mounting: {
      holes: [[14, 2.5], [15.2, 50.8], [66, 7.6], [66, 35.6]],
      screw: 'M3',
      standoff_height: 4,
    },
    total_height: 15,
    ports: {
      usb_b: { x: 9, y: -4, w: 12, h: 11 },
      barrel_jack: { x: -3, y: 3.5, w: 14, h: 9 },
      reset_button: { x: 50, y: 49, r: 3 },
    },
  },

  'nano': {
    name: 'Arduino Nano',
    pcb: { width: 45, height: 18, thickness: 1.6 },
    pin_header_spacing: 15.24, // 0.6 inch
    total_height: 8,
  },

  'mega-2560': {
    name: 'Arduino Mega 2560',
    pcb: { width: 101.52, height: 53.3, thickness: 1.6 },
    mounting: {
      holes: [[14, 2.5], [15.2, 50.8], [90.2, 50.8], [96.5, 2.5]],
      screw: 'M3',
      standoff_height: 4,
    },
    total_height: 15,
  },
};
```

### ESP32 Family

```typescript
const ESP32 = {
  'devkit-v1': {
    name: 'ESP32 DevKit V1',
    pcb: { width: 48, height: 26, thickness: 1.6 },
    pin_header_spacing: 22.86,
    total_height: 9,
  },

  'wroom-32': {
    name: 'ESP32-WROOM-32',
    module: { width: 25.5, height: 18, thickness: 3.1 },
  },

  's3-devkit': {
    name: 'ESP32-S3 DevKitC',
    pcb: { width: 69, height: 26, thickness: 1.6 },
    pin_header_spacing: 22.86,
    total_height: 10,
  },
};
```

---

## 2. Motors and Actuators

### Stepper Motors

```typescript
const STEPPER_MOTORS = {
  'nema17': {
    name: 'NEMA 17 Stepper',
    face_size: 42.3,
    body_lengths: [20, 34, 40, 48, 60], // common lengths
    shaft: { diameter: 5, length: 24, flat: true },
    mounting: {
      pattern: 'square',
      spacing: 31,
      screw: 'M3',
    },
    pilot: { diameter: 22, depth: 2 },
    connector: { width: 10, height: 8, depth: 5 },
  },

  'nema23': {
    name: 'NEMA 23 Stepper',
    face_size: 56.4,
    body_lengths: [41, 56, 76, 112],
    shaft: { diameter: 6.35, length: 21 },
    mounting: {
      pattern: 'square',
      spacing: 47.1,
      screw: 'M5',
    },
    pilot: { diameter: 38.1, depth: 1.6 },
  },

  '28byj-48': {
    name: '28BYJ-48 Geared Stepper',
    body: { diameter: 28, length: 19 },
    mounting: {
      type: 'tabs',
      hole_spacing: 35,
      screw: 'M3',
    },
    shaft: { diameter: 5, flat_width: 3, length: 9 },
    connector: { width: 12, height: 6 },
  },
};
```

### Servo Motors

```typescript
const SERVOS = {
  'sg90': {
    name: 'SG90 Micro Servo',
    body: { width: 23, height: 12.2, length: 22.8 },
    mounting_tabs: {
      width: 32.2,
      height: 2.5,
      hole_spacing: 27.5,
      screw: 'M2',
    },
    shaft_offset: 6, // from centerline
    total_height: 22.7, // without horn
    horn_height: 4,
  },

  'mg996r': {
    name: 'MG996R Standard Servo',
    body: { width: 40.7, height: 19.7, length: 40.7 },
    mounting_tabs: {
      width: 54,
      height: 2.5,
      hole_spacing: 49,
      screw: 'M3',
    },
    total_height: 41,
  },
};
```

### DC Motors

```typescript
const DC_MOTORS = {
  '130-motor': {
    name: '130 Size DC Motor',
    body: { diameter: 20, length: 25 },
    shaft: { diameter: 2, length: 10 },
    mounting_tabs: { spacing: 15, screw: 'M2' },
  },

  'tt-motor': {
    name: 'TT Motor (Yellow)',
    body: { width: 22.5, height: 18.8, length: 69 },
    shaft_offset: { x: 9.5, y: 9.5 },
    shaft: { diameter: 5.5, flat_width: 3, length: 9 },
    mounting: {
      holes: [[3.5, 14], [3.5, 56], [19, 56]],
      screw: 'M3',
    },
  },
};
```

---

## 3. Displays

```typescript
const DISPLAYS = {
  'oled-128x64-i2c': {
    name: '0.96" OLED 128x64 I2C',
    pcb: { width: 27, height: 27.3, thickness: 1.6 },
    display: { width: 21.7, height: 10.9 },
    mounting: {
      holes: [[2.5, 2.5], [24.5, 2.5], [2.5, 24.8], [24.5, 24.8]],
      screw: 'M2',
    },
    visible_area: { x: 2.5, y: 7, w: 22, h: 11.5 },
  },

  'lcd-1602-i2c': {
    name: 'LCD 1602 with I2C Backpack',
    pcb: { width: 80, height: 36, thickness: 1.6 },
    mounting: {
      holes: [[2.5, 2.5], [77.5, 2.5], [2.5, 33.5], [77.5, 33.5]],
      screw: 'M2.5',
    },
    visible_area: { x: 8, y: 6.5, w: 64.5, h: 14.5 },
    total_height: 25, // with backpack
  },

  'tft-3.5-ili9341': {
    name: '3.5" TFT ILI9341 SPI',
    pcb: { width: 86, height: 55, thickness: 1.6 },
    display: { width: 74, height: 49 },
    mounting: {
      holes: [[3, 3], [83, 3], [3, 52], [83, 52]],
      screw: 'M3',
    },
    total_height: 15,
  },
};
```

---

## 4. Power Components

```typescript
const POWER_COMPONENTS = {
  'barrel-jack-5521': {
    name: '5.5x2.1mm Barrel Jack',
    body: { diameter: 11, length: 14 },
    panel_cutout: { diameter: 8 },
    nut: { width: 10, thickness: 3 },
    inner_pin: 2.1,
    outer: 5.5,
  },

  'usb-c-panel': {
    name: 'USB-C Panel Mount',
    cutout: { width: 9, height: 3.5, corner_radius: 1 },
    mounting_holes: { spacing: 20, screw: 'M2' },
  },

  'rocker-switch': {
    name: 'KCD1 Rocker Switch',
    cutout: { width: 21, height: 15, corner_radius: 2 },
    body_depth: 22,
  },

  'toggle-switch-mts': {
    name: 'MTS Mini Toggle Switch',
    cutout: { diameter: 6 },
    nut: { width: 9, thickness: 2 },
    body: { width: 13, height: 8, depth: 9 },
  },

  '18650-holder': {
    name: '18650 Battery Holder',
    cell_size: { diameter: 18.5, length: 65.5 },
    holder_size: { width: 21, height: 78, depth: 20 },
    clearance: 0.5,
  },
};
```

---

## 5. Sensors

```typescript
const SENSORS = {
  'hc-sr04': {
    name: 'HC-SR04 Ultrasonic Sensor',
    pcb: { width: 45, height: 20, thickness: 1.6 },
    transducers: {
      diameter: 16,
      spacing: 26, // center to center
      protrusion: 12,
    },
    mounting: {
      holes: [[1.5, 1.5], [43.5, 1.5], [1.5, 18.5], [43.5, 18.5]],
      screw: 'M2',
    },
    header: { pitch: 2.54, pins: 4, y: 10 },
  },

  'pir-hc-sr501': {
    name: 'HC-SR501 PIR Sensor',
    body: { diameter: 32, height: 24 },
    lens: { diameter: 23, height: 12 },
    mounting: { hole_spacing: 28, screw: 'M2' },
    total_height: 24,
    detection_angle: 120,
    cutout: { diameter: 24 }, // for lens to protrude
  },

  'dht22': {
    name: 'DHT22 Temperature/Humidity',
    body: { width: 25, height: 15.1, thickness: 7.7 },
    pins: { pitch: 2.54, count: 4 },
    grille_area: { x: 2, y: 2, w: 21, h: 8 },
  },
};
```

---

## 6. Connectors

```typescript
const CONNECTORS = {
  'rj45': {
    name: 'RJ45 Ethernet Jack',
    cutout: { width: 16, height: 13.5 },
    body_depth: 21,
  },

  'db9': {
    name: 'DB9 Connector',
    cutout: { width: 31, height: 12.5 },
    mounting_holes: { spacing: 25, screw: 'M3' },
  },

  'xt60': {
    name: 'XT60 Power Connector',
    body: { width: 16, height: 8, length: 16 },
    rating: '60A',
  },

  'jst-xh': {
    name: 'JST-XH Connector',
    pitch: 2.5,
    width_per_pin: 2.5,
    height: 9.8,
    depth: 6,
  },

  'dupont-header': {
    name: 'Dupont Header',
    pitch: 2.54,
    width_per_pin: 2.54,
    height: 8.5,
    depth: 2.5,
  },
};
```

---

## 7. Usage in AI Generation

When the AI receives a request like "Make a case for Raspberry Pi 4", it should:

1. **Look up component dimensions:**
```javascript
const component = RASPBERRY_PI['pi-4'];
```

2. **Calculate enclosure size with clearance:**
```javascript
const enclosure = {
  inner_width: component.pcb.width + CLEARANCE * 2,
  inner_height: component.pcb.height + CLEARANCE * 2,
  inner_depth: component.total_height + CLEARANCE,
  wall_thickness: 2.0,
};
```

3. **Add mounting features:**
```javascript
component.mounting.holes.forEach(([x, y]) => {
  addStandoff(x + CLEARANCE, y + CLEARANCE, 
              component.mounting.standoff_height,
              component.mounting.screw);
});
```

4. **Add port cutouts:**
```javascript
Object.entries(component.ports).forEach(([name, port]) => {
  addCutout(port.x, port.y, port.w + CLEARANCE, port.h + CLEARANCE);
});
```

5. **Add ventilation if needed:**
```javascript
if (component.recommended_ventilation) {
  addVentilationPattern(component.heat_zones);
}
```

---

## 8. Custom Component Definition

Users can add custom components via voice:

> "Remember that my custom sensor is 30x20mm with M2 mounting holes at the corners"

The AI stores this:
```javascript
CUSTOM_COMPONENTS['my-custom-sensor'] = {
  name: 'Custom Sensor',
  pcb: { width: 30, height: 20, thickness: 1.6 },
  mounting: {
    holes: [[2, 2], [28, 2], [2, 18], [28, 18]],
    screw: 'M2',
    standoff_height: 3,
  },
};
```

Then later: "Make a mount for my custom sensor" works correctly.

