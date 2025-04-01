import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  NodeProps,
  EdgeProps,
  Handle,
  Position,
  useReactFlow,
  EdgeLabelRenderer,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  ChevronDown,
  Search,
  Plus,
  Download,
  Upload,
  Save,
  Folder,
  FileCode,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import { ConnectionModal } from './ConnectionModal';
import { CustomNodeModal } from './CustomNodeModal';
import { SaveMindMapModal } from './SaveMindMapModal';
import { LoadMindMapModal } from './LoadMindMapModal';
import { EditNodeModal } from './EditNodeModal';

interface CustomNodeData {
  label: string;
  type: 'profile' | 'custom';
  imageUrl?: string;
  description?: string;
}

interface CustomEdgeData {
  strength: 'strong' | 'weak';
  description?: string;
}

interface MindMap {
  id: string;
  name: string;
  classification: string;
  created_at: string;
}

const CustomNode = ({ data, id }: NodeProps<CustomNodeData>) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { setNodes } = useReactFlow();

  const handleClick = () => {
    setShowTooltip(!showTooltip);
  };

  return (
    <div
      className="relative bg-white rounded-lg shadow-md p-4 cursor-move"
      onClick={handleClick}
    >
      <Handle
        id="target"
        type="target"
        position={Position.Bottom}
        className="opacity-0"
      />
      <Handle id="source" type="source" position={Position.Bottom} />
      <div className="flex items-center space-x-3">
        {data.imageUrl && (
          <img
            src={data.imageUrl}
            alt={data.label}
            className="w-8 h-8 rounded-full"
          />
        )}
        <div>
          <div className="font-medium text-gray-900">{data.label}</div>
          {showTooltip && data.description && (
            <div className="absolute z-10 mt-2 p-2 bg-white rounded-md shadow-lg border border-gray-200 text-sm text-gray-600 max-w-xs">
              {data.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps<CustomEdgeData>) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { setEdges } = useReactFlow();
  const edgePath = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;

  const handleDoubleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const edge = { id, data };
    const customEvent = new CustomEvent('editConnection', { detail: edge });
    window.dispatchEvent(customEvent);
  };

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setShowTooltip(!showTooltip);
  };

  return (
    <>
      <path
        className="react-flow__edge-hit-area"
        d={edgePath}
        strokeWidth={25}
        fill="none"
        stroke="transparent"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      />
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={2}
        stroke="#666"
        strokeDasharray={data?.strength === 'weak' ? '5,5' : undefined}
      />
      {showTooltip && data?.description && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${
                (sourceX + targetX) / 2
              }px, ${(sourceY + targetY) / 2}px)`,
              pointerEvents: 'none',
              zIndex: 1000,
            }}
            className="bg-white rounded-md shadow-md p-4 text-sm border border-gray-200 w-64"
          >
            {data.description}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

function MindMap() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [isCustomNodeModalOpen, setIsCustomNodeModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(
    null
  );
  const [selectedNode, setSelectedNode] = useState<Node<CustomNodeData> | null>(
    null
  );
  const [selectedEdge, setSelectedEdge] = useState<Edge<CustomEdgeData> | null>(
    null
  );
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [savedMindMaps, setSavedMindMaps] = useState<MindMap[]>([]);
  const [classifications, setClassifications] = useState<{ name: string }[]>([]);
  const { getNodes, getEdges } = useReactFlow();

  useEffect(() => {
    const handleEditConnection = (event: CustomEvent<Edge>) => {
      setSelectedEdge(event.detail);
      setIsConnectionModalOpen(true);
    };

    window.addEventListener(
      'editConnection',
      handleEditConnection as EventListener
    );
    return () =>
      window.removeEventListener(
        'editConnection',
        handleEditConnection as EventListener
      );
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      setIsActionsOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchClassifications();
    fetchSavedMindMaps();
  }, []);

  const fetchClassifications = async () => {
    try {
      const { data, error } = await supabase
        .from('user_classifications')
        .select('name')
        .order('level', { ascending: true });

      if (error) throw error;
      setClassifications(data || []);
    } catch (error) {
      console.error('Error fetching classifications:', error);
    }
  };

  const fetchSavedMindMaps = async () => {
    try {
      const { data, error } = await supabase
        .from('mindmaps')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedMindMaps(data || []);
    } catch (error) {
      console.error('Error fetching mind maps:', error);
    }
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, short_description, image_url')
        .ilike('name', `%${term}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching profiles:', error);
    }
  };

  const calculateNodePosition = () => {
    const existingNodes = getNodes();
    if (!existingNodes.length) {
      return { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 50 };
    }

    const center = existingNodes.reduce(
      (acc, node) => ({
        x: acc.x + node.position.x,
        y: acc.y + node.position.y,
      }),
      { x: 0, y: 0 }
    );

    const avgX = center.x / existingNodes.length;
    const avgY = center.y / existingNodes.length;

    const angle = Math.random() * 2 * Math.PI;
    const distance = 250;

    return {
      x: avgX + Math.cos(angle) * distance,
      y: avgY + Math.sin(angle) * distance,
    };
  };

  const addNode = (profile: Profile) => {
    const position = calculateNodePosition();

    const newNode: Node<CustomNodeData> = {
      id: profile.id,
      type: 'custom',
      position,
      data: {
        label: profile.name,
        type: 'profile',
        imageUrl: profile.image_url,
        description: profile.short_description,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleCustomNodeSubmit = ({
    name,
    description,
  }: {
    name: string;
    description: string;
  }) => {
    const position = calculateNodePosition();

    const newNode: Node<CustomNodeData> = {
      id: `custom-${Date.now()}`,
      type: 'custom',
      position,
      data: {
        label: name,
        type: 'custom',
        description,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setIsCustomNodeModalOpen(false);
  };

  const onConnect = useCallback((params: Connection) => {
    setPendingConnection(params);
    setIsConnectionModalOpen(true);
  }, []);

  const handleConnectionSubmit = ({
    description,
    strength,
  }: {
    description: string;
    strength: 'strong' | 'weak';
  }) => {
    if (selectedEdge) {
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === selectedEdge.id
            ? {
                ...edge,
                data: {
                  ...edge.data,
                  description,
                  strength,
                },
              }
            : edge
        )
      );
      setSelectedEdge(null);
    } else if (pendingConnection) {
      const edge: Edge<CustomEdgeData> = {
        ...pendingConnection,
        id: `${pendingConnection.source}-${
          pendingConnection.target
        }-${Date.now()}`,
        type: 'custom',
        data: {
          strength,
          description,
        },
      };
      setEdges((eds) => addEdge(edge, eds));
      setPendingConnection(null);
    }
    setIsConnectionModalOpen(false);
  };

  const handleConnectionDelete = () => {
    if (selectedEdge) {
      setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdge.id));
      setSelectedEdge(null);
    }
    setIsConnectionModalOpen(false);
  };

  const handleNodeDoubleClick = (event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setSelectedNode(node);
    setIsEditModalOpen(true);
  };

  const handleNodeEdit = ({
    name,
    description,
  }: {
    name: string;
    description: string;
  }) => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id
          ? {
              ...node,
              data: {
                ...node.data,
                label: name,
                description,
              },
            }
          : node
      )
    );
  };

  const handleNodeDelete = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter(
        (edge) =>
          edge.source !== selectedNode.id && edge.target !== selectedNode.id
      )
    );
    setSelectedNode(null);
  };

  const exportToJSON = () => {
    const data = {
      nodes: getNodes(),
      edges: getEdges(),
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mindmap.json';
    link.click();
    URL.revokeObjectURL(url);
    setIsActionsOpen(false);
  };

  const exportToHTML = () => {
    const flowData = {
      nodes: getNodes(),
      edges: getEdges(),
    };

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mind Map Export</title>
        <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
        <script src="https://unpkg.com/reactflow@11.10.4/dist/reactflow.min.js"></script>
        <link href="https://unpkg.com/reactflow@11.10.4/dist/style.css" rel="stylesheet">
        <style>
          .react-flow__node {
            background: white;
            border-radius: 0.5rem;
            padding: 1rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .react-flow__handle {
            width: 8px;
            height: 8px;
            background: #555;
            border: 2px solid white;
          }
          .react-flow__edge-path {
            stroke: #666;
            stroke-width: 2;
          }
          .custom-node {
            background: white;
            border-radius: 0.5rem;
            padding: 1rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .custom-node img {
            width: 2rem;
            height: 2rem;
            border-radius: 9999px;
            margin-right: 0.75rem;
          }
          .custom-node-content {
            display: flex;
            align-items: center;
          }
          .custom-node-label {
            font-weight: 500;
            color: #111827;
          }
          .edge-label {
            background: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          }
        </style>
      </head>
      <body style="margin:0;width:100vw;height:100vh;">
        <div id="root" style="width:100%;height:100%;"></div>
        <script>
          const { ReactFlow, Background, Controls } = ReactFlowRenderer;
          
          const flowData = ${JSON.stringify(flowData)};
          
          function CustomNode({ data }) {
            return React.createElement('div', { className: 'custom-node' },
              React.createElement('div', { className: 'custom-node-content' },
                data.imageUrl && React.createElement('img', { src: data.imageUrl, alt: data.label }),
                React.createElement('div', { className: 'custom-node-label' }, data.label)
              )
            );
          }
          
          const nodeTypes = {
            custom: CustomNode
          };
          
          function Flow() {
            return React.createElement(ReactFlow, {
              nodes: flowData.nodes,
              edges: flowData.edges,
              nodeTypes: nodeTypes,
              fitView: true,
              attributionPosition: 'bottom-right'
            },
              React.createElement(Background),
              React.createElement(Controls)
            );
          }
          
          ReactDOM.createRoot(document.getElementById('root')).render(
            React.createElement(Flow)
          );
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mindmap.html';
    link.click();
    URL.revokeObjectURL(url);
    setIsActionsOpen(false);
  };

  const importFromJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.nodes && data.edges) {
          setNodes(data.nodes);
          setEdges(data.edges);
        }
      } catch (error) {
        console.error('Error importing data:', error);
      }
    };
    reader.readAsText(file);
    setIsActionsOpen(false);
  };

  const handleSaveMindMap = async ({
    name,
    classification,
    overwriteId,
  }: {
    name: string;
    classification: string;
    overwriteId?: string;
  }) => {
    try {
      const data = {
        nodes: getNodes(),
        edges: getEdges(),
      };

      if (overwriteId) {
        const { error } = await supabase
          .from('mindmaps')
          .update({
            name,
            data,
            classification,
          })
          .eq('id', overwriteId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('mindmaps').insert([
          {
            name,
            classification,
            data,
            creator: (await supabase.auth.getUser()).data.user?.id,
          },
        ]);

        if (error) throw error;
      }

      fetchSavedMindMaps();
    } catch (error) {
      console.error('Error saving mind map:', error);
    }
  };

  const handleLoadMindMap = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('mindmaps')
        .select('data')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data?.data) {
        setNodes(data.data.nodes);
        setEdges(data.data.edges);
      }
    } catch (error) {
      console.error('Error loading mind map:', error);
    }
  };

  const handleDeleteMindMap = async (id: string) => {
    try {
      // Get current user first
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error('Failed to get current user');
      }

      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Verify the mind map exists and check permissions
      const { data: mindMap, error: fetchError } = await supabase
        .from('mindmaps')
        .select('creator')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw new Error('Failed to fetch mind map');
      }

      if (!mindMap) {
        throw new Error('Mind map not found');
      }

      // Convert both IDs to strings for comparison
      const creatorId = String(mindMap.creator);
      const userId = String(currentUser.id);

      console.log('Debug - Creator ID:', creatorId);
      console.log('Debug - User ID:', userId);

      if (creatorId !== userId) {
        throw new Error('You do not have permission to delete this mind map');
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('mindmaps')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw new Error('Failed to delete mind map from database');
      }

      // Update local state only after successful database deletion
      setSavedMindMaps((maps) => maps.filter((map) => map.id !== id));

      // Clear current mind map if it was the one deleted
      const currentMap = savedMindMaps.find(m => m.id === id);
      if (currentMap) {
        setNodes([]);
        setEdges([]);
      }

    } catch (error) {
      console.error('Error deleting mind map:', error);
      // Show specific error message to user
      alert(error instanceof Error ? error.message : 'Failed to delete mind map');
      throw error; // Re-throw to be caught by the confirmation dialog
    }
  };

  return (
    <div className="h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex-1 max-w-md relative">
              <div className="relative">
                <Search
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search Sunlight profiles..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200">
                  {searchResults.map((profile) => (
                    <div
                      key={profile.id}
                      className="p-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => addNode(profile)}
                    >
                      <div className="flex items-center">
                        {profile.image_url && (
                          <img
                            src={profile.image_url}
                            alt={profile.name}
                            className="w-8 h-8 rounded-full mr-2"
                          />
                        )}
                        <div>
                          <div className="font-medium">{profile.name}</div>
                          <div className="text-sm text-gray-500 truncate">
                            {profile.short_description}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsCustomNodeModalOpen(true)}
                className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <Plus size={20} className="mr-2" />
                Add Custom Node
              </button>

              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsActionsOpen(!isActionsOpen);
                  }}
                  className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Actions
                  <ChevronDown size={20} className="ml-2" />
                </button>

                {isActionsOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                    <button
                      onClick={exportToJSON}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm flex items-center"
                    >
                      <Download size={16} className="mr-2" />
                      Export to JSON
                    </button>
                    <button
                      onClick={exportToHTML}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm flex items-center"
                    >
                      <FileCode size={16} className="mr-2" />
                      Export as HTML
                    </button>
                    <label className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm cursor-pointer block flex items-center">
                      <Upload size={16} className="mr-2" />
                      Import from JSON
                      <input
                        type="file"
                        accept=".json"
                        onChange={importFromJSON}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={() => {
                        setIsActionsOpen(false);
                        setIsSaveModalOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm flex items-center"
                    >
                      <Save size={16} className="mr-2" />
                      Save to Cloud
                    </button>
                    <button
                      onClick={() => {
                        setIsActionsOpen(false);
                        setIsLoadModalOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm flex items-center"
                    >
                      <Folder size={16} className="mr-2" />
                      Load from Cloud
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ height: 'calc(100vh - 200px)' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodeDoubleClick={handleNodeDoubleClick}
              fitView
              minZoom={0.2}
              maxZoom={1.5}
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
              nodesDraggable={true}
              nodesConnectable={true}
              elementsSelectable={true}
            >
              <Controls />
              <Background />
            </ReactFlow>
          </div>
        </div>
      </div>

      <ConnectionModal
        isOpen={isConnectionModalOpen}
        onClose={() => {
          setIsConnectionModalOpen(false);
          setPendingConnection(null);
          setSelectedEdge(null);
        }}
        onSubmit={handleConnectionSubmit}
        onDelete={selectedEdge ? handleConnectionDelete : undefined}
        initialData={selectedEdge?.data}
      />

      <CustomNodeModal
        isOpen={isCustomNodeModalOpen}
        onClose={() => setIsCustomNodeModalOpen(false)}
        onSubmit={handleCustomNodeSubmit}
      />

      <SaveMindMapModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSubmit={handleSaveMindMap}
        classifications={classifications}
        existingMaps={savedMindMaps}
      />

      <LoadMindMapModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
        onSelect={handleLoadMindMap}
        onDelete={handleDeleteMindMap}
        mindMaps={savedMindMaps}
      />

      <EditNodeModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedNode(null);
        }}
        onSave={handleNodeEdit}
        onDelete={handleNodeDelete}
        initialData={
          selectedNode?.data
            ? {
                name: selectedNode.data.label,
                description: selectedNode.data.description,
              }
            : { name: '', description: '' }
        }
      />
    </div>
  );
}

export default MindMap;