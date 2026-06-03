/**
 * Standard Component Dimensions
 * 
 * Reference dimensions for common electronics, motors, and other components.
 * The AI uses these when generating enclosures, mounts, and brackets.
 * 
 * All dimensions in millimeters.
 */

// =============================================================================
// RASPBERRY PI FAMILY
// =============================================================================

export const RASPBERRY_PI = {
  PI_5: {
    name: 'Raspberry Pi 5',
    pcb: { width: 85, height: 56, thickness: 1.6 },
    mounting: {
      holes: [[3.5, 3.5], [61.5, 3.5], [3.5, 52.5], [61.5, 52.5]] as [number, number][],
      screw: 'M2.5' as const,
      standoffHeight: 5,
    },
    totalHeight: 21,
    ports: {
      usb3: { x: 85, y: 8, w: 17, h: 16 },
      usb2: { x: 85, y: 27, w: 14, h: 14 },
      ethernet: { x: 85, y: 45, w: 16, h: 13.5 },
      hdmi: [
        { x: 25.5, y: -1, w: 8.5, h: 3.5 },
        { x: 38.5, y: -1, w: 8.5, h: 3.5 },
      ],
      usbcPower: { x: 11, y: -1, w: 9, h: 3.5 },
      sdCard: { x: -2, y: 22, w: 12, h: 14 },
      gpio: { x: 7.1, y: 29, w: 51, h: 5 },
    },
    requiresVentilation: true,
    maxPower: 27, // watts
  },

  PI_4: {
    name: 'Raspberry Pi 4 Model B',
    pcb: { width: 85.6, height: 56.5, thickness: 1.6 },
    mounting: {
      holes: [[3.5, 3.5], [61.5, 3.5], [3.5, 52.5], [61.5, 52.5]] as [number, number][],
      screw: 'M2.5' as const,
      standoffHeight: 5,
    },
    totalHeight: 17,
    ports: {
      usb3: { x: 85.6, y: 8, w: 17, h: 16 },
      usb2: { x: 85.6, y: 27, w: 14, h: 14 },
      ethernet: { x: 85.6, y: 45, w: 16, h: 13.5 },
      hdmi: [
        { x: 26, y: -1, w: 8, h: 4.5 },
        { x: 39.5, y: -1, w: 8, h: 4.5 },
      ],
      usbcPower: { x: 10.6, y: -1, w: 9, h: 3 },
      sdCard: { x: -2, y: 22, w: 15, h: 12 },
      gpio: { x: 7.1, y: 29, w: 51, h: 5 },
    },
    requiresVentilation: true,
    maxPower: 15, // watts
  },

  PI_ZERO_2W: {
    name: 'Raspberry Pi Zero 2 W',
    pcb: { width: 65, height: 30, thickness: 1.6 },
    mounting: {
      holes: [[3.5, 3.5], [61.5, 3.5], [3.5, 26.5], [61.5, 26.5]] as [number, number][],
      screw: 'M2.5' as const,
      standoffHeight: 3,
    },
    totalHeight: 5,
    ports: {
      miniHdmi: { x: 12.4, y: -1, w: 11, h: 3.5 },
      microUsbData: { x: 41.4, y: -1, w: 8, h: 3 },
      microUsbPower: { x: 54, y: -1, w: 8, h: 3 },
      sdCard: { x: -2, y: 8, w: 12, h: 14 },
      gpio: { x: 7.1, y: 1, w: 51, h: 5 },
    },
    requiresVentilation: false,
    maxPower: 3, // watts
  },

  PICO: {
    name: 'Raspberry Pi Pico',
    pcb: { width: 51, height: 21, thickness: 1.0 },
    mounting: {
      holes: [[2, 4.8], [2, 16.2], [49, 4.8], [49, 16.2]] as [number, number][],
      screw: 'M2' as const,
      standoffHeight: 2,
    },
    totalHeight: 3.5,
    pinSpacing: 17.78,
    requiresVentilation: false,
  },
} as const;

// =============================================================================
// ARDUINO FAMILY
// =============================================================================

