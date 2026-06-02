'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, FolderOpen, Plus, Save, Edit2, Upload } from 'lucide-react';
import { useSceneStore } from '@/lib/scene/store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProjectMenuProps {
  className?: string;
}

export function ProjectMenu({ className }: ProjectMenuProps) {
  const project = useSceneStore((state) => state.project);
  const createProject = useSceneStore((state) => state.createProject);
  const saveProject = useSceneStore((state) => state.saveProject);
  const openProject = useSceneStore((state) => state.openProject);
  const renameProject = useSceneStore((state) => state.renameProject);
  const listProjects = useSceneStore((state) => state.listProjects);
  const addObject = useSceneStore((state) => state.addObject);

  const [isOpen, setIsOpen] = useState(false);
  const [projectList, setProjectList] = useState(() => listProjects());
  const [importing, setImporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProjectList(listProjects());
  }, [listProjects, project]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentProjectName = project?.name ?? 'No project';
  const recentProjects = useMemo(() => projectList.slice(0, 5), [projectList]);

  const handleNewProject = () => {
    const name = window.prompt('Project name', 'Untitled Project');
    if (name === null) return;
    const newProject = createProject(name.trim() || 'Untitled Project');
    toast.success(`Created project "${newProject.name}"`);
    setIsOpen(false);
  };

  const handleSaveProject = () => {
    const result = saveProject();
    if (result) {
      toast.success(`Saved "${result.name}"`);
    } else {
      toast.error('No project to save');
    }
    setIsOpen(false);
  };

  const handleOpenProject = (id: string) => {
    const loaded = openProject(id);
    if (loaded) {
      toast.success(`Opened "${loaded.name}"`);
    } else {
      toast.error('Failed to open project');
    }
    setIsOpen(false);
  };

  const handleRenameProject = () => {
    if (!project) return;
    const name = window.prompt('Rename project', project.name);
    if (name === null || name.trim() === '' || name === project.name) return;
    renameProject(name.trim());
    toast.success(`Renamed project to "${name.trim()}"`);
    setIsOpen(false);
  };

  const handleImportSTL = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setIsOpen(false);
    const toastId = toast.loading(`Importing ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/v1/printfarm/projects/import-stl', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to import STL');

      const data = await res.json();
      if (data.success && data.suggestedCode) {
        addObject(data.suggestedCode, `Imported: ${file.name}`);
        toast.success(`Successfully imported and reconstructed ${file.name}`, { id: toastId });
      } else {
        throw new Error('No code generated');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(`Failed to import ${file.name}`, { id: toastId });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('relative', className)} ref={menuRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/80 border border-gray-700 text-sm font-medium text-gray-200 hover:text-white hover:border-gray-600 transition-colors"
      >
        <span className="truncate max-w-[180px]">{currentProjectName}</span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 rounded-lg border border-gray-800 bg-gray-900 shadow-2xl z-50">
          <div className="p-3 border-b border-gray-800 text-xs text-gray-400">
            Manage projects
          </div>

          <div className="p-3 space-y-2">
            <button
              onClick={handleNewProject}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-gray-800 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>

            <button
              onClick={handleSaveProject}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-gray-800 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Project
            </button>

            <button
              onClick={handleRenameProject}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-gray-800 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Rename Project
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600/20 text-sm text-blue-200 hover:bg-blue-600/30 border border-blue-500/30 transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {importing ? 'Importing...' : 'Import STL/3MF'}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".stl,.3mf"
              onChange={handleImportSTL}
            />
          </div>

          <div className="border-t border-gray-800">
            <div className="px-3 py-2 text-xs uppercase text-gray-500 tracking-wide">
              Recent Projects
            </div>
            {recentProjects.length === 0 && (
              <div className="px-3 pb-3 text-sm text-gray-500">
                No saved projects yet
              </div>
            )}
            <div className="max-h-48 overflow-y-auto">
              {recentProjects.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => handleOpenProject(proj.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                    proj.id === project?.id
                      ? 'bg-blue-600/20 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  )}
                >
                  <FolderOpen className="w-4 h-4 shrink-0 text-gray-500" />
                  <div className="flex flex-col text-xs">
                    <span className="font-medium text-sm">{proj.name}</span>
                    <span className="text-gray-500">
                      {new Date(proj.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

