import React from 'react';
import { useAppContext } from '../context/AppContext';

import Visualizer from './Visualizer';
import CLI from './CLI';

const Console = () => {
    const { 
        activeTab, 
        setActiveTab, 
        isConsoleFull, 
        setIsConsoleFull,
        outputs,
        variables,
        trace
    } = useAppContext();

    const clearOutput = () => {
        // This should probably be handled by the context or a hook
    };

    return (
        <div className={`panel console-panel ${isConsoleFull ? 'fullscreen' : ''}`}>
            <div className="panel-header">
                <div className="tabs">
                    <div 
                        className={`tab ${activeTab === 'output' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('output')}
                    >Output</div>
                    <div 
                        className={`tab ${activeTab === 'variables' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('variables')}
                    >Variables</div>
                    <div 
                        className={`tab ${activeTab === 'visual' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('visual')}
                    >Visualize</div>
                    <div 
                        className={`tab ${activeTab === 'cli' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('cli')}
                    >CLI</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn" style={{height:'28px', padding:'0 8px', fontSize:'11px'}} title="Clear Output">🗑️ Clear</button>
                    <button 
                        className="btn" 
                        style={{width:'28px', height:'28px', padding:0}} 
                        title="Fullscreen"
                        onClick={() => setIsConsoleFull(!isConsoleFull)}
                    >⛶</button>
                </div>
            </div>
            
            <div className="tab-content" style={{ display: activeTab === 'output' ? 'block' : 'none' }}>
                {outputs.length === 0 ? (
                    <div style={{color: 'var(--muted)', fontStyle: 'italic'}}>Program output will show here...</div>
                ) : (
                    outputs.map((out, i) => (
                        <div key={i} className="console-line">{String(out)}</div>
                    ))
                )}
            </div>

            <div className="tab-content" style={{ display: activeTab === 'variables' ? 'block' : 'none' }}>
                {variables.size === 0 ? (
                    <div style={{color: 'var(--muted)', fontStyle: 'italic'}}>No variables tracked yet.</div>
                ) : (
                    Array.from(variables.entries()).map(([name, value]) => (
                        <div key={name} className="console-line">
                            <b>{name}</b>: {typeof value === 'object' && value.isFunction ? `[Function: ${value.name}]` : JSON.stringify(value)}
                        </div>
                    ))
                )}
            </div>

            <div className="tab-content" style={{ display: activeTab === 'visual' ? 'block' : 'none', padding: trace.length > 0 ? 0 : '16px' }}>
                <Visualizer />
            </div>

            <div className="tab-content" id="pane-cli" style={{ display: activeTab === 'cli' ? 'flex' : 'none', padding: 0, flexDirection: 'column', height: '100%' }}>
                <CLI />
            </div>
        </div>
    );
};

export default Console;
