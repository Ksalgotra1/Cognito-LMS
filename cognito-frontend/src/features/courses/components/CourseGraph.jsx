import React, { useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState, 
  MarkerType 
} from 'reactflow';
import 'reactflow/dist/style.css'; 
import { Info } from 'lucide-react';

//FIX: Define these OUTSIDE the component to prevent re-creation warnings
const nodeTypes = {};
const edgeTypes = {};

const getNodeStyle = (status) => {
  if (status === 'completed') return {
    background: '#2563EB', color: '#fff', border: 'none',
    borderRadius: '10px', padding: '10px 16px', fontSize: '12px', fontWeight: 600
  }
  if (status === 'current') return {
    background: '#1e293b', color: '#fff', border: 'none',
    borderRadius: '10px', padding: '10px 16px', fontSize: '12px', fontWeight: 600
  }
  if (status === 'available') return {
    background: '#fff', color: '#1e293b', border: '1.5px solid #2563EB',
    borderRadius: '10px', padding: '10px 16px', fontSize: '12px', fontWeight: 500
  }
  // locked
  return {
    background: '#f8fafc', color: '#94a3b8', border: '1.5px solid #e2e8f0',
    borderRadius: '10px', padding: '10px 16px', fontSize: '12px', fontWeight: 500
  }
}

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
    const createNode = (id, label, x, y, status = 'available') => ({
        id: String(id),
        data: { label },
        position: { x, y },
        sourcePosition: 'right',
        targetPosition: 'left',
        type: status === 'current' ? 'output' : 'default',
        style: getNodeStyle(status)
    });

    // --- HELPER: Create an Edge ---
    const createEdge = (source, target, isLocked = false) => ({
        id: `e${source}-${target}`,
        source: String(source),
        target: String(target),
        animated: true,
        style: { stroke: isLocked ? '#e2e8f0' : '#2563EB', strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: isLocked ? '#e2e8f0' : '#2563EB' },
    });

    // --- BUILD GRAPH ---
    
    // 1. The Target Course (Level 0)
    rawNodes.push(createNode(currentCourse.id, currentCourse.title, TARGET_X, 100, 'current'));

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
        
        rawNodes.push(createNode(parent.id, parent.title, parentX, parentY, parent.status));
        rawEdges.push(createEdge(parent.id, currentCourse.id, parent.status === 'locked'));

        // Level 2: Grandparents (If any)
        if (parent.prerequisites && parent.prerequisites.length > 0) {
            parent.prerequisites.forEach((grandparent, gpIndex) => {
                const gpX = parentX - LEVEL_WIDTH;
                // Offset grandparents slightly around their parent
                const gpY = parentY + ((gpIndex - 0.5) * 80); 

                rawNodes.push(createNode(grandparent.id, grandparent.title, gpX, gpY, grandparent.status));
                rawEdges.push(createEdge(grandparent.id, parent.id, grandparent.status === 'locked'));
            });
        }
        
        currentY += SPACING + ((parent.prerequisites?.length || 0) * 50);
    });

    return { initialNodes: rawNodes, initialEdges: rawEdges };
  }, [currentCourse, prerequisites]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Check if any course in the tree is locked
  const dataTree = currentCourse?.recursive_prerequisites ||
                   prerequisites?.map(p => ({ ...p, prerequisites: [] })) || [];

  let hasLockedCourse = false;
  dataTree.forEach(parent => {
    if (parent.status === 'locked') hasLockedCourse = true;
    (parent.prerequisites || []).forEach(gp => {
      if (gp.status === 'locked') hasLockedCourse = true;
    });
  });

  React.useEffect(() => {}, [initialNodes]);

  if (!currentCourse) return null;

  return (
    <div className="w-full">
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
      
      <div className="flex items-center gap-4 mt-3 px-1">
        {[
          { color: '#2563EB', label: 'Completed' },
          { color: '#1e293b', label: 'Current' },
          { color: '#fff', label: 'Available', border: '#2563EB' },
          { color: '#f8fafc', label: 'Locked', border: '#e2e8f0' },
        ].map(({ color, label, border }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div style={{ width: 10, height: 10, borderRadius: 3, background: color, border: border ? `1.5px solid ${border}` : 'none' }} />
            <span className="text-[11px] text-[#94a3b8]">{label}</span>
          </div>
        ))}
      </div>

      {hasLockedCourse && (
        <div className="mt-3 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <Info size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-[12px] text-amber-800 leading-snug">
            <span className="font-semibold">Advisory:</span> A <span className="font-semibold">Locked</span> status means that course's own prerequisites haven't been completed yet. Complete those first to make it available.
          </p>
        </div>
      )}
    </div>
  );
};

export default CourseGraph;