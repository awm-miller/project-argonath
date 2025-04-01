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
  NodeToolbar,
  getNodesBounds,
  getViewportForBounds,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  ChevronDown,
  Search,
  Plus,
  Download,
  Save,
  Folder,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import { ConnectionModal } from './ConnectionModal';
import { CustomNodeModal } from './CustomNodeModal';
import { SaveMindMapModal } from './SaveMindMapModal';
import { LoadMindMapModal } from './LoadMindMapModal';
import { EditNodeModal } from './EditNodeModal';
import { toPng } from 'html-to-image';

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
  const [classifications, setClassifications] = useState<{ name: string }[]>(
    []
  );
  const { getNodes } = useReactFlow();

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
      // Update existing edge
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
      // Create new edge
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
      if (overwriteId) {
        const { error } = await supabase
          .from('mindmaps')
          .update({
            data: { nodes, edges },
            classification,
          })
          .eq('id', overwriteId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('mindmaps').insert([
          {
            name,
            classification,
            data: { nodes, edges },
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

  const downloadImage = (dataUrl: string) => {
    const a = document.createElement('a');
    a.setAttribute('download', 'mindmap.png');
    a.setAttribute('href', dataUrl);
    a.click();
  };

  const handleDownloadImage = () => {
    const imageWidth = 1920;
    const imageHeight = 1080;

    const nodesBounds = getNodesBounds(getNodes());
    const viewport = getViewportForBounds(
      nodesBounds,
      imageWidth,
      imageHeight,
      0.5,
      2
    );

    toPng(document.querySelector('.react-flow__viewport') as HTMLElement, {
      backgroundColor: '#ffffff',
      width: imageWidth,
      height: imageHeight,
      style: {
        width: imageWidth,
        height: imageHeight,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    }).then(downloadImage);
    setIsActionsOpen(false);
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
                      onClick={handleDownloadImage}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm flex items-center"
                    >
                      <Download size={16} className="mr-2" />
                      Download as Image
                    </button>
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