'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Environment } from '@react-three/drei';
import { Suspense, useState, useEffect } from 'react';
import { Vector3 } from 'three';
import { AGENTS, DEFAULT_AGENT_STATE } from './agentsConfig';
import type { AgentState, AgentConfig } from './agentsConfig';
import AgentDesk from './AgentDesk';
import Floor from './Floor';
import Walls from './Walls';
import Lights from './Lights';
import AgentPanel from './AgentPanel';
import FileCabinet from './FileCabinet';
import Whiteboard from './Whiteboard';
import CoffeeMachine from './CoffeeMachine';
import PlantPot from './PlantPot';
import WallClock from './WallClock';
import FirstPersonControls from './FirstPersonControls';
import MovingAvatar from './MovingAvatar';

interface LiveAgent {
  id: string;
  name: string;
  emoji: string;
  color: string;
  role: string;
  currentTask: string;
  isActive: boolean;
}

export default function Office3D() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [interactionModal, setInteractionModal] = useState<string | null>(null);
  const [controlMode, setControlMode] = useState<'orbit' | 'fps'>('orbit');
  const [avatarPositions, setAvatarPositions] = useState<Map<string, any>>(new Map());
  const [liveAgents, setLiveAgents] = useState<LiveAgent[]>([]);
  const [agentConfigs, setAgentConfigs] = useState<AgentConfig[]>(AGENTS);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch live agent data from the office API
  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        const response = await fetch('/api/office');
        const data = await response.json();
        
        if (data.agents) {
          setLiveAgents(data.agents);
          
          // Create agent configs with live data, using grid positioning for multiple agents
          const updatedConfigs = data.agents.map((agent: LiveAgent, index: number) => {
            // Grid layout for multiple agents
            const gridSize = Math.ceil(Math.sqrt(data.agents.length));
            const row = Math.floor(index / gridSize);
            const col = index % gridSize;
            const spacing = 4;
            const offsetX = (col - (gridSize - 1) / 2) * spacing;
            const offsetZ = (row - (gridSize - 1) / 2) * spacing;
            
            return {
              id: agent.id,
              name: agent.name,
              emoji: agent.emoji,
              position: [offsetX, 0, offsetZ] as [number, number, number],
              color: agent.color,
              role: agent.role,
            };
          });
          
          setAgentConfigs(updatedConfigs);
        }
      } catch (error) {
        console.error('Failed to fetch agent data:', error);
        // Fallback to static config if API fails
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgentData();
    
    // Refresh data every 10 seconds
    const interval = setInterval(fetchAgentData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Convert live agent data to agent states format
  const getAgentState = (agentId: string): AgentState => {
    const liveAgent = liveAgents.find(a => a.id === agentId);
    if (!liveAgent) {
      return { ...DEFAULT_AGENT_STATE, id: agentId };
    }
    
    return {
      id: agentId,
      status: liveAgent.isActive ? 'working' : 'idle',
      currentTask: liveAgent.currentTask,
      model: liveAgent.isActive ? 'opus' : 'sonnet',
      tokensPerHour: liveAgent.isActive ? Math.floor(Math.random() * 1000) : 0,
      tasksInQueue: liveAgent.isActive ? Math.floor(Math.random() * 5) : 0,
      uptime: Math.floor(Math.random() * 30), // Mock uptime in days
    };
  };

  const handleDeskClick = (agentId: string) => {
    setSelectedAgent(agentId);
  };

  const handleClosePanel = () => {
    setSelectedAgent(null);
  };

  const handleFileCabinetClick = () => {
    setInteractionModal('memory');
  };

  const handleWhiteboardClick = () => {
    setInteractionModal('roadmap');
  };

  const handleCoffeeClick = () => {
    setInteractionModal('energy');
  };

  const handleCloseModal = () => {
    setInteractionModal(null);
  };

  const handleAvatarPositionUpdate = (id: string, position: any) => {
    setAvatarPositions(prev => new Map(prev).set(id, position));
  };

  // Definir obstáculos (muebles) - use live agent configs
  const obstacles = [
    // Desks - use live agent positions
    ...agentConfigs.map(agent => ({
      position: new Vector3(agent.position[0], 0, agent.position[2]),
      radius: 1.5
    })),
    // Archivador
    { position: new Vector3(-8, 0, -5), radius: 0.8 },
    // Pizarra
    { position: new Vector3(0, 0, -8), radius: 1.5 },
    // Máquina de café
    { position: new Vector3(8, 0, -5), radius: 0.6 },
    // Plantas
    { position: new Vector3(-7, 0, 6), radius: 0.5 },
    { position: new Vector3(7, 0, 6), radius: 0.5 },
    { position: new Vector3(-9, 0, 0), radius: 0.4 },
    { position: new Vector3(9, 0, 0), radius: 0.4 },
  ];

  return (
    <div className="fixed inset-0 bg-gray-900" style={{ height: '100vh', width: '100vw' }}>
      <Canvas
        camera={{ position: [0, 8, 12], fov: 60 }}
        shadows
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={
          <mesh>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial color="orange" />
          </mesh>
        }>
          {/* Iluminación */}
          <Lights />

          {/* Cielo y ambiente */}
          <Sky sunPosition={[100, 20, 100]} />
          <Environment preset="sunset" />

          {/* Suelo */}
          <Floor />

          {/* Paredes */}
          <Walls />

          {/* Loading indicator */}
          {isLoading && (
            <mesh position={[0, 2, 0]}>
              <sphereGeometry args={[0.5, 32, 32]} />
              <meshStandardMaterial color="#FFCC00" />
            </mesh>
          )}

          {/* Agent desks (no avatars) */}
          {agentConfigs.map((agent) => (
            <AgentDesk
              key={agent.id}
              agent={agent}
              state={getAgentState(agent.id)}
              onClick={() => handleDeskClick(agent.id)}
              isSelected={selectedAgent === agent.id}
            />
          ))}

          {/* Avatares móviles */}
          {agentConfigs.map((agent) => (
            <MovingAvatar
              key={`avatar-${agent.id}`}
              agent={agent}
              state={getAgentState(agent.id)}
              officeBounds={{ minX: -8, maxX: 8, minZ: -7, maxZ: 7 }}
              obstacles={obstacles}
              otherAvatarPositions={avatarPositions}
              onPositionUpdate={handleAvatarPositionUpdate}
            />
          ))}

          {/* Mobiliario interactivo */}
          <FileCabinet
            position={[-8, 0, -5]}
            onClick={handleFileCabinetClick}
          />
          <Whiteboard
            position={[0, 0, -8]}
            rotation={[0, 0, 0]}
            onClick={handleWhiteboardClick}
          />
          <CoffeeMachine
            position={[8, 0.8, -5]}
            onClick={handleCoffeeClick}
          />

          {/* Decoración */}
          <PlantPot position={[-7, 0, 6]} size="large" />
          <PlantPot position={[7, 0, 6]} size="medium" />
          <PlantPot position={[-9, 0, 0]} size="small" />
          <PlantPot position={[9, 0, 0]} size="small" />
          <WallClock
            position={[0, 2.5, -8.4]}
            rotation={[0, 0, 0]}
          />

          {/* Controles de cámara */}
          {controlMode === 'orbit' ? (
            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              minDistance={5}
              maxDistance={30}
              maxPolarAngle={Math.PI / 2.2}
            />
          ) : (
            <FirstPersonControls moveSpeed={5} />
          )}
        </Suspense>
      </Canvas>

      {/* Panel lateral cuando se selecciona un agente */}
      {selectedAgent && (
        <AgentPanel
          agent={agentConfigs.find(a => a.id === selectedAgent)!}
          state={getAgentState(selectedAgent)}
          onClose={handleClosePanel}
        />
      )}

      {/* Modal de interacciones con objetos */}
      {interactionModal && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-yellow-500 rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-yellow-400">
                {interactionModal === 'memory' && '📁 Memory Browser'}
                {interactionModal === 'roadmap' && '📋 Roadmap & Planning'}
                {interactionModal === 'energy' && '☕ Agent Energy Dashboard'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white text-3xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="text-gray-300 space-y-4">
              {interactionModal === 'memory' && (
                <>
                  <p className="text-lg">🧠 Access to workspace memories and files</p>
                  <div className="bg-gray-800 p-4 rounded border border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">Quick links:</p>
                    <ul className="space-y-2">
                      <li><a href="/memory" className="text-yellow-400 hover:underline">→ Full Memory Browser</a></li>
                      <li><a href="/files" className="text-yellow-400 hover:underline">→ File Explorer</a></li>
                    </ul>
                  </div>
                  <p className="text-sm text-gray-500 italic">
                    This would show a file tree of memory/*.md and workspace files
                  </p>
                </>
              )}

              {interactionModal === 'roadmap' && (
                <>
                  <p className="text-lg">🗺️ Project roadmap and planning board</p>
                  <div className="bg-gray-800 p-4 rounded border border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">Active phases:</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Phase 0: TenacitOS Shell</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-yellow-400">●</span>
                        <span>Phase 8: The Office 3D (MVP)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-gray-500">○</span>
                        <span>Phase 2: File Browser Pro</span>
                      </li>
                    </ul>
                  </div>
                  <p className="text-sm text-gray-500 italic">
                    Full roadmap available at workspace/mission-control/ROADMAP.md
                  </p>
                </>
              )}

              {interactionModal === 'energy' && (
                <>
                  <p className="text-lg">⚡ Agent activity and energy levels</p>
                  <div className="bg-gray-800 p-4 rounded border border-gray-700 space-y-3">
                    <div>
                      <p className="text-sm text-gray-400">Total agents:</p>
                      <p className="text-2xl font-bold text-blue-400">{liveAgents.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Active agents:</p>
                      <p className="text-2xl font-bold text-green-400">
                        {liveAgents.filter(a => a.isActive).length} / {liveAgents.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Idle/Sleeping agents:</p>
                      <p className="text-2xl font-bold text-gray-400">
                        {liveAgents.filter(a => !a.isActive).length}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded border border-gray-700 mt-4">
                    <p className="text-sm text-gray-400 mb-2">Current tasks:</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {liveAgents.map(agent => (
                        <div key={agent.id} className="text-xs">
                          <span className="text-yellow-400">{agent.emoji} {agent.name}:</span>
                          <span className="text-gray-300 ml-2">{agent.currentTask}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleCloseModal}
              className="mt-6 w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Controles UI overlay */}
      <div className="absolute top-4 left-4 bg-black/70 text-white p-4 rounded-lg backdrop-blur-sm">
        <h2 className="text-lg font-bold mb-2">🏢 The Office</h2>
        {isLoading ? (
          <div className="text-sm mb-3">
            <p className="text-yellow-400">🔄 Loading live data...</p>
          </div>
        ) : (
          <div className="text-sm space-y-1 mb-3">
            <p><strong>Agents: {liveAgents.filter(a => a.isActive).length}/{liveAgents.length} active</strong></p>
            <p><strong>Mode: {controlMode === 'orbit' ? '🖱️ Orbit' : '🎮 FPS'}</strong></p>
            {controlMode === 'orbit' ? (
              <>
                <p>🖱️ Mouse: Rotate view</p>
                <p>🔄 Scroll: Zoom</p>
                <p>👆 Click: Select</p>
              </>
            ) : (
              <>
                <p>Click to lock cursor</p>
                <p>WASD/Arrows: Move</p>
                <p>Space: Up | Shift: Down</p>
                <p>Mouse: Look | ESC: Unlock</p>
              </>
            )}
          </div>
        )}
        <button
          onClick={() => setControlMode(controlMode === 'orbit' ? 'fps' : 'orbit')}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-3 rounded text-xs transition-colors"
        >
          Switch to {controlMode === 'orbit' ? 'FPS Mode' : 'Orbit Mode'}
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-black/70 text-white p-4 rounded-lg backdrop-blur-sm">
        <h3 className="text-sm font-bold mb-2">Status</h3>
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Working</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Thinking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span>Idle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Error</span>
          </div>
        </div>
      </div>
    </div>
  );
}
