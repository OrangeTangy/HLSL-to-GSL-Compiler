export const DEFAULT_VERTEX_SHADER = `#version 300 es
in vec4 a_position;
void main() {
  gl_Position = a_position;
}
`;

export const createShader = (gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) return shader;
  
  console.warn(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return null;
};

export const createProgram = (
  gl: WebGL2RenderingContext, 
  vertexShader: WebGLShader, 
  fragmentShader: WebGLShader
): WebGLProgram | null => {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) return program;

  console.warn(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
  return null;
};

// Wraps user fragment shader code with Shadertoy-like uniforms if not present
export const formatForPreview = (userCode: string): string => {
  // If it already has version, leave it (or strip it if we want to force 300 es)
  // For simplicity, we assume user provides a full shader or a main function body.
  // We'll wrap it in a standard shell if it looks like a snippet.
  
  if (userCode.includes('#version')) return userCode;

  return `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

out vec4 fragColor;

${userCode}

// Fallback main if user just wrote functions but no main
// This is a naive heuristic
void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    // Try to call user mainImage if it exists (Shadertoy style)
    // else default main
    // This part is tricky without parsing. 
    // We expect the user to write a 'void main()' for standard GLSL output.
    // If they didn't, we can't really guess.
    
    // However, if the transpiler output standard GLSL, it usually includes main().
}
`;
};
