/**
 * Shoe Archetype Database
 * 
 * Defines diverse base models and parametric templates for footwear.
 */

export interface ShoeArchetype {
    id: string;
    name: string;
    description: string;
    defaultParams: Record<string, unknown>;
    templates: {
        sole: string;
        upper: string;
        lattice?: string;
    };
}

export const SHOE_ARCHETYPES: Record<string, ShoeArchetype> = {
    sport_slide: {
        id: 'sport_slide',
        name: 'Athletic Recovery Slide',
        description: 'Thick-souled slide for maximum comfort and recovery.',
        defaultParams: {
            soleThickness: 15,
            strapWidth: 40,
            latticeDensity: 0.35,
        },
        templates: {
            sole: 'slide_sole_base.jscad',
            upper: 'slide_strap_wide.jscad',
            lattice: 'gyroid_midsole.jscad',
        }
    },
    minimalist_sneaker: {
        id: 'minimalist_sneaker',
        name: 'Minimalist Sneaker',
        description: 'Low-profile sneaker with high flex and natural feel.',
        defaultParams: {
            soleThickness: 8,
            upperThickness: 3,
            latticeDensity: 0.15,
        },
        templates: {
            sole: 'sneaker_sole_flat.jscad',
            upper: 'sneaker_upper_mesh.jscad',
        }
    },
    orthotic_insert: {
        id: 'orthotic_insert',
        name: 'Medical Orthotic',
        description: 'Custom-contoured arch support for orthopedic use.',
        defaultParams: {
            archHeight: 25,
            heelCupDepth: 20,
        },
        templates: {
            sole: 'orthotic_base.jscad',
            upper: 'orthotic_top_cover.jscad',
            lattice: 'variable_stiffness_arch.jscad',
        }
    },
    daily_clog: {
        id: 'daily_clog',
        name: 'Daily Leisure Clog',
        description: 'One-piece molded shoe with ventilation and ease of entry.',
        defaultParams: {
            soleThickness: 12,
            heelDepth: 25,
            ventilationSize: 8,
        },
        templates: {
            sole: 'clog_molded_base.jscad',
            upper: 'clog_molded_base.jscad',
        }
    }
};
