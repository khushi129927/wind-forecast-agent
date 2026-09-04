import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Wrench, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Code, 
  FileText,
  Terminal
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AgentChatMessage, AgentToolCallLog, WindLocation } from '../types';

interface AgentStudioProps {
  messages: AgentChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  selectedLocation: WindLocation;
}

const PRESET_PROMPTS = [
  'Which days this week had unusual wind forecast errors, and what is the meteorological and grid pattern?',
  'Calculate MAE, RMSE, and MAPE across persistence vs moving-average baseline models.',
  'Flag all Z-score forecast anomalies (|Z| >= 2.0) and explain potential grid curtailment or reserve shortfall risks.',
  'Generate an executive wind reliability and forecast error report and save it to SQLite.',
];

export const AgentStudio: React.FC<AgentStudioProps> = ({
  messages,
  onSendMessage,
  isLoading,
  selectedLocation,
}) => {
  const [inputText, setInputText] = useState('');
  const [expandedToolCallId, setExpandedToolCallId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    setInputText('');
    onSendMessage(text);
  };

  const toggleToolCall = (id: string) => {
    setExpandedToolCallId(expandedToolCallId === id ? null : id);
  };

  return (
    <div id="agent-studio-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Cols: Interactive Conversation & Multi-Step Reasoning */}
      <div className="lg:col-span-2 flex flex-col bg-[#151515] rounded-md border border-[#222] shadow-sm h-[720px] overflow-hidden">
        {/* Agent Header */}
        <div className="p-4 border-b border-[#222] bg-[#111] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#181818] border border-[#2A2A2A] text-emerald-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[#777] uppercase tracking-[0.2em] text-[10px] font-bold block mb-0.5">
                Multi-Step Reasoning
              </span>
              <h2
                className="text-xl font-light tracking-tight text-[#F0F0F0] leading-none"
                style={{ fontFamily: "'Newsreader', Georgia, serif" }}
              >
                Autonomous Wind Forecasting Agent
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-[#161616] px-2.5 py-1 rounded border border-[#2A2A2A] font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-[11px]">Tool-Calling Active</span>
          </div>
        </div>

        {/* Preset Prompt Suggestions */}
        <div className="p-3 border-b border-[#222] bg-[#0E0E0E]">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#777] mb-2">
            Suggested Prompts (JD Competencies):
          </div>
          <div className="flex flex-wrap gap-1.5 font-mono">
            {PRESET_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                id={`preset-prompt-btn-${idx}`}
                onClick={() => onSendMessage(prompt)}
                disabled={isLoading}
                className="text-left text-xs bg-[#161616] hover:bg-[#222] text-[#AAA] hover:text-[#FFF] border border-[#262626] hover:border-[#444] px-2.5 py-1 rounded transition-all disabled:opacity-50 cursor-pointer"
              >
                &ldquo;{prompt}&rdquo;
              </button>
            ))}
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="text-[10px] font-mono text-[#666] mb-1 flex items-center gap-1.5">
                <span>{msg.role === 'user' ? 'You' : 'Wind Agent'}</span>
                <span>&bull;</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* User Message Bubble */}
              {msg.role === 'user' ? (
                <div className="bg-[#202020] text-[#E0E0E0] border border-[#333] text-xs px-4 py-2.5 rounded-md max-w-xl font-mono shadow-sm leading-relaxed">
                  {msg.content}
                </div>
              ) : (
                <div className="w-full max-w-2xl space-y-3">
                  {/* Tool Invocations Inspector */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="bg-[#0D0D0D] border border-[#262626] rounded-md p-3 text-xs space-y-2 font-mono">
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-400 text-[11px] uppercase tracking-wider">
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Tool Execution Chain ({msg.toolCalls.length} calls)</span>
                      </div>
                      <div className="space-y-1.5">
                        {msg.toolCalls.map((tool) => (
                          <div
                            key={tool.id}
                            className="bg-[#141414] border border-[#222] rounded overflow-hidden text-xs"
                          >
                            <button
                              onClick={() => toggleToolCall(tool.id)}
                              className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-[#1A1A1A] transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[11px]">
                                  {tool.toolName}()
                                </span>
                                <span className="text-[#888] text-[11px] truncate max-w-sm">
                                  {tool.outputSummary}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] text-[#555] font-mono">
                                  {tool.timestamp}
                                </span>
                                {expandedToolCallId === tool.id ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-[#777]" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-[#777]" />
                                )}
                              </div>
                            </button>

                            {expandedToolCallId === tool.id && (
                              <div className="p-3 bg-[#080808] text-emerald-400 font-mono text-[11px] border-t border-[#222] overflow-x-auto">
                                <div className="text-[#666] mb-1">// Input Arguments:</div>
                                <pre className="text-orange-300 mb-2">
                                  {JSON.stringify(tool.inputArgs, null, 2)}
                                </pre>
                                <div className="text-[#666] mb-1">// Raw Output:</div>
                                <pre className="text-emerald-400">
                                  {JSON.stringify(tool.rawOutput, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Agent Response Markdown */}
                  <div className="bg-[#111] border border-[#262626] text-[#DDD] text-xs p-4 rounded-md shadow-sm leading-relaxed space-y-2">
                    <div className="markdown-body prose prose-invert prose-xs max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 bg-[#111] border border-[#262626] p-3 rounded-md max-w-md font-mono">
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-xs text-[#AAA]">
                <div className="font-semibold text-[#FFF]">Agent executing tool calls...</div>
                <div className="text-[11px] text-[#666]">
                  Open-Meteo telemetry &bull; Z-score calculations &bull; synthesis
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-[#222] bg-[#111]">
          <div className="flex items-center gap-2 font-mono">
            <input
              id="agent-chat-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask the agent to evaluate error, calculate Z-scores, or summarize..."
              disabled={isLoading}
              className="flex-1 bg-[#0C0C0C] border border-[#262626] rounded-md px-4 py-2.5 text-xs text-[#E0E0E0] placeholder:text-[#555] focus:outline-none focus:border-emerald-500"
            />
            <button
              id="agent-chat-send-btn"
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black p-2.5 rounded-md shadow-sm transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Right Col: Tool Architecture & JD Requirements Checklist */}
      <div className="space-y-4">
        {/* Tool Declarations Card */}
        <div className="bg-[#151515] rounded-md border border-[#222] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Code className="w-4 h-4 text-emerald-400" />
            <span className="text-[#777] uppercase tracking-[0.2em] text-[10px] font-bold">
              Autonomous Capabilities
            </span>
          </div>
          <h3
            className="text-xl font-light text-[#F0F0F0] mb-3 leading-none"
            style={{ fontFamily: "'Newsreader', Georgia, serif" }}
          >
            Registered Agent Tools
          </h3>
          <div className="space-y-2.5 text-xs font-mono">
            <div className="p-2.5 rounded bg-[#0E0E0E] border border-[#222]">
              <div className="font-bold text-emerald-400 flex items-center justify-between">
                <span>get_wind_data()</span>
                <span className="text-[10px] text-[#666] font-sans">Open-Meteo</span>
              </div>
              <p className="text-[11px] text-[#777] mt-1">
                Pulls hourly wind speed (10m, 80m hub height) and power estimates for energy sites.
              </p>
            </div>

            <div className="p-2.5 rounded bg-[#0E0E0E] border border-[#222]">
              <div className="font-bold text-emerald-400 flex items-center justify-between">
                <span>compute_forecast_error()</span>
                <span className="text-[10px] text-[#666] font-sans">Time-Series</span>
              </div>
              <p className="text-[11px] text-[#777] mt-1">
                Evaluates persistence &amp; rolling moving average baselines, computes MAE, RMSE, and MAPE.
              </p>
            </div>

            <div className="p-2.5 rounded bg-[#0E0E0E] border border-[#222]">
              <div className="font-bold text-emerald-400 flex items-center justify-between">
                <span>flag_anomalies()</span>
                <span className="text-[10px] text-[#666] font-sans">Z-Score Tool</span>
              </div>
              <p className="text-[11px] text-[#777] mt-1">
                Calculates Z = (e - &mu;)/&sigma; on forecast error to detect wind ramp events and drop-offs.
              </p>
            </div>

            <div className="p-2.5 rounded bg-[#0E0E0E] border border-[#222]">
              <div className="font-bold text-emerald-400 flex items-center justify-between">
                <span>generate_wind_report()</span>
                <span className="text-[10px] text-[#666] font-sans">SQLite Export</span>
              </div>
              <p className="text-[11px] text-[#777] mt-1">
                Writes executive reliability markdown report directly to SQLite table for automated dispatch.
              </p>
            </div>
          </div>
        </div>

        {/* JD Coverage Card */}
        <div className="bg-[#151515] rounded-md border border-[#222] border-l-2 border-l-emerald-500 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[#777] uppercase tracking-[0.2em] text-[10px] font-bold">
              Qualifications Match
            </span>
          </div>
          <h3
            className="text-xl font-light text-[#F0F0F0] mb-3 leading-none"
            style={{ fontFamily: "'Newsreader', Georgia, serif" }}
          >
            JD Competencies Validated
          </h3>
          <ul className="space-y-2.5 text-xs text-[#AAA]">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">&check;</span>
              <span><strong className="text-[#EEE]">Programmatically integrate LLMs:</strong> Direct tool calling without copy-paste prompts.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">&check;</span>
              <span><strong className="text-[#EEE]">Multi-step problem reasoning:</strong> Orchestrates data pull &rarr; error engine &rarr; anomaly detection.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">&check;</span>
              <span><strong className="text-[#EEE]">Time-series &amp; energy domain:</strong> Real MW power curves &amp; Open-Meteo wind speed telemetry.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">&check;</span>
              <span><strong className="text-[#EEE]">Statistical anomaly detection:</strong> Z-score applied to forecast error residuals.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
