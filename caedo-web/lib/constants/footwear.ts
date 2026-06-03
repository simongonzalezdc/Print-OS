/**
 * Footwear Sizing and Anatomical Constants
 * 
 * Supports Adult EU sizes 38-48.
 * Based on ISO standards and technical shoemaking data.
 */

export interface ShoeSize {
    eu: number;
    usMen: number;
    usWomen: number;
    uk: number;
    footLengthMm: number;
}

/**
 * Adult Shoe Size Database
 * Optimized for CAEDO design generation.
 */
export const SHOE_SIZES: Record<number, ShoeSize> = {
    38: { eu: 38, usMen: 5.5, usWomen: 7, uk: 5, footLengthMm: 244 },
    39: { eu: 39, usMen: 6.5, usWomen: 8, uk: 6, footLengthMm: 250 },
    40: { eu: 40, usMen: 7, usWomen: 8.5, uk: 6.5, footLengthMm: 257 },
    41: { eu: 41, usMen: 8, usWomen: 9.5, uk: 7.5, footLengthMm: 264 },
    42: { eu: 42, usMen: 8.5, usWomen: 10, uk: 8, footLengthMm: 270 },
    43: { eu: 43, usMen: 9.5, usWomen: 11, uk: 9, footLengthMm: 277 },
    44: { eu: 44, usMen: 10, usWomen: 11.5, uk: 9.5, footLengthMm: 283 },
    45: { eu: 45, usMen: 11, usWomen: 12.5, uk: 10, footLengthMm: 290 },
    46: { eu: 46, usMen: 12, usWomen: 13.5, uk: 11, footLengthMm: 296 },
    47: { eu: 47, usMen: 13, usWomen: 14.5, uk: 12, footLengthMm: 303 },
    48: { eu: 48, usMen: 14, usWomen: 15.5, uk: 13, footLengthMm: 309 },
};

/**
 * Foot Width Categories
 * Multiplier for standard regular width
 */
export const WIDTH_FACTORS = {
    NARROW: 0.95,
    REGULAR: 1.0,
    WIDE: 1.05,
    EXTRA_WIDE: 1.1,
} as const;

export type WidthCategory = keyof typeof WIDTH_FACTORS;

/**
 * Default design size (User Preference)
 */
export const DEFAULT_SHOE_SIZE_EU = 44;
