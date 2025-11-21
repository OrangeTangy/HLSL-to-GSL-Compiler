export enum ShaderLanguage {
  GLSL = 'GLSL',
  HLSL = 'HLSL',
  WGSL = 'WGSL',
  MSL = 'MSL (Metal)'
}

export interface CompilationResult {
  code: string;
  explanation?: string;
  error?: string;
  timestamp: number;
}

export interface LogEntry {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  timestamp: Date;
}