export const ARDUINO = {
  UNO_R3: {
    name: 'Arduino Uno R3',
    pcb: { width: 68.6, height: 53.4, thickness: 1.6 },
    mounting: {
      holes: [[14, 2.5], [15.2, 50.8], [66, 7.6], [66, 35.6]] as [number, number][],
      screw: 'M3' as const,
      standoffHeight: 4,
    },
    totalHeight: 15,
    ports: {
      usbB: { x: 9, y: -4, w: 12, h: 11 },
      barrelJack: { x: -3, y: 3.5, w: 14, h: 9 },
    },
  },

  NANO: {
    name: 'Arduino Nano',
    pcb: { width: 45, height: 18, thickness: 1.6 },
    pinHeaderSpacing: 15.24,
    totalHeight: 8,
  },

  MEGA_2560: {
    name: 'Arduino Mega 2560',
    pcb: { width: 101.52, height: 53.3, thickness: 1.6 },
    mounting: {
      holes: [[14, 2.5], [15.2, 50.8], [90.2, 50.8], [96.5, 2.5]] as [number, number][],
      screw: 'M3' as const,
      standoffHeight: 4,
    },
    totalHeight: 15,
  },
} as const;

// =============================================================================
// ESP32 FAMILY
// =============================================================================

export const ESP32 = {
  DEVKIT_V1: {
    name: 'ESP32 DevKit V1',
    pcb: { width: 48, height: 26, thickness: 1.6 },
    pinHeaderSpacing: 22.86,
    totalHeight: 9,
  },

  S3_DEVKIT: {
    name: 'ESP32-S3 DevKitC',
    pcb: { width: 69, height: 26, thickness: 1.6 },
    pinHeaderSpacing: 22.86,
    totalHeight: 10,
  },

  C3_MINI: {
    name: 'ESP32-C3 Mini',
    pcb: { width: 25.4, height: 18, thickness: 1.0 },
    totalHeight: 5,
  },
} as const;

// =============================================================================
// STEPPER MOTORS
// =============================================================================

export const STEPPER_MOTORS = {
  NEMA17: {
    name: 'NEMA 17 Stepper',
    faceSize: 42.3,
    bodyLengths: [20, 34, 40, 48, 60],
    shaft: { diameter: 5, length: 24, hasFlat: true },
    mounting: {
      pattern: 'square' as const,
      spacing: 31,
      screw: 'M3' as const,
    },
    pilot: { diameter: 22, depth: 2 },
  },

  NEMA23: {
    name: 'NEMA 23 Stepper',
    faceSize: 56.4,
    bodyLengths: [41, 56, 76, 112],
    shaft: { diameter: 6.35, length: 21, hasFlat: false },
    mounting: {
      pattern: 'square' as const,
      spacing: 47.1,
      screw: 'M5' as const,
    },
    pilot: { diameter: 38.1, depth: 1.6 },
  },

  '28BYJ_48': {
    name: '28BYJ-48 Geared Stepper',
    body: { diameter: 28, length: 19 },
    mounting: {
      type: 'tabs' as const,
      holeSpacing: 35,
      screw: 'M3' as const,
    },
    shaft: { diameter: 5, flatWidth: 3, length: 9 },
  },
} as const;

// =============================================================================
// SERVO MOTORS
// =============================================================================

export const SERVOS = {
  SG90: {
    name: 'SG90 Micro Servo',
    body: { width: 23, height: 12.2, length: 22.8 },
    mountingTabs: {
      width: 32.2,
      height: 2.5,
      holeSpacing: 27.5,
      screw: 'M2' as const,
    },
    shaftOffset: 6,
    totalHeight: 22.7,
    hornHeight: 4,
  },

  MG996R: {
    name: 'MG996R Standard Servo',
    body: { width: 40.7, height: 19.7, length: 40.7 },
    mountingTabs: {
      width: 54,
      height: 2.5,
      holeSpacing: 49,
      screw: 'M3' as const,
    },
    totalHeight: 41,
  },
} as const;

// =============================================================================
// DISPLAYS
// =============================================================================

