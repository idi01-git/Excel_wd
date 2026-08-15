// src/components/home/shaders.ts

export const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = `
  uniform float uProgress;
  uniform vec2 uResolution;
  uniform vec3 uColor;
  uniform float uSpread;
  varying vec2 vUv;
  
  float Hash(vec2 p) {
    vec3 p2 = vec3(p.xy, 1.0);
    return fract(sin(dot(p2, vec3(37.1, 61.7, 12.4))) * 3758.5453123);
  }
      
  float noise(in vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f *= f * (3.0 - 2.0 * f);
    return mix(
      mix(Hash(i + vec2(0.0, 0.0)), Hash(i + vec2(1.0, 0.0)), f.x),
      mix(Hash(i + vec2(0.0, 1.0)), Hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    v += noise(p * 1.0) * 0.5;
    v += noise(p * 2.0) * 0.25;
    v += noise(p * 4.0) * 0.125;
    return v;
  }

  void main() {
    // If progress is near zero, keep canvas completely invisible
    if (uProgress <= 0.02) {
      gl_FragColor = vec4(uColor, 0.0);
      return;
    }

    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 centeredUv = (uv - 0.5) * vec2(aspect, 1.0);
    
    // Dissolve edge starts below screen and moves up smoothly as user scrolls
    float normalizedProgress = (uProgress - 0.02) / 0.98;
    float dissolveEdge = uv.y - (normalizedProgress * 1.35 - 0.15);
    float noiseValue = fbm(centeredUv * 12.0);
    float d = dissolveEdge + noiseValue * uSpread;
    
    float pixelSize = 1.0 / max(uResolution.y, 1.0);
    float alpha = 1.0 - smoothstep(-pixelSize * 2.0, pixelSize * 2.0, d);
    
    gl_FragColor = vec4(uColor, alpha);
  }
`;
