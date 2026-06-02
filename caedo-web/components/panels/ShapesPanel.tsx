'use client';

import { useState } from 'react';
import { 
  Box, 
  Circle, 
  Triangle, 
  Hexagon, 
  Star,
  Minus,
  MoreHorizontal,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useSceneStore } from '@/lib/scene/store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * ShapesPanel - Quick access to primitive shapes
 * Similar to TinkerCAD's shape sidebar
 */

interface PrimitiveShape {
  id: string;
  name: string;
  icon: React.ReactNode;
  code: string;
  category: 'basic' | '3d' | '2d' | 'helper';
  description: string;
}

const PRIMITIVE_SHAPES: PrimitiveShape[] = [
  // Basic 3D Shapes
  {
    id: 'cube',
    name: 'Cube',
    icon: <Box className="w-5 h-5" />,
    category: 'basic',
    description: 'Simple cube',
    code: `const SIZE = 50;
const main = () => {
  return cuboid({ size: [SIZE, SIZE, SIZE], center: [0, 0, SIZE/2] });
};
module.exports = { main };`,
  },
  {
    id: 'box',
    name: 'Box',
    icon: <Box className="w-5 h-5" strokeWidth={1.5} />,
    category: 'basic',
    description: 'Rectangular box',
    code: `const WIDTH = 60;
const DEPTH = 40;
const HEIGHT = 30;
const main = () => {
  return cuboid({ size: [WIDTH, DEPTH, HEIGHT], center: [0, 0, HEIGHT/2] });
};
module.exports = { main };`,
  },
  {
    id: 'rounded-box',
    name: 'Rounded Box',
    icon: <Box className="w-5 h-5" strokeWidth={2} />,
    category: 'basic',
    description: 'Box with rounded edges',
    code: `const SIZE = 50;
const RADIUS = 5;
const main = () => {
  return roundedCuboid({ 
    size: [SIZE, SIZE, SIZE], 
    roundRadius: RADIUS,
    segments: 16,
    center: [0, 0, SIZE/2] 
  });
};
module.exports = { main };`,
  },
  {
    id: 'cylinder',
    name: 'Cylinder',
    icon: <Circle className="w-5 h-5" />,
    category: 'basic',
    description: 'Cylinder',
    code: `const RADIUS = 25;
const HEIGHT = 50;
const main = () => {
  return cylinder({ radius: RADIUS, height: HEIGHT, center: [0, 0, HEIGHT/2], segments: 32 });
};
module.exports = { main };`,
  },
  {
    id: 'sphere',
    name: 'Sphere',
    icon: <Circle className="w-5 h-5" fill="currentColor" fillOpacity={0.3} />,
    category: 'basic',
    description: 'Sphere',
    code: `const RADIUS = 30;
const main = () => {
  return sphere({ radius: RADIUS, center: [0, 0, RADIUS], segments: 32 });
};
module.exports = { main };`,
  },
  {
    id: 'cone',
    name: 'Cone',
    icon: <Triangle className="w-5 h-5" />,
    category: '3d',
    description: 'Cone shape',
    code: `const RADIUS = 30;
const HEIGHT = 50;
const main = () => {
  return cone({ radius: RADIUS, height: HEIGHT, center: [0, 0, HEIGHT/2] });
};
module.exports = { main };`,
  },
  {
    id: 'pyramid',
    name: 'Pyramid',
    icon: <Triangle className="w-5 h-5" fill="currentColor" fillOpacity={0.2} />,
    category: '3d',
    description: '4-sided pyramid',
    code: `const BASE = 50;
const HEIGHT = 40;
const main = () => {
  return pyramid({ base: BASE, height: HEIGHT, sides: 4 });
};
module.exports = { main };`,
  },
  {
    id: 'torus',
    name: 'Torus',
    icon: <Circle className="w-5 h-5" strokeWidth={3} />,
    category: '3d',
    description: 'Donut/ring shape',
    code: `const INNER_RADIUS = 15;
const OUTER_RADIUS = 30;
const main = () => {
  return translate([0, 0, OUTER_RADIUS], 
    torus({ innerRadius: INNER_RADIUS, outerRadius: OUTER_RADIUS, innerSegments: 16, outerSegments: 32 })
  );
};
module.exports = { main };`,
  },
  {
    id: 'tube',
    name: 'Tube',
    icon: <Circle className="w-5 h-5" strokeWidth={2} />,
    category: '3d',
    description: 'Hollow cylinder',
    code: `const OUTER_RADIUS = 30;
const INNER_RADIUS = 25;
const HEIGHT = 50;
const main = () => {
  return tube({ outerRadius: OUTER_RADIUS, innerRadius: INNER_RADIUS, height: HEIGHT, center: [0, 0, HEIGHT/2] });
};
module.exports = { main };`,
  },
  {
    id: 'wedge',
    name: 'Wedge',
    icon: <Minus className="w-5 h-5" style={{ transform: 'rotate(-30deg)' }} />,
    category: '3d',
    description: 'Ramp/wedge shape',
    code: `const WIDTH = 60;
const DEPTH = 40;
const HEIGHT = 30;
const main = () => {
  return wedge({ width: WIDTH, depth: DEPTH, height: HEIGHT });
};
module.exports = { main };`,
  },
  {
    id: 'hexagon',
    name: 'Hex Prism',
    icon: <Hexagon className="w-5 h-5" />,
    category: '3d',
    description: 'Hexagonal prism',
    code: `const RADIUS = 25;
const HEIGHT = 40;
const main = () => {
  return cylinder({ radius: RADIUS, height: HEIGHT, center: [0, 0, HEIGHT/2], segments: 6 });
};
module.exports = { main };`,
  },
  {
    id: 'star-prism',
    name: 'Star',
    icon: <Star className="w-5 h-5" />,
    category: '3d',
    description: 'Star-shaped prism',
    code: `const OUTER_RADIUS = 30;
const INNER_RADIUS = 15;
const HEIGHT = 20;
const POINTS = 5;
const main = () => {
  const starShape = star({ vertices: POINTS, outerRadius: OUTER_RADIUS, innerRadius: INNER_RADIUS });
  return extrudeLinear({ height: HEIGHT }, starShape);
};
module.exports = { main };`,
  },
  // Helper shapes
  {
    id: 'storage-box',
    name: 'Storage Box',
    icon: <Box className="w-5 h-5" strokeDasharray="4 2" />,
    category: 'helper',
    description: 'Hollow box with walls',
    code: `const SIZE = 80;
const HEIGHT = 50;
const WALL = 2.0;
const main = () => {
  const outer = cuboid({ size: [SIZE, SIZE, HEIGHT], center: [0, 0, HEIGHT/2] });
  const inner = cuboid({ size: [SIZE - WALL*2, SIZE - WALL*2, HEIGHT - WALL], center: [0, 0, HEIGHT/2 + WALL/2] });
  return subtract(outer, inner);
};
module.exports = { main };`,
  },
  {
    id: 'mounting-post',
    name: 'Mount Post',
    icon: <Circle className="w-5 h-5" strokeWidth={1} />,
    category: 'helper',
    description: 'Screw mounting post',
    code: `const POST_HEIGHT = 10;
const POST_DIAMETER = 8;
const HOLE_DIAMETER = 3.2; // M3 clearance
const main = () => {
  const post = cylinder({ radius: POST_DIAMETER/2, height: POST_HEIGHT, center: [0, 0, POST_HEIGHT/2], segments: 32 });
  const hole = cylinder({ radius: HOLE_DIAMETER/2, height: POST_HEIGHT + 1, center: [0, 0, POST_HEIGHT/2], segments: 24 });
  return subtract(post, hole);
};
module.exports = { main };`,
  },
  {
    id: 'rounded-plate',
    name: 'Base Plate',
    icon: <MoreHorizontal className="w-5 h-5" />,
    category: 'helper',
    description: 'Flat rounded plate',
    code: `const WIDTH = 100;
const DEPTH = 60;
const THICKNESS = 3;
const CORNER_RADIUS = 5;
const main = () => {
  return roundedCuboid({ 
    size: [WIDTH, DEPTH, THICKNESS], 
    roundRadius: CORNER_RADIUS,
    segments: 16,
    center: [0, 0, THICKNESS/2] 
  });
};
module.exports = { main };`,
  },
];

