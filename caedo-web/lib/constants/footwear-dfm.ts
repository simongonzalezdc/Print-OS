/**
 * Footwear Design for Manufacturing (DFM) Rules
 * 
 * Rules for functional 3D printable shoes using TPU 90A.
 */

export const FOOTWEAR_DFM = {
    /** Minimum thickness of the outsole for durability */
    min_sole_thickness: 8.0,

    /** Recommended max thickness to keep weight reasonable */
    max_sole_thickness: 25.0,

    /** Minimum strap width for comfort against skin */
    min_strap_width: 15.0,

    /** Minimum strap thickness for structural integrity */
    min_strap_thickness: 3.0,

    /** Minimum radius for comfort on edges */
    min_edge_radius: 3.0,

    /** Depth of the heel cup for stability */
    heel_cup_depth: {
        min: 15.0,
        max: 25.0,
    },

    /** Tread pattern depth */
    tread_depth: {
        min: 2.0,
        max: 5.0,
    },

    /** Minimum wall thickness for TPU lattice structures */
    min_lattice_wall: 1.2,

    /** Recommended layer height for TPU 90A */
    recommended_layer_height: 0.28,

    /** Printer speed limit for TPU 90A */
    max_print_speed: 60,
} as const;

