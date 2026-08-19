import { Color, Mesh, Program, Renderer, RenderTarget, Triangle } from "ogl";
import { useEffect, useRef, type CSSProperties } from "react";
import "./Strands.css";

const MAX_STRANDS = 12;
const MAX_COLORS = 8;

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColors[${MAX_COLORS}];
uniform float uSpeeds[${MAX_STRANDS}];
uniform int uColorCount;
uniform int uStrandCount;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uWaviness;
uniform float uThickness;
uniform float uGlow;
uniform float uTaper;
uniform float uSpread;
uniform float uHueShift;
uniform float uIntensity;
uniform float uOpacity;
uniform float uScale;
uniform float uSaturation;
uniform int uShape;

out vec4 fragColor;

const float PI = 3.14159265;

vec3 spectrum(float t) {
  return 0.5 + 0.5 * cos(2.0 * PI * (t + vec3(0.00, 0.33, 0.67)));
}

vec3 samplePalette(float t) {
  t = fract(t);
  float scaled = t * float(uColorCount);
  int idx = int(floor(scaled));
  float blend = fract(scaled);
  int nextIdx = idx + 1;
  if (nextIdx >= uColorCount) nextIdx = 0;
  return mix(uColors[idx], uColors[nextIdx], blend);
}

vec3 strandColor(float t) {
  if (uColorCount > 0) return samplePalette(t);
  return spectrum(t);
}

float sdHeart(vec2 p) {
  p.x = abs(p.x);
  p.y = 0.65 - p.y;
  if (p.y + p.x > 1.0) {
    return length(p - vec2(0.25, 0.75)) - sqrt(2.0) * 0.25;
  }
  return sqrt(min(dot(p - vec2(0.0, 1.0), p - vec2(0.0, 1.0)),
                  dot(p - 0.5 * max(p.x + p.y, 0.0), p - 0.5 * max(p.x + p.y, 0.0))))
    * sign(p.x - p.y);
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
  return length(pa - ba * h);
}

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

float sdEllipse(vec2 p, vec2 r) {
  return (length(p / r) - 1.0) * min(r.x, r.y);
}

float sdTriangle(vec2 p) {
  p.y += 0.12;
  const float k = sqrt(3.0);
  p.x = abs(p.x) - 0.55;
  p.y = p.y + 0.55 / k;
  if (p.x + k * p.y > 0.0) {
    p = vec2(p.x - k * p.y, -k * p.x - p.y) * 0.5;
  }
  p.x -= clamp(p.x, -1.1, 0.0);
  return -length(p) * sign(p.y);
}

float sdDiamond(vec2 p, vec2 b) {
  p = abs(p);
  float h = clamp(dot(b - 2.0 * p, b) / dot(b, b), -1.0, 1.0);
  float d = length(p - 0.5 * b * vec2(1.0 - h, 1.0 + h));
  return d * sign(p.x * b.y + p.y * b.x - b.x * b.y);
}

float sdHexagon(vec2 p, float r) {
  const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
  p = abs(p);
  p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
  p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
  return length(p) * sign(p.y);
}

