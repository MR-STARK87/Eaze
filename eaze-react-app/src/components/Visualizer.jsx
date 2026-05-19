import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

const Visualizer = () => {
    const { trace, activeFile } = useAppContext();
    const [activeStepIdx, setActiveStepIdx] = useState(0);

    const codeLines = activeFile.content.split('\n');

    useEffect(() => {
        if (trace.length > 0) {
            setActiveStepIdx(0);
        }
    }, [trace]);

    if (trace.length === 0) {
        return (
            <div className="viz-hint">
                No steps recorded yet. Click ▶ Run to see what your code is doing.
            </div>
        );
    }

    const activeStep = trace[activeStepIdx];

    const getBadgeClass = (kind) => {
        if (kind === 'set') return 'set';
        if (kind === 'say' || kind === 'output') return 'say';
        if (kind === 'if') return 'if';
        if (kind === 'repeat' || kind === 'while' || kind === 'loop') return 'loop';
        if (kind === 'call') return 'call';
        return 'misc';
    };

    const explainForKids = (ev) => {
        const kind = ev?.kind || 'step';
        const d = ev?.data || {};

        if (kind === 'say') {
            return `This line shows on the screen the value ${d.value}.`;
        }
        if (kind === 'set') {
            if (d.scope === 'array') {
                return `This line changes the list item at index ${d.index} to ${d.after}.`;
            }
            if (d.before === '(new)') {
                return `This line makes a new variable called ${d.name} and puts ${d.after} inside it.`;
            }
            return `This line changes ${d.name} from ${d.before} to ${d.after}.`;
        }
        if (kind === 'if') {
            return `This line checks a condition. It is ${d.condition}, so it ${d.condition ? 'runs' : 'skips'} the following lines.`;
        }
        if (kind === 'repeat') {
            return d.times ? `This line repeats the following lines ${d.times} times.` : 'Done repeating.';
        }
        if (kind === 'loop') {
            return `This is turn ${d.i || d.iter} of the loop.`;
        }
        if (kind === 'while') {
            return d.condition ? 'This line starts a while loop.' : 'Done with while loop.';
        }
        if (kind === 'start') return 'The program starts running.';
        if (kind === 'end') return 'The program finished running.';
        
        return ev.message || 'The program did a step.';
    };

    return (
        <div className="viz-wrap">
            <div className="viz-steps">
                {trace.map((step, idx) => (
                    <div 
                        key={idx}
                        className={`viz-step ${idx === activeStepIdx ? 'active' : ''}`}
                        onClick={() => setActiveStepIdx(idx)}
                        style={{ marginLeft: `${Math.min(36, (step.depth || 0) * 12)}px` }}
                    >
                        <div className="viz-step-top">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className={`viz-badge ${getBadgeClass(step.kind)}`}>
                                    {(step.kind || 'step').toUpperCase()}
                                </span>
                                <div className="viz-step-title">Step {idx + 1}</div>
                            </div>
                            <div className="viz-step-meta">
                                {step.loc ? `Line ${step.loc.line}` : ''}
                            </div>
                        </div>
                        {step.message && <div className="viz-step-msg">{step.message}</div>}
                    </div>
                ))}
            </div>
            
            <div className="viz-detail">
                {activeStep && (
                    <>
                        <div className="viz-detail-card">
                            <div className="viz-detail-title">What happened</div>
                            <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
                                <div style={{ fontWeight: '800' }}>{explainForKids(activeStep)}</div>
                                {activeStep.message && (
                                    <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--muted)' }}>
                                        From your code: {activeStep.message}
                                    </div>
                                )}
                            </div>
                        </div>

                        {activeStep.loc && (
                            <div className="viz-detail-card">
                                <div className="viz-detail-title">Code line</div>
                                <div className="viz-kv">
                                    <b>L{activeStep.loc.line}</b>: {codeLines[activeStep.loc.line - 1]?.trim()}
                                </div>
                            </div>
                        )}

                        <div className="viz-detail-card">
                            <div className="viz-detail-title">Variables</div>
                            <div className="viz-kv">
                                {activeStep.globals?.length > 0 ? (
                                    activeStep.globals.map(g => (
                                        <div key={g.name}><b>{g.name}</b>: {JSON.stringify(g.value)}</div>
                                    ))
                                ) : (
                                    <div className="viz-hint">No variables yet.</div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Visualizer;
