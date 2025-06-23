'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, File, Folder, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCallback } from "react";

interface RepositoryPanelProps {
  repoUrl: string;
}

interface FileNode {
  name: string;
  type: "file" | "folder";
  path: string;
  status: "clean" | "warning" | "error";
  children?: FileNode[];
  issues?: number;
}

// Simple file editor modal component
const FileEditorModal = ({ 
  open, 
  fileName, 
  filePath, 
  initialContent, 
  onClose 
}: { 
  open: boolean; 
  fileName: string; 
  filePath: string; 
  initialContent: string; 
  onClose: () => void; 
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">{fileName}</DialogTitle>
        </DialogHeader>
        <div className="text-xs text-slate-400 mb-2">{filePath}</div>
        <div className="bg-slate-900 p-4 rounded-md overflow-auto">
          <pre className="text-slate-200 font-mono text-sm whitespace-pre-wrap">
            {initialContent}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const RepositoryPanel = ({ repoUrl }: RepositoryPanelProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["src"]));

  // Modal editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorFile, setEditorFile] = useState<{ name: string; path: string } | null>(null);
  const [editorContent, setEditorContent] = useState<string>("");

  // Simulate fetching file contents (for demo)
  const fetchFileContent = useCallback((path: string) => {
    // Placeholders: show fake file contents
    return `// Contents of ${path}\n\nLorem ipsum dolor sit amet...`;
  }, []);

  const handleFileClick = (file: FileNode) => {
    if (file.type === "file") {
      setEditorFile({ name: file.name, path: file.path });
      setEditorContent(fetchFileContent(file.path));
      setEditorOpen(true);
    }
  };

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      console.log("Repository analysis completed");
    }, 3000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getStatusBadge = (status: string, issues?: number) => {
    if (status === "clean") return null;
    return (
      <Badge 
        variant="outline" 
        className={`ml-2 text-xs ${
          status === "error" 
            ? "text-red-400 border-red-400" 
            : "text-yellow-400 border-yellow-400"
        }`}
      >
        {issues} {issues === 1 ? "issue" : "issues"}
      </Badge>
    );
  };

  const repositoryStructure: FileNode[] = [
    {
      name: "src",
      type: "folder",
      path: "src",
      status: "warning",
      issues: 3,
      children: [
        {
          name: "components",
          type: "folder",
          path: "src/components",
          status: "clean",
          children: [
            { name: "Header.tsx", type: "file", path: "src/components/Header.tsx", status: "warning", issues: 1 },
            { name: "Footer.tsx", type: "file", path: "src/components/Footer.tsx", status: "clean" },
            { name: "Button.tsx", type: "file", path: "src/components/Button.tsx", status: "clean" }
          ]
        },
        {
          name: "services",
          type: "folder",
          path: "src/services",
          status: "error",
          issues: 2,
          children: [
            { name: "user.service.ts", type: "file", path: "src/services/user.service.ts", status: "error", issues: 2 },
            { name: "api.service.ts", type: "file", path: "src/services/api.service.ts", status: "clean" }
          ]
        },
        { name: "App.tsx", type: "file", path: "src/App.tsx", status: "clean" },
        { name: "index.ts", type: "file", path: "src/index.ts", status: "clean" }
      ]
    },
    {
      name: "tests",
      type: "folder",
      path: "tests",
      status: "warning",
      issues: 1,
      children: [
        { name: "app.test.ts", type: "file", path: "tests/app.test.ts", status: "warning", issues: 1 },
        { name: "utils.test.ts", type: "file", path: "tests/utils.test.ts", status: "clean" }
      ]
    },
    { name: "package.json", type: "file", path: "package.json", status: "clean" },
    { name: "README.md", type: "file", path: "README.md", status: "clean" }
  ];

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.path} style={{ marginLeft: `${depth * 20}px` }}>
        {node.type === "folder" ? (
          <Collapsible
            open={expandedFolders.has(node.path)}
            onOpenChange={() => toggleFolder(node.path)}
          >
            <CollapsibleTrigger className="flex items-center w-full text-left py-1 hover:bg-slate-700/50 rounded px-2">
              {expandedFolders.has(node.path) ? (
                <ChevronDown className="w-4 h-4 mr-1" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-1" />
              )}
              <Folder className="w-4 h-4 mr-2 text-blue-400" />
              <span className="text-slate-200">{node.name}</span>
              {getStatusBadge(node.status, node.issues)}
            </CollapsibleTrigger>
            <CollapsibleContent>
              {node.children && renderFileTree(node.children, depth + 1)}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <div
            className="flex items-center py-1 px-2 hover:bg-slate-700/70 rounded cursor-pointer"
            onClick={() => handleFileClick(node)}
            role="button"
            tabIndex={0}
          >
            <File className="w-4 h-4 mr-2 text-slate-400" />
            <span className="text-slate-200">{node.name}</span>
            {getStatusBadge(node.status, node.issues)}
            <div className="ml-auto">
              {getStatusIcon(node.status)}
            </div>
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* File Tree */}
      <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Repository Structure</CardTitle>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Re-analyze
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {renderFileTree(repositoryStructure)}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Modal Editor */}
      <FileEditorModal
        open={editorOpen}
        fileName={editorFile?.name || ""}
        filePath={editorFile?.path || ""}
        initialContent={editorContent}
        onClose={() => setEditorOpen(false)}
      />

      {/* Analysis Summary */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Total Files</span>
              <Badge variant="outline" className="text-slate-300">47</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-400">Clean Files</span>
              <Badge className="bg-emerald-500/20 text-emerald-400">44</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-yellow-400">With Warnings</span>
              <Badge className="bg-yellow-500/20 text-yellow-400">2</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-red-400">With Errors</span>
              <Badge className="bg-red-500/20 text-red-400">1</Badge>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700">
            <h4 className="text-sm font-medium text-white mb-2">Recent Issues</h4>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                <div className="text-xs">
                  <div className="text-slate-200">Null check missing</div>
                  <div className="text-slate-400">user.service.ts:42</div>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
                <div className="text-xs">
                  <div className="text-slate-200">Unused import</div>
                  <div className="text-slate-400">Header.tsx:5</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RepositoryPanel;