float sdStar(vec2 p) {
  const vec2 k1 = vec2(0.809016994375, -0.587785252292);
  const vec2 k2 = vec2(-0.809016994375, -0.587785252292);
  p.x = abs(p.x);
  p -= 2.0 * max(dot(k1, p), 0.0) * k1;
  p -= 2.0 * max(dot(k2, p), 0.0) * k2;
  p.x = abs(p.x);
  p.y -= 0.55;
  vec2 ba = vec2(0.587785252292, 0.809016994375) * 0.42 - vec2(0.0, 1.0);
  float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, 0.55);
  return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  uv /= max(uScale, 0.0001);

  float e = 0.06 + uIntensity * 0.94;
  float env = uShape == 0 || uShape == 3
    ? pow(max(cos(uv.x * PI * 1.15), 0.0), uTaper)
    : uShape == 10
      ? pow(max(1.0 - abs(uv.x) * 1.05, 0.0), 0.35)
      : 1.0;

  vec3 col = vec3(0.0);

  for (int i = 0; i < ${MAX_STRANDS}; i++) {
    if (i >= uStrandCount) break;

    float fi = float(i);
    float ph = fi * 1.7 * uSpread;
    float freq = (2.0 + fi * 0.35) * uWaviness;
    float spd = (1.4 + fi * 0.25) * max(uSpeeds[i], 0.05);

    float tt = uTime * uSpeed;
    float w = sin(uv.x * freq + tt * spd + ph) * 0.60
            + sin(uv.x * freq * 1.1 - tt * spd * 0.7 + ph * 1.7) * 0.40;

    float amp = (0.1 + 0.02 * e) * env * uAmplitude;
    float y = w * amp;

    float d = abs(uv.y - y);
    if (uShape == 1) {
      float offset = (fi - float(uStrandCount - 1) * 0.5) * 0.028 * uSpread;
      float wobble = w * 0.012 * uAmplitude;
      d = abs(sdHeart(uv * 1.15) - offset - wobble);
    } else if (uShape == 2) {
      float offset = (fi - float(uStrandCount - 1) * 0.5) * 0.03 * uSpread;
      float wobble = w * 0.012 * uAmplitude;
      d = abs(sdStar(uv * 1.05) - offset - wobble);
    } else if (uShape == 3) {
      float helixAmp = 0.24 * uAmplitude;
      float helix = sin(uv.x * 5.4 * uWaviness + tt * spd) * helixAmp;
      d = mod(fi, 2.0) < 0.5 ? abs(uv.y - helix) : abs(uv.y + helix);
      if (i == 0) {
        float cell = floor((uv.x + 3.0) / 0.17);
        float cx = (cell + 0.5) * 0.17 - 3.0;
        float hy = sin(cx * 5.4 * uWaviness + tt * spd) * helixAmp;
        float dRung = sdSegment(uv, vec2(cx, hy), vec2(cx, -hy));
        d = min(d, dRung);
      }
    } else if (uShape == 10) {
      float offset = (fi - float(uStrandCount - 1) * 0.5) * 0.05 * uSpread;
      float wobble = w * 0.018 * uAmplitude;
      float px = uv.x * 1.25;
      float curve = 0.95 * px * px - 0.28;
      d = abs(uv.y - curve - offset - wobble);
    } else if (uShape >= 4) {
      float offset = (fi - float(uStrandCount - 1) * 0.5) * 0.032 * uSpread;
      float wobble = w * 0.01 * uAmplitude;
      float outline = uShape == 4
        ? sdBox(uv * 1.05, vec2(0.5))
        : uShape == 5
          ? sdCircle(uv, 0.5)
          : uShape == 6
            ? sdTriangle(uv * 1.05)
            : uShape == 7
              ? sdDiamond(uv * 1.08, vec2(0.62, 0.62))
              : uShape == 8
                ? sdHexagon(uv * 1.05, 0.5)
                : sdEllipse(uv, vec2(0.74, 0.36));
      d = abs(outline + offset + wobble);
    }

    float thick = (0.001 + 0.05 * e) * (0.35 + env) * uThickness;
    float g = thick / (d + thick * 0.45);
    g = g * g;

    float h = fi / float(uStrandCount) + uv.x * 0.30 + uTime * 0.04 + uHueShift;
    col += strandColor(h) * g * env;
  }

  col *= 0.45 + 0.7 * e;
  col = 1.0 - exp(-col * uGlow);

  float gray = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = max(mix(vec3(gray), col, uSaturation), 0.0);

  float lum = max(max(col.r, col.g), col.b);
  float alpha = clamp(lum, 0.0, 1.0) * uOpacity;

  fragColor = vec4(col * uOpacity, alpha);
}
`;

const GLASS_FRAG = `#version 300 es
precision highp float;

uniform sampler2D uScene;
uniform vec2 uResolution;
uniform float uRadius;
uniform float uRefraction;
uniform float uDispersion;

out vec4 fragColor;

