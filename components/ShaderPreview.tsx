import React, { useEffect, useRef, useState } from 'react';
import { createShader, createProgram, DEFAULT_VERTEX_SHADER } from '../utils/webgl';

interface ShaderPreviewProps {
  fragmentCode: string;
  isActive: boolean;
}

export const ShaderPreview: React.FC<ShaderPreviewProps> = ({ fragmentCode, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [compiled, setCompiled] = useState(false);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl2');
    
    if (!gl) {
      setError("WebGL2 not supported");
      return;
    }

    // Handle resizing
    const resize = () => {
      canvas.width = canvas.clientWidth * window.devicePixelRatio;
      canvas.height = canvas.clientHeight * window.devicePixelRatio;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    // Compile Shaders
    const vs = createShader(gl, gl.VERTEX_SHADER, DEFAULT_VERTEX_SHADER);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentCode);

    if (!vs || !fs) {
      setError("Shader compilation failed. Check the logs below or code syntax.");
       // We can get specific log if we modify createShader to return it, 
       // but for now keeping it simple.
       if(!fs) {
          const tempFs = gl.createShader(gl.FRAGMENT_SHADER);
          if(tempFs) {
             gl.shaderSource(tempFs, fragmentCode);
             gl.compileShader(tempFs);
             setError(gl.getShaderInfoLog(tempFs));
          }
       }
      setCompiled(false);
      return () => {
          window.removeEventListener('resize', resize);
          cancelAnimationFrame(requestRef.current);
      };
    }

    const program = createProgram(gl, vs, fs);
    if (!program) {
      setError("Program linking failed.");
      setCompiled(false);
      return () => {
          window.removeEventListener('resize', resize);
          cancelAnimationFrame(requestRef.current);
      };
    }

    setError(null);
    setCompiled(true);

    // Attribute positions (Full screen quad)
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const mouseLocation = gl.getUniformLocation(program, "u_mouse");

    // Render Loop
    let startTime = performance.now();

    const render = (time: number) => {
      if (!gl) return;
      
      gl.useProgram(program);
      gl.bindVertexArray(vao);

      if (timeLocation) gl.uniform1f(timeLocation, (time - startTime) * 0.001);
      if (resolutionLocation) gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      // Mouse handling could be added here with event listeners

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(requestRef.current);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [fragmentCode, isActive]);

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden border border-zinc-800">
       {/* Grid background placeholder if not compiled */}
      {!compiled && (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-600 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]">
           <div className="text-6xl font-mono font-bold select-none">PREVIEW</div>
        </div>
      )}
      
      <canvas ref={canvasRef} className="w-full h-full block" />
      
      {error && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-900/90 text-red-200 p-4 font-mono text-xs overflow-auto max-h-32 backdrop-blur-sm border-t border-red-700">
          <div className="font-bold mb-1">COMPILATION ERROR</div>
          <pre className="whitespace-pre-wrap">{error}</pre>
        </div>
      )}
      {compiled && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-green-900/80 text-green-400 text-xs rounded border border-green-700 backdrop-blur font-mono">
              LIVE
          </div>
      )}
    </div>
  );
};
