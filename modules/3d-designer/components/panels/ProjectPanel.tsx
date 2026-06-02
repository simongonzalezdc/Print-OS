'use client';

import { useState, useEffect } from 'react';
import { FolderOpen, Save, FilePlus, Download, Trash2, X, Loader2 } from 'lucide-react';
import { useSceneStore } from '@/lib/scene/store';
import { Project, DEFAULT_SCENE_SETTINGS } from '@/types';
import { localStorage } from '@/lib/storage/local';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

interface ProjectPanelProps {
  onClose: () => void;
}

/**
 * Project Management Panel
 * Handles New, Save, Load, and Export project operations
 */
export function ProjectPanel({ onClose }: ProjectPanelProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState('');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const project = useSceneStore((state) => state.project);
  const objects = useSceneStore((state) => state.objects);
  const loadProject = useSceneStore((state) => state.loadProject);

  // Load projects list on mount
  useEffect(() => {
    loadProjectsList();
  }, []);

  const loadProjectsList = async () => {
    setLoading(true);
    try {
      const list = await localStorage.listProjects();
      setProjects(list);
    } catch (error) {
      toast.error('Failed to load projects');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewProject = () => {
    setProjectName('');
    setShowNewDialog(true);
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    const newProject: Project = {
      id: nanoid(),
      name: projectName.trim(),
      objects: [],
      settings: DEFAULT_SCENE_SETTINGS,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await localStorage.saveProject(newProject);
      loadProject(newProject);
      toast.success('Project created');
      setShowNewDialog(false);
      setProjectName('');
      loadProjectsList();
    } catch (error) {
      toast.error('Failed to create project');
      console.error(error);
    }
  };

  const handleSaveProject = async () => {
    if (!project) {
      toast.error('No project loaded');
      return;
    }

    const name = projectName.trim() || project.name;
    if (!name) {
      toast.error('Please enter a project name');
      return;
    }

    try {
      const updatedProject: Project = {
        ...project,
        name,
        objects: Array.from(objects.values()),
        updatedAt: Date.now(),
      };
      await localStorage.saveProject(updatedProject);
      loadProject(updatedProject);
      toast.success('Project saved');
      setShowSaveDialog(false);
      setProjectName('');
      loadProjectsList();
    } catch (error) {
      toast.error('Failed to save project');
      console.error(error);
    }
  };

  const handleLoadProject = async (projectId: string) => {
    try {
      const loaded = await localStorage.loadProject(projectId);
      if (loaded) {
        loadProject(loaded);
        toast.success(`Loaded "${loaded.name}"`);
        onClose();
      } else {
        toast.error('Project not found');
      }
    } catch (error) {
      toast.error('Failed to load project');
      console.error(error);
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Delete project "${projectName}"? This cannot be undone.`)) {
      return;
    }

    try {
      await localStorage.deleteProject(projectId);
      toast.success('Project deleted');
      loadProjectsList();
    } catch (error) {
      toast.error('Failed to delete project');
      console.error(error);
    }
  };

  const handleExportProject = async () => {
    if (!project) {
      toast.error('No project to export');
      return;
    }

    try {
      const projectData = {
        ...project,
        objects: Array.from(objects.values()),
      };
      const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Project exported');
    } catch (error) {
      toast.error('Failed to export project');
      console.error(error);
    }
  };

  return (
    <div className="w-96 h-[calc(100vh-160px)] flex flex-col glass-pro-elevated rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-primary/10 to-transparent">
        <h2 className="font-semibold text-sm text-white">Projects</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Actions */}
      <div className="p-4 space-y-2 border-b border-white/10">
        <button
          onClick={handleNewProject}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-white border border-primary/30 transition-colors"
        >
          <FilePlus className="w-4 h-4" />
          <span className="text-sm">New Project</span>
        </button>

        {project && (
          <>
            <button
              onClick={() => {
                setProjectName(project.name);
                setShowSaveDialog(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span className="text-sm">Save Project</span>
            </button>
            <button
              onClick={handleExportProject}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Export as JSON</span>
            </button>
          </>
        )}
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-white/40" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8 text-white/40 text-sm">
            No saved projects
          </div>
        ) : (
          projects.map((proj) => (
            <div
              key={proj.id}
              className={`
                flex items-center justify-between p-3 rounded-lg border transition-colors
                ${project?.id === proj.id
                  ? 'bg-primary/20 border-primary/50'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
                }
              `}
            >
              <button
                onClick={() => handleLoadProject(proj.id)}
                className="flex-1 flex items-center gap-2 text-left"
              >
                <FolderOpen className="w-4 h-4 text-white/60" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">{proj.name}</div>
                  <div className="text-xs text-white/40">
                    {new Date(proj.updatedAt).toLocaleDateString()} • {proj.objects.length} objects
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleDeleteProject(proj.id, proj.name)}
                className="p-1.5 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                title="Delete project"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* New Project Dialog */}
      {showNewDialog && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-80">
            <h3 className="text-lg font-semibold mb-4">New Project</h3>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project name"
              className="w-full px-3 py-2 bg-background border border-border rounded-md mb-4 focus:outline-none focus:border-primary"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateProject();
                if (e.key === 'Escape') setShowNewDialog(false);
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateProject}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Create
              </button>
              <button
                onClick={() => setShowNewDialog(false)}
                className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Project Dialog */}
      {showSaveDialog && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-80">
            <h3 className="text-lg font-semibold mb-4">Save Project</h3>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project name"
              className="w-full px-3 py-2 bg-background border border-border rounded-md mb-4 focus:outline-none focus:border-primary"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveProject();
                if (e.key === 'Escape') setShowSaveDialog(false);
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveProject}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