vec2 toUv(vec2 p) {
  return p * (uResolution.y / uResolution) + 0.5;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  float d = length(p);
  float r = uRadius;

  float edge = fwidth(d) * 1.5;
  float mask = 1.0 - smoothstep(r - edge, r + edge, d);
  if (mask <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }

  float z = sqrt(max(r * r - d * d, 0.0)) / r;
  float nd = d / r;

  vec2 dir = d > 0.0 ? p / d : vec2(0.0);
  float lens = smoothstep(0.85, 1.0, nd) * pow(nd, 6.0);
  vec2 offset = -dir * lens * uRefraction * 0.15;
  vec2 disp = -dir * lens * uDispersion * 0.012;

  vec3 light;
  light.r = texture(uScene, toUv(p + offset - disp)).r;
  light.g = texture(uScene, toUv(p + offset)).g;
  light.b = texture(uScene, toUv(p + offset + disp)).b;

  float fres = pow(1.0 - z, 3.0);
  vec3 rim = vec3(1.0) * fres * 0.18;

  vec2 lightDir = normalize(vec2(-0.55, 0.6));
  float spec = pow(max(dot(p / max(r, 1e-4), lightDir), 0.0), 6.0);
  spec *= smoothstep(r, r * 0.55, d);

  vec3 emissive = light + rim + vec3(spec) * 0.4;
  float emissiveA = clamp(max(max(emissive.r, emissive.g), emissive.b), 0.0, 1.0);
  float bodyA = 0.05 + fres * 0.05;
  float outA = emissiveA + bodyA * (1.0 - emissiveA);

  fragColor = vec4(emissive * mask, outA * mask);
}
`;

export interface StrandsProps {
  shape?: "wave" | "heart" | "star" | "dna" | "square" | "circle" | "ellipse" | "parabola" | "triangle" | "diamond" | "hexagon";
  colors?: string[];
  count?: number;
  speed?: number;
  speeds?: number[];
  amplitude?: number;
  waviness?: number;
  thickness?: number;
  glow?: number;
  taper?: number;
  spread?: number;
  hueShift?: number;
  intensity?: number;
  saturation?: number;
  opacity?: number;
  scale?: number;
  glass?: boolean;
  refraction?: number;
  dispersion?: number;
  glassSize?: number;
  className?: string;
  style?: CSSProperties;
}

type LiveProps = Required<
  Omit<StrandsProps, "className" | "style" | "speeds" | "shape">
> & { speeds: number[]; shape: NonNullable<StrandsProps["shape"]> };

function shapeId(shape: NonNullable<StrandsProps["shape"]>): number {
  if (shape === "heart") return 1;
  if (shape === "star") return 2;
  if (shape === "dna") return 3;
  if (shape === "square") return 4;
  if (shape === "circle") return 5;
  if (shape === "triangle") return 6;
  if (shape === "diamond") return 7;
  if (shape === "hexagon") return 8;
  if (shape === "ellipse") return 9;
  if (shape === "parabola") return 10;
  return 0;
}

function buildPalette(colors: string[]): number[][] {
  const filled = colors.length ? colors : ["#ffffff"];
  const padded: number[][] = [];
  for (let i = 0; i < MAX_COLORS; i += 1) {
    const hex = filled[i] ?? filled[filled.length - 1];
    const color = new Color(hex);
    padded.push([color.r, color.g, color.b]);
  }
  return padded;
}

function buildSpeeds(speeds: number[] | undefined, count: number): number[] {
  const next = Array.from({ length: MAX_STRANDS }, (_, index) => {
    if (index >= count) return 1;
    return Math.max(speeds?.[index] ?? 1, 0.05);
  });
  return next;
}

export default function Strands({
  shape = "wave",
  colors = ["#FF4242", "#7C3AED", "#06B6D4", "#EAB308"],
  count = 3,
  speed = 0.5,
  speeds,
  amplitude = 1,
  waviness = 1,
  thickness = 0.7,
  glow = 2.6,
  taper = 3,
  spread = 1,
  hueShift = 0,
  intensity = 0.6,
  saturation = 1.5,
  opacity = 1,
  scale = 1.5,
  glass = false,
  refraction = 1,
  dispersion = 1,
  glassSize = 1,
  className = "",
  style,
}: StrandsProps) {
  const propsRef = useRef<LiveProps>({
    shape,
    colors,
    count,
    speed,
    speeds: speeds ?? [],
    amplitude,
    waviness,
    thickness,
    glow,
    taper,
    spread,
    hueShift,
    intensity,
    saturation,
    opacity,
    scale,
    glass,
    refraction,
    dispersion,
    glassSize,
  });

  propsRef.current = {
    shape,
    colors,
    count,
    speed,
    speeds: speeds ?? [],
    amplitude,
    waviness,
    thickness,
    glow,
    taper,
    spread,
    hueShift,
    intensity,
    saturation,
    opacity,
    scale,
    glass,
    refraction,
    dispersion,
    glassSize,
  };

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.canvas.style.backgroundColor = "transparent";

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) {
      delete geometry.attributes.uv;
    }

    const initial = propsRef.current;
    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [container.offsetWidth, container.offsetHeight] },
        uColors: { value: buildPalette(initial.colors) },
        uSpeeds: { value: buildSpeeds(initial.speeds, initial.count) },
        uColorCount: { value: Math.min(initial.colors.length, MAX_COLORS) },
        uStrandCount: { value: Math.min(initial.count, MAX_STRANDS) },
        uSpeed: { value: initial.speed },
        uAmplitude: { value: initial.amplitude },
        uWaviness: { value: initial.waviness },
        uThickness: { value: initial.thickness },
        uGlow: { value: initial.glow },
        uTaper: { value: initial.taper },
        uSpread: { value: initial.spread },
        uHueShift: { value: initial.hueShift },
        uIntensity: { value: initial.intensity },
        uOpacity: { value: initial.opacity },
        uScale: { value: initial.scale },
        uSaturation: { value: initial.saturation },
        uShape: { value: shapeId(initial.shape) },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    const renderTarget = new RenderTarget(gl, {
      width: Math.max(container.offsetWidth, 1),
      height: Math.max(container.offsetHeight, 1),
    });

    const glassProgram = new Program(gl, {
      vertex: VERT,
      fragment: GLASS_FRAG,
      uniforms: {
        uScene: { value: renderTarget.texture },
        uResolution: { value: [container.offsetWidth, container.offsetHeight] },
        uRadius: { value: 0.46 * initial.glassSize },
        uRefraction: { value: initial.refraction },
        uDispersion: { value: initial.dispersion },
      },
    });
    const glassMesh = new Mesh(gl, { geometry, program: glassProgram });

    container.appendChild(gl.canvas);

    const resize = () => {
      const width = Math.max(container.offsetWidth, 1);
      const height = Math.max(container.offsetHeight, 1);
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = [width, height];
      renderTarget.setSize(width, height);
      glassProgram.uniforms.uResolution.value = [width, height];
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    window.addEventListener("resize", resize);
    resize();

    let frame = 0;
    const update = (time: number) => {
      frame = requestAnimationFrame(update);
      const current = propsRef.current;
      program.uniforms.uTime.value = time * 0.001;
      program.uniforms.uColors.value = buildPalette(current.colors);
      program.uniforms.uSpeeds.value = buildSpeeds(current.speeds, current.count);
      program.uniforms.uColorCount.value = Math.min(current.colors.length, MAX_COLORS);
      program.uniforms.uStrandCount.value = Math.min(
        Math.max(Math.round(current.count), 1),
        MAX_STRANDS,
      );
      program.uniforms.uSpeed.value = current.speed;
      program.uniforms.uAmplitude.value = current.amplitude;
      program.uniforms.uWaviness.value = current.waviness;
      program.uniforms.uThickness.value = current.thickness;
      program.uniforms.uGlow.value = current.glow;
      program.uniforms.uTaper.value = current.taper;
      program.uniforms.uSpread.value = current.spread;
      program.uniforms.uHueShift.value = current.hueShift;
      program.uniforms.uIntensity.value = current.intensity;
      program.uniforms.uOpacity.value = current.opacity;
      program.uniforms.uScale.value = current.scale;
      program.uniforms.uSaturation.value = current.saturation;
      program.uniforms.uShape.value = shapeId(current.shape);

      if (current.glass) {
        renderer.render({ scene: mesh, target: renderTarget });
        glassProgram.uniforms.uScene.value = renderTarget.texture;
        glassProgram.uniforms.uRefraction.value = current.refraction;
        glassProgram.uniforms.uDispersion.value = current.dispersion;
        glassProgram.uniforms.uRadius.value = 0.46 * current.glassSize;
        renderer.render({ scene: glassMesh });
      } else {
        renderer.render({ scene: mesh });
      }
    };
    frame = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      if (gl.canvas.parentNode === container) {
        container.removeChild(gl.canvas);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`strands-container ${className}`.trim()}
      style={style}
    />
  );
}
