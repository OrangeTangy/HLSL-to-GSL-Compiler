import React, { useState } from 'react';
import { CodeEditor } from './components/CodeEditor';
import { ShaderPreview } from './components/ShaderPreview';
import { transpileShader, optimizeShader, analyzeShader } from './services/geminiService';
import { ShaderLanguage, LogEntry } from './types';
import { Play, Cpu, Activity, AlertCircle, CheckCircle, Terminal, RefreshCw, Wand2, ArrowRight } from 'lucide-react';

// Initial shader example (HLSL style)
const INITIAL_HLSL = `// HLSL Pixel Shader Example
float4 main(float2 uv : TEXCOORD0) : SV_Target
{
    float3 color = float3(0.0, 0.0, 0.0);
    
    // Simple time-based color cycling
    color.r = 0.5 + 0.5 * sin(uv.x * 10.0);
    color.g = 0.5 + 0.5 * cos(uv.y * 10.0);
    color.b = 0.5;
    
    return float4(color, 1.0);
}`;

export default function App() {
  // State
  const [inputLang, setInputLang] = useState<ShaderLanguage>(ShaderLanguage.HLSL);
  const [outputLang, setOutputLang] = useState<ShaderLanguage>(ShaderLanguage.GLSL);
  const [inputCode, setInputCode] = useState<string>(INITIAL_HLSL);
  const [outputCode, setOutputCode] = useState<string>("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [explanation, setExplanation] = useState<string>("");

  // Helpers
  const addLog = (type: LogEntry['type'], message: string) => {
    const newLog = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      message,
      timestamp: new Date()
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // Actions
  const handleTranspile = async () => {
    setIsProcessing(true);
    addLog('info', `Compiling ${inputLang} to ${outputLang}...`);
    
    try {
      const result = await transpileShader(inputCode, inputLang, outputLang);
      setOutputCode(result.code);
      setExplanation(result.explanation);
      addLog('success', 'Compilation successful.');
      
      // Auto-switch to preview if valid GLSL target
      if (outputLang === ShaderLanguage.GLSL) {
         // Optional: could auto-switch activeTab here
      }
    } catch (error: any) {
      addLog('error', error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOptimize = async () => {
    if (!inputCode) return;
    setIsProcessing(true);
    addLog('info', 'Optimizing source code...');
    try {
      const result = await optimizeShader(inputCode, inputLang);
      setInputCode(result.code); // Update source with optimized version
      addLog('success', 'Optimization complete.');
      addLog('info', `Notes: ${result.explanation}`);
    } catch (error: any) {
      addLog('error', error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!inputCode) return;
    setIsProcessing(true);
    addLog('info', 'Analyzing shader...');
    try {
      const result = await analyzeShader(inputCode, inputLang);
      setExplanation(result); // Show analysis in the explanation pane
      addLog('success', 'Analysis complete.');
    } catch (error: any) {
      addLog('error', error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-zinc-800 bg-[#09090b]/50 backdrop-blur flex items-center px-6 justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-900/20">
            <Cpu size={18} />
          </div>
          <h1 className="font-bold text-white tracking-tight text-lg">ShaderForge <span className="text-indigo-500">AI</span></h1>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
          <span>v1.0.0</span>
          <span className="mx-1">•</span>
          <span className={isProcessing ? "text-amber-500 animate-pulse" : "text-emerald-500"}>
             {isProcessing ? "PROCESSING..." : "SYSTEM READY"}
          </span>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-grow flex flex-col md:flex-row overflow-hidden">
        
        {/* LEFT COLUMN: Input Source */}
        <div className="flex-1 flex flex-col border-r border-zinc-800 min-w-0">
          {/* Toolbar */}
          <div className="h-12 border-b border-zinc-800 bg-[#121215] flex items-center px-4 gap-4 justify-between">
            <div className="flex items-center gap-2">
              <select 
                value={inputLang}
                onChange={(e) => setInputLang(e.target.value as ShaderLanguage)}
                className="bg-[#27272a] border border-zinc-700 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
              >
                {Object.values(ShaderLanguage).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <span className="text-zinc-600"><ArrowRight size={14}/></span>
              <select 
                value={outputLang}
                onChange={(e) => setOutputLang(e.target.value as ShaderLanguage)}
                className="bg-[#27272a] border border-zinc-700 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
              >
                {Object.values(ShaderLanguage).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleOptimize}
                disabled={isProcessing}
                className="p-2 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-900/20 rounded transition-colors"
                title="Optimize with AI"
              >
                <Wand2 size={16} />
              </button>
               <button 
                onClick={handleAnalyze}
                disabled={isProcessing}
                className="p-2 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-900/20 rounded transition-colors"
                title="Analyze/Explain"
              >
                <Activity size={16} />
              </button>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-grow p-4 bg-[#0c0c0e]">
            <CodeEditor 
              value={inputCode} 
              onChange={setInputCode} 
              language={inputLang}
              label="Source Code"
            />
          </div>
          
          {/* Primary Action */}
          <div className="p-4 border-t border-zinc-800 bg-[#121215] flex justify-end">
            <button
              onClick={handleTranspile}
              disabled={isProcessing}
              className={`
                flex items-center gap-2 px-6 py-2 rounded font-semibold text-sm transition-all
                ${isProcessing 
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40'}
              `}
            >
              {isProcessing ? <RefreshCw className="animate-spin" size={16}/> : <Play size={16} fill="currentColor" />}
              {isProcessing ? 'Compiling...' : 'Transpile Shader'}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Output & Preview */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0c0c0e]">
          {/* Tabs */}
           <div className="h-12 border-b border-zinc-800 bg-[#121215] flex items-center px-2 gap-1">
             <button 
                onClick={() => setActiveTab('code')}
                className={`px-4 py-1.5 rounded text-xs font-medium transition-all ${activeTab === 'code' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
             >
               Compiler Output
             </button>
             {outputLang === ShaderLanguage.GLSL && (
               <button 
                  onClick={() => setActiveTab('preview')}
                  className={`px-4 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-2 ${activeTab === 'preview' ? 'bg-indigo-900/30 text-indigo-300 border border-indigo-900/50' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 <Play size={12} /> Live Preview
               </button>
             )}
           </div>

           {/* Content */}
           <div className="flex-grow p-4 overflow-hidden flex flex-col relative">
             {activeTab === 'code' ? (
               <div className="h-full flex flex-col gap-4">
                 <div className="flex-grow h-1/2">
                    <CodeEditor 
                        value={outputCode} 
                        onChange={() => {}} 
                        language={outputLang} 
                        readOnly={true}
                        label="Transpiled Output"
                    />
                 </div>
                 {/* Explanation Panel */}
                 <div className="h-1/3 bg-[#18181b] rounded-lg border border-zinc-800 flex flex-col overflow-hidden">
                    <div className="px-4 py-2 bg-[#27272a] border-b border-zinc-800 flex items-center gap-2">
                      <Terminal size={14} className="text-zinc-400"/>
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">AI Analysis & Logs</span>
                    </div>
                    <div className="p-4 overflow-auto text-xs font-mono leading-5 text-zinc-400 space-y-3">
                        {explanation && (
                          <div className="mb-4 pb-4 border-b border-zinc-800">
                            <p className="text-indigo-300 font-bold mb-1">Analysis:</p>
                            <p className="whitespace-pre-wrap">{explanation}</p>
                          </div>
                        )}
                        <div className="flex flex-col gap-1">
                            {logs.map(log => (
                                <div key={log.id} className="flex gap-2">
                                    <span className="text-zinc-600">[{log.timestamp.toLocaleTimeString()}]</span>
                                    <span className={`
                                        ${log.type === 'error' ? 'text-red-400' : ''}
                                        ${log.type === 'success' ? 'text-emerald-400' : ''}
                                        ${log.type === 'warning' ? 'text-amber-400' : ''}
                                        ${log.type === 'info' ? 'text-blue-400' : ''}
                                    `}>{log.message}</span>
                                </div>
                            ))}
                            {logs.length === 0 && !explanation && <span className="text-zinc-600 italic">System logs empty...</span>}
                        </div>
                    </div>
                 </div>
               </div>
             ) : (
                <ShaderPreview fragmentCode={outputCode} isActive={activeTab === 'preview'} />
             )}
           </div>
        </div>
      </main>
    </div>
  );
}