export const DISPLAYS = {
  OLED_128X64_I2C: {
    name: '0.96" OLED 128x64 I2C',
    pcb: { width: 27, height: 27.3, thickness: 1.6 },
    display: { width: 21.7, height: 10.9 },
    mounting: {
      holes: [[2.5, 2.5], [24.5, 2.5], [2.5, 24.8], [24.5, 24.8]] as [number, number][],
      screw: 'M2' as const,
    },
    visibleArea: { x: 2.5, y: 7, w: 22, h: 11.5 },
  },

  LCD_1602_I2C: {
    name: 'LCD 1602 with I2C',
    pcb: { width: 80, height: 36, thickness: 1.6 },
    mounting: {
      holes: [[2.5, 2.5], [77.5, 2.5], [2.5, 33.5], [77.5, 33.5]] as [number, number][],
      screw: 'M2.5' as const,
    },
    visibleArea: { x: 8, y: 6.5, w: 64.5, h: 14.5 },
    totalHeight: 25,
  },
} as const;

// =============================================================================
// POWER COMPONENTS
// =============================================================================

export const POWER_COMPONENTS = {
  BARREL_JACK_5521: {
    name: '5.5x2.1mm Barrel Jack',
    body: { diameter: 11, length: 14 },
    panelCutout: { diameter: 8 },
    innerPin: 2.1,
    outerDiameter: 5.5,
  },

  USB_C_PANEL: {
    name: 'USB-C Panel Mount',
    cutout: { width: 9, height: 3.5, cornerRadius: 1 },
    mountingHoles: { spacing: 20, screw: 'M2' as const },
  },

  ROCKER_SWITCH_KCD1: {
    name: 'KCD1 Rocker Switch',
    cutout: { width: 21, height: 15, cornerRadius: 2 },
    bodyDepth: 22,
  },

  '18650_HOLDER': {
    name: '18650 Battery Holder',
    cellSize: { diameter: 18.5, length: 65.5 },
    holderSize: { width: 21, height: 78, depth: 20 },
  },
} as const;

// =============================================================================
// SENSORS
// =============================================================================

export const SENSORS = {
  HC_SR04: {
    name: 'HC-SR04 Ultrasonic',
    pcb: { width: 45, height: 20, thickness: 1.6 },
    transducers: {
      diameter: 16,
      spacing: 26,
      protrusion: 12,
    },
    mounting: {
      holes: [[1.5, 1.5], [43.5, 1.5], [1.5, 18.5], [43.5, 18.5]] as [number, number][],
      screw: 'M2' as const,
    },
  },

  PIR_HC_SR501: {
    name: 'HC-SR501 PIR',
    body: { diameter: 32, height: 24 },
    lens: { diameter: 23, height: 12 },
    mounting: { holeSpacing: 28, screw: 'M2' as const },
    cutout: { diameter: 24 },
    detectionAngle: 120,
  },

  DHT22: {
    name: 'DHT22 Temp/Humidity',
    body: { width: 25, height: 15.1, thickness: 7.7 },
    pins: { pitch: 2.54, count: 4 },
    grilleArea: { x: 2, y: 2, w: 21, h: 8 },
  },
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type RaspberryPiModel = keyof typeof RASPBERRY_PI;
export type ArduinoModel = keyof typeof ARDUINO;
export type ESP32Model = keyof typeof ESP32;
export type StepperMotorType = keyof typeof STEPPER_MOTORS;
export type ServoType = keyof typeof SERVOS;
export type DisplayType = keyof typeof DISPLAYS;
export type PowerComponent = keyof typeof POWER_COMPONENTS;
export type SensorType = keyof typeof SENSORS;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get enclosure inner dimensions for a component with clearance
 */
export function getEnclosureInnerSize(
  component: { pcb: { width: number; height: number }; totalHeight?: number },
  clearance: number = 0.3
): { width: number; height: number; depth: number } {
  return {
    width: component.pcb.width + clearance * 2,
    height: component.pcb.height + clearance * 2,
    depth: (component.totalHeight ?? 10) + clearance,
  };
}

/**
 * Generate standoff positions for a component
 */
export function getStandoffPositions(
  component: { mounting: { holes: [number, number][] } },
  clearance: number = 0.3
): [number, number][] {
  return component.mounting.holes.map(([x, y]) => [
    x + clearance,
    y + clearance,
  ]);
}

