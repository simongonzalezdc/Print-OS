/**
 * Footwear Size Grading Utility
 * 
 * Provides logic for scaling footwear models between standard sizes.
 * Based on the Paris Point (EU) and Brannock (US/UK) systems.
 */

export interface SizeChart {
  system: 'EU' | 'US' | 'UK';
  size: number;
}

export class SizeGrader {
  // Constants for grading
  static readonly PARIS_POINT_MM = 6.666; // 1/3 cm
  static readonly BRANNOCK_POINT_MM = 8.466; // 1/3 inch
  
  // Base reference: EU 42 is typically 280mm long (last length)
  static readonly REF_EU_SIZE = 42;
  static readonly REF_LAST_LENGTH_MM = 280;
  static readonly REF_LAST_WIDTH_MM = 98;

  /**
   * Calculates the target last length for a given EU size
   */
  static getLengthForEU(size: number): number {
    const diff = size - this.REF_EU_SIZE;
    return this.REF_LAST_LENGTH_MM + (diff * this.PARIS_POINT_MM);
  }

  /**
   * Calculates scaling factor between two EU sizes
   */
  static getScaleFactor(fromSize: number, toSize: number): number {
    const fromLen = this.getLengthForEU(fromSize);
    const toLen = this.getLengthForEU(toSize);
    return toLen / fromLen;
  }

  /**
   * Generates a full grading table for a base model
   */
  static generateGradingTable(baseSize: number, range: [number, number]) {
    const table = [];
    for (let s = range[0]; s <= range[1]; s++) {
      table.push({
        size: s,
        length: this.getLengthForEU(s),
        scale: this.getScaleFactor(baseSize, s)
      });
    }
    return table;
  }

  /**
   * Converts US Men's to EU
   */
  static usToEU(usSize: number): number {
    return Math.round(usSize + 33); // Rough approximation
  }
}
