const React = window.React;
const ReactDOM = window.ReactDOM;
const ReactFlow = window.ReactFlow;

const { useState } = React;

// --- Custom Node Component ---
const CustomNode = ({ data }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = (event) => {
    event.stopPropagation(); // Prevent React Flow pane drag
    setShowTooltip(!showTooltip);
  };

  // Return a Fragment instead of an outer div
  return React.createElement(
    React.Fragment,
    null, // No props needed for the fragment
    React.createElement(ReactFlow.Handle, {
      type: 'target',
      position: ReactFlow.Position.Bottom,
      className: 'opacity-0',
    }),
    React.createElement(ReactFlow.Handle, {
      type: 'source',
      position: ReactFlow.Position.Bottom,
      className: 'opacity-0',
    }),
    // Apply the click handler and custom class to the content div instead
    React.createElement(
      'div',
      { className: 'node-content', onClick: handleClick },
      data.imageUrl &&
        React.createElement('img', { src: data.imageUrl, alt: data.label }),
      React.createElement('div', { className: 'node-label' }, data.label)
    ),
    showTooltip &&
      data.description &&
      React.createElement(
        'div',
        { className: 'node-tooltip' },
        data.description
      )
  );
};

// --- Custom Edge Component ---
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, data }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Use StraightEdge path calculation logic (simplified)
  const edgePath = `M ${sourceX},${sourceY}L ${targetX},${targetY}`;

  const centerX = (sourceX + targetX) / 2;
  const centerY = (sourceY + targetY) / 2;

  const handleClick = (event) => {
    event.stopPropagation();
    setShowTooltip(!showTooltip);
  };

  return React.createElement(
    React.Fragment,
    null,
    // Path for interaction (larger click area)
    React.createElement('path', {
      d: edgePath,
      fill: 'none',
      stroke: 'transparent',
      strokeWidth: 20,
      className: 'react-flow__edge-interaction',
      onClick: handleClick,
    }),
    // Actual visible path
    React.createElement('path', {
      id: id,
      className: `react-flow__edge-path ${
        data?.strength === 'weak' ? 'weak' : ''
      }`,
      d: edgePath,
      markerEnd: undefined, // Adjust if markers are needed
    }),
    // Edge Tooltip using EdgeLabelRenderer
    showTooltip &&
      data?.description &&
      React.createElement(
        ReactFlow.EdgeLabelRenderer,
        null,
        React.createElement(
          'div',
          {
            style: {
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${centerX}px,${centerY}px)`,
              pointerEvents: 'none',
            },
            className: 'edge-tooltip',
          },
          data.description
        )
      )
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

// --- Main App Component ---
const MindMapViewer = () => {
  const dataScript = document.getElementById('mindmap-data');
  let initialNodes = [];
  let initialEdges = [];
  let initialViewport = { x: 0, y: 0, zoom: 1 }; // Default viewport

  try {
    const rawData = JSON.parse(
      dataScript.textContent.replace('/* MAP_DATA_PLACEHOLDER */', '{}')
    );

    // Ensure nodes and edges are arrays
    initialNodes = Array.isArray(rawData.nodes) ? rawData.nodes : [];
    initialEdges = Array.isArray(rawData.edges) ? rawData.edges : [];

    // Set node/edge types and classes correctly for the template
    initialNodes = initialNodes.map((node) => ({ ...node, type: 'custom' }));
    initialEdges = initialEdges.map((edge) => ({
      ...edge,
      type: 'custom',
      className: edge.data?.strength === 'weak' ? 'weak' : '',
    }));

    // Check if viewport data exists (optional, future enhancement)
    if (rawData.viewport) {
      initialViewport = rawData.viewport;
    }
  } catch (e) {
    console.error('Error parsing mind map data:', e);
    // Display an error message in the viewer itself
    return React.createElement(
      'div',
      { style: { padding: '20px', color: 'red' } },
      'Error loading mind map data. Check console.'
    );
  }

  // Close tooltips when clicking the background pane
  const onPaneClick = () => {
    // Need a way to trigger state change in children... This is tricky without context.
    // For simplicity, we might omit this for the static viewer, or
    // potentially re-render the whole thing, which isn't ideal.
    // Let's omit background click closing for now in the static export.
  };

  return React.createElement(
    ReactFlow.default,
    {
      nodeTypes: nodeTypes,
      edgeTypes: edgeTypes,
      defaultNodes: initialNodes, // Use defaultNodes/Edges to set initial state
      defaultEdges: initialEdges,
      defaultViewport: initialViewport, // Use the stored/default viewport
      minZoom: 0.2,
      maxZoom: 2,
      nodesDraggable: true,
      nodesConnectable: false,
      elementsSelectable: true,
      // onPaneClick: onPaneClick, // Omit background close for simplicity
    },
    React.createElement(ReactFlow.Controls),
    React.createElement(ReactFlow.Background)
  );
};

// --- Render the App ---
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(MindMapViewer));
