import React from 'react';
import { useAppContext } from '../context/AppContext';
import Icon from './Icon';

import Visualizer from './Visualizer';
import CLI from './CLI';

const TABS = [
    { id: 'output', label: 'Output', icon: 'output' },
    { id: 'variables', label: 'Variables', icon: 'cube' },
    { id: 'visual', label: 'Visualize', icon: 'chart' },
    { id: 'cli', label: 'CLI', icon: 'terminal' },
];

const Console = () => {
    const {
        activeTab,
        setActiveTab,
        isConsoleFull,
        setIsConsoleFull,
        outputs,
        setOutputs,
        variables,
        setVariables,
        trace,
        setTrace,
    } = useAppContext();

    /** Clear whatever the visible tab is showing. */
    const clearOutput = () => {
        if (activeTab === 'variables') setVariables(new Map());
        else if (activeTab === 'visual') setTrace([]);
        else setOutputs([]);
    };

    return (
        <div className={`panel console-panel ${isConsoleFull ? 'fullscreen' : ''}`}>
            <div className="panel-header">
                <div className="tabs">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <Icon name={tab.icon} size={16} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
                <div className="panel-header-actions">
                    <button
                        type="button"
                        className="ghost-btn"
                        title="Clear this panel"
                        onClick={clearOutput}
                    >
                        <Icon name="trash" size={16} />
                        <span>Clear</span>
                    </button>
                    <button
                        type="button"
                        className="icon-btn"
                        title={isConsoleFull ? 'Exit fullscreen' : 'Fullscreen'}
                        onClick={() => setIsConsoleFull(!isConsoleFull)}
                    >
                        <Icon name={isConsoleFull ? 'collapse' : 'expand'} size={16} />
                    </button>
                </div>
            </div>

            <div className="tab-content" style={{ display: activeTab === 'output' ? 'block' : 'none' }}>
                {outputs.length === 0 ? (
                    <div className="panel-empty">Program output will show here...</div>
                ) : (
                    outputs.map((out, i) => (
                        <div key={i} className="console-line">{String(out)}</div>
                    ))
                )}
            </div>

            <div className="tab-content" style={{ display: activeTab === 'variables' ? 'block' : 'none' }}>
                {variables.size === 0 ? (
                    <div className="panel-empty">No variables tracked yet. Run your program to see them.</div>
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
