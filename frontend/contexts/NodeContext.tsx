'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { NODE_URL } from '@/lib/api';

interface NodeContextType {
  activeNode: string;
  setActiveNode: (url: string) => void;
  savedNodes: string[];
  addNode: (url: string) => void;
  removeNode: (url: string) => void;
}

const NodeContext = createContext<NodeContextType>({
  activeNode: NODE_URL,
  setActiveNode: () => {},
  savedNodes: [NODE_URL],
  addNode: () => {},
  removeNode: () => {},
});

export function NodeProvider({ children }: { children: React.ReactNode }) {
  const [activeNode, setActiveNodeState] = useState(NODE_URL);
  const [savedNodes, setSavedNodes] = useState<string[]>([NODE_URL]);

  useEffect(() => {
    const active = localStorage.getItem('activeNode') ?? NODE_URL;
    const saved = localStorage.getItem('savedNodes');
    setActiveNodeState(active);
    setSavedNodes(saved ? JSON.parse(saved) : [NODE_URL]);
  }, []);

  const setActiveNode = (url: string) => {
    setActiveNodeState(url);
    localStorage.setItem('activeNode', url);
  };

  const addNode = (url: string) => {
    if (savedNodes.includes(url)) return;
    const next = [...savedNodes, url];
    setSavedNodes(next);
    localStorage.setItem('savedNodes', JSON.stringify(next));
  };

  const removeNode = (url: string) => {
    const next = savedNodes.filter((n) => n !== url);
    setSavedNodes(next);
    localStorage.setItem('savedNodes', JSON.stringify(next));
    if (activeNode === url) setActiveNode(NODE_URL);
  };

  return (
    <NodeContext.Provider value={{ activeNode, setActiveNode, savedNodes, addNode, removeNode }}>
      {children}
    </NodeContext.Provider>
  );
}

export const useNode = () => useContext(NodeContext);