const CATEGORIES = [
  { id: 'basic', name: 'Basic Shapes', defaultOpen: true },
  { id: '3d', name: '3D Shapes', defaultOpen: true },
  { id: 'helper', name: 'Helpers', defaultOpen: false },
];

export function ShapesPanel() {
  const addObject = useSceneStore((state) => state.addObject);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(CATEGORIES.filter(c => c.defaultOpen).map(c => c.id))
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleAddShape = (shape: PrimitiveShape) => {
    try {
      // addObject expects (jscadCode: string, name?: string)
      addObject(shape.code, shape.name);
      toast.success(`Added ${shape.name}`);
    } catch (error) {
      toast.error(`Failed to add ${shape.name}`);
      console.error('Failed to add shape:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/50">
        <h2 className="text-sm font-semibold text-foreground/90">Shapes</h2>
        <p className="text-xs text-muted-foreground">Click to add to scene</p>
      </div>

      {/* Shape Categories */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
        {CATEGORIES.map((category) => {
          const shapes = PRIMITIVE_SHAPES.filter(s => s.category === category.id);
          const isExpanded = expandedCategories.has(category.id);

          return (
            <div key={category.id} className="space-y-1">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center gap-1 px-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                {category.name}
                <span className="ml-auto text-[10px] text-muted-foreground/50">
                  {shapes.length}
                </span>
              </button>

              {/* Shape Grid */}
              {isExpanded && (
                <div className="grid grid-cols-3 gap-1">
                  {shapes.map((shape) => (
                    <button
                      key={shape.id}
                      onClick={() => handleAddShape(shape)}
                      title={shape.description}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 p-2 rounded-md",
                        "bg-muted/30 hover:bg-muted/60 active:bg-muted",
                        "border border-transparent hover:border-border/50",
                        "transition-all duration-150",
                        "group"
                      )}
                    >
                      <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                        {shape.icon}
                      </div>
                      <span className="text-[10px] text-muted-foreground group-hover:text-foreground/80 truncate max-w-full">
                        {shape.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer tip */}
      <div className="px-3 py-2 border-t border-border/50 bg-muted/20">
        <p className="text-[10px] text-muted-foreground">
          💡 Use AI chat for complex shapes: &quot;Make a case for Raspberry Pi&quot;
        </p>
      </div>
    </div>
  );
}

