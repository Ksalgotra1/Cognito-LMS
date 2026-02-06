import React, { useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState, 
  MarkerType 
} from 'reactflow';
import 'reactflow/dist/style.css'; 

//FIX: Define these OUTSIDE the component to prevent re-creation warnings
const nodeTypes = {};
const edgeTypes = {};

const CourseGraph = ({ currentCourse, prerequisites }) => { 
  
  // 1. Calculate Layout (Manual "Level" System)
  const { initialNodes, initialEdges } = useMemo(() => {
    // Safety check
    if (!currentCourse) return { initialNodes: [], initialEdges: [] };

    const rawNodes = [];
    const rawEdges = [];
    
    // --- CONFIGURATION ---
    const LEVEL_WIDTH = 250; // Horizontal space between levels
    const TARGET_X = 500;    // Where the main course sits (Level 0)
    
    // --- HELPER: Create a Node ---
    const createNode = (id, label, x, y, isTarget = false) => ({
        id: String(id),
        data: { label },
        position: { x, y },
        sourcePosition: 'right',
        targetPosition: 'left',
        type: isTarget ? 'output' : 'default',
        style: { 
            background: isTarget ? '#4f46e5' : '#fff', 
            color: isTarget ? 'white' : '#ea580c', 
            border: isTarget ? 'none' : '2px solid #fdba74', 
            borderRadius: '12px',
            padding: '10px',
            width: 180,
            fontSize: '12px',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
        }
    });

    // --- HELPER: Create an Edge ---
    const createEdge = (source, target) => ({
        id: `e${source}-${target}`,
        source: String(source),
        target: String(target),
        animated: true,
        style: { stroke: '#9ca3af', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#9ca3af' },
    });

    // --- BUILD GRAPH ---
    
    // 1. The Target Course (Level 0)
    rawNodes.push(createNode(currentCourse.id, currentCourse.title, TARGET_X, 100, true));

    // 2. Process Prerequisites (Recursive)
    // We check if the backend sent the new recursive data, otherwise fallback to simple list
    const dataTree = currentCourse.recursive_prerequisites || 
                     prerequisites?.map(p => ({ ...p, prerequisites: [] })) || [];

    let currentY = 0;
    const SPACING = 100;

    dataTree.forEach((parent) => {
        // Level 1: Immediate Parent
        const parentX = TARGET_X - LEVEL_WIDTH;
        const parentY = currentY + 50;
        
        rawNodes.push(createNode(parent.id, parent.title, parentX, parentY));
        rawEdges.push(createEdge(parent.id, currentCourse.id));

        // Level 2: Grandparents (If any)
        if (parent.prerequisites && parent.prerequisites.length > 0) {
            parent.prerequisites.forEach((grandparent, gpIndex) => {
                const gpX = parentX - LEVEL_WIDTH;
                // Offset grandparents slightly around their parent
                const gpY = parentY + ((gpIndex - 0.5) * 80); 

                rawNodes.push(createNode(grandparent.id, grandparent.title, gpX, gpY));
                rawEdges.push(createEdge(grandparent.id, parent.id));
            });
        }
        
        currentY += SPACING + ((parent.prerequisites?.length || 0) * 50);
    });

    return { initialNodes: rawNodes, initialEdges: rawEdges };
  }, [currentCourse, prerequisites]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Force update when data changes
  React.useEffect(() => {
     // This empty dependency array effect isn't strictly needed for the layout update 
     // (useMemo handles it), but it helps React Flow reset sometimes.
  }, [initialNodes]);

  if (!currentCourse) return null;

  return (
    <div className="w-full h-[350px] bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        // PASS STATIC OBJECTS
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        attributionPosition="bottom-right"
      >
        <Background color="#ccc" gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default CourseGraph;