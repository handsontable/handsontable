import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MessageProcessor, type ActionPayload, type ProcessableMessage, type SurfaceModel } from '@a2ui/web_core/v0_9';
import { A2uiSurface, type ReactComponentImplementation } from '@a2ui/react/v0_9';
import { hotCatalog } from './catalog';
import { agentMessages, replyTo } from './agentMessages';
import './theme';
import './styles.css';

const STREAM_DELAY_MS = 900;
// createSurface + updateComponents + the first updateDataModel.
const OPENING_MESSAGES = 3;
const AGENT_THINKING_MS = 1200;

const App = () => {
  const [actions, setActions] = useState<ActionPayload[]>([]);
  const [sent, setSent] = useState(0);
  // Every message the agent has sent so far, in order, for the stream panel.
  const [stream, setStream] = useState<ProcessableMessage[]>([]);
  const [surfaces, setSurfaces] = useState<SurfaceModel<ReactComponentImplementation>[]>([]);

  // The processor turns agent messages into surface state. The second argument
  // receives every action a user triggers; a real app forwards it to the agent.
  const processorRef = useRef<MessageProcessor<ReactComponentImplementation> | null>(null);
  if (!processorRef.current) {
    processorRef.current = new MessageProcessor<ReactComponentImplementation>([hotCatalog], (action) => {
      setActions((prev) => [action, ...prev]);
      // The agent answers the action. `replyTo` stands in for the model call.
      setTimeout(() => {
        const reply = replyTo(action);
        processorRef.current?.processMessages(reply);
        setStream((prev) => [...prev, ...reply]);
      }, AGENT_THINKING_MS);
    });
  }
  const processor = processorRef.current;

  useEffect(() => {
    const sync = () => setSurfaces(Array.from(processor.model.surfacesMap.values()));
    const created = processor.onSurfaceCreated(sync);
    const deleted = processor.onSurfaceDeleted(sync);
    return () => {
      created.unsubscribe();
      deleted.unsubscribe();
    };
  }, [processor]);

  // Replay the agent's messages. The three that open the surface (create it,
  // define the components, fill the data model) arrive together, the way a
  // model's first response does. Any later messages are paced out so the
  // agent's follow-up edits are visible one at a time.
  useEffect(() => {
    if (sent >= agentMessages.length) return;
    const batch = sent === 0 ? agentMessages.slice(0, OPENING_MESSAGES) : [agentMessages[sent]];
    const timer = setTimeout(() => {
      processor.processMessages(batch);
      setStream((prev) => [...prev, ...batch]);
      setSent(sent + batch.length);
    }, sent === 0 ? 0 : STREAM_DELAY_MS);
    return () => clearTimeout(timer);
  }, [sent, processor]);

  const latestAction = actions[0];
  const latestValues = latestAction?.context?.values as unknown[][] | undefined;

  return (
    <main className="demo">
      <section className="surface-host">
        {surfaces.length === 0 && <p className="muted">Waiting for the agent…</p>}
        {surfaces.map((surface) => (
          <A2uiSurface key={surface.id} surface={surface} />
        ))}
      </section>

      <section className="panels">
        <div className="panel">
          <h3>
            Agent → client <span className="pill">{stream.length} messages</span>
          </h3>
          <ol className="stream">
            {stream.map((m, i) => (
              <li key={i}>
                <details>
                  <summary>{Object.keys(m).filter((k) => k !== 'version')[0]}</summary>
                  <pre>{JSON.stringify(m, null, 2)}</pre>
                </details>
              </li>
            ))}
          </ol>
        </div>
        <div className="panel">
          <h3>
            Client → agent <span className="pill">{actions.length} actions</span>
          </h3>
          {!latestAction && <p className="muted">Click a button in the surface to dispatch an action.</p>}
          {latestValues && (
            <p>
              Grand total the agent will receive:{' '}
              <strong>{String(latestValues[latestValues.length - 1]?.[3])}</strong>
            </p>
          )}
          <ol className="stream">
            {actions.map((a, i) => (
              <li key={a.timestamp + i}>
                <details>
                  <summary>{a.name}</summary>
                  <pre>{JSON.stringify(a, null, 2)}</pre>
                </details>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
