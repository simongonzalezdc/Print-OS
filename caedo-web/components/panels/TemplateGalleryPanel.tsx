'use client';

import { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronRight, 
  ChevronDown, 
  Footprints, 
  Cpu, 
  Monitor, 
  Archive, 
  Anchor,
  Star,
  Zap,
  Loader2
} from 'lucide-react';
import { useSceneStore } from '@/lib/scene/store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import templateIndex from '@/knowledge/templates/index.json';

interface Template {
  id: string;
  name: string;
  category: string;
  path: string;
  description: string;
  difficulty: string;
}

const CATEGORY_ICONS: Record<string, any> = {
  'footwear': Footprints,
  'desk-org': Monitor,
  'electronics': Cpu,
  'wall-mounts': Anchor,
  'storage': Archive
};

export function TemplateGalleryPanel() {
  const addObject = useSceneStore((state) => state.addObject);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['footwear']));
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    return templateIndex.templates.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || t.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleUseTemplate = async (template: Template) => {
    setIsLoading(template.id);
    try {
      const response = await fetch(`/knowledge/templates/${template.path}`);
      if (!response.ok) throw new Error('Failed to load template file');
      const code = await response.text();
      
      addObject(code, template.name);
      toast.success(`Loaded ${template.name}`);
    } catch (error) {
      console.error('Failed to load template:', error);
      toast.error('Failed to load template');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div 
      className="h-full flex flex-col bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      role="region"
      aria-label="Template Gallery"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50">
        <h2 id="gallery-title" className="text-sm font-bold uppercase tracking-wider text-foreground/90">Template Gallery</h2>
        <div className="mt-2 relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search templates..."
            aria-label="Search templates"
            className="w-full bg-muted/30 border border-border/50 rounded-md py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4 scrollbar-thin scrollbar-thumb-primary/20">
        {templateIndex.categories.map((cat) => {
          const catTemplates = filteredTemplates.filter(t => t.category === cat.id);
          if (catTemplates.length === 0) return null;
          
          const isExpanded = expandedCategories.has(cat.id);
          const Icon = CATEGORY_ICONS[cat.id] || Star;

          return (
            <div key={cat.id} className="space-y-1">
              <button
                onClick={() => toggleCategory(cat.id)}
                aria-expanded={isExpanded}
                aria-controls={`category-content-${cat.id}`}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/30 transition-colors group"
              >
                <div className={cn(
                  "p-1 rounded bg-muted/50 group-hover:bg-primary/20 transition-colors",
                  cat.featured && "bg-primary/10"
                )}>
                  <Icon className={cn("w-3.5 h-3.5", cat.featured ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
                </div>
                <span className="text-xs font-bold uppercase tracking-tight text-foreground/80">{cat.name}</span>
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 ml-auto opacity-50" aria-hidden="true" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" aria-hidden="true" />
                )}
              </button>

              {isExpanded && (
                <div 
                  id={`category-content-${cat.id}`}
                  className="grid grid-cols-1 gap-1 pl-2"
                  role="list"
                  aria-label={`${cat.name} templates`}
                >
                  {catTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleUseTemplate(template)}
                      disabled={isLoading !== null}
                      role="listitem"
                      aria-label={`Use template: ${template.name}. ${template.description}`}
                      className="flex flex-col gap-1 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 border border-transparent hover:border-border/50 transition-all text-left group relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-bold text-foreground/90 group-hover:text-primary transition-colors">
                          {template.name}
                        </span>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-black/40 text-muted-foreground border border-white/5">
                          {template.difficulty}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {template.description}
                      </p>
                      
                      {isLoading === template.id && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center" aria-busy="true">
                          <Loader2 className="w-4 h-4 text-primary animate-spin" aria-hidden="true" />
                          <span className="sr-only">Loading template...</span>
                        </div>
                      )}

                      <div className="mt-1 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Zap className="w-3 h-3 text-primary" />
                        <span className="text-[9px] font-bold text-primary uppercase">Quick Load</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border/50 bg-primary/5">
        <p className="text-[10px] text-muted-foreground leading-tight">
          <span className="text-primary font-bold">PRO TIP:</span> All templates are fully parametric. Modify them using the Properties panel after adding.
        </p>
      </div>
    </div>
  );
}
