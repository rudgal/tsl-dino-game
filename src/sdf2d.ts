/**
 * 2D SDF (Signed Distance Function) Collection for TSL
 * Based on Inigo Quilez's 2D distance functions
 * https://iquilezles.org/articles/distfunctions2d/
 */

import {
  abs,
  acos,
  atan2,
  clamp,
  cos,
  dot,
  float,
  Fn,
  length,
  max,
  min,
  mix,
  mod,
  pow,
  select,
  sign,
  sin,
  sqrt,
  step,
  vec2,
  vec3
} from 'three/tsl';
import type { FnArguments } from './types.ts';

// Helper functions
const dot2 = (v: any) => dot(v, v);

// ============================================
// Basic Shapes
// ============================================

// Circle
export const sdCircle = Fn(([p, r]: FnArguments) => {
  return length(p).sub(r);
});

// Box
export const sdBox = Fn(([p, b]: FnArguments) => {
  const d = abs(p).sub(b);
  return length(max(d, 0.0)).add(min(max(d.x, d.y), 0.0));
});

// Rounded Box
export const sdRoundedBox = Fn(([p, b, r]: FnArguments) => {
  const px = p.x;
  const py = p.y;

  // r.xy = (p.x>0.0)?r.xy : r.zw
  const rxy = mix(vec2(r.z, r.w), vec2(r.x, r.y), step(0, px));
  // r.x = (p.y>0.0)?r.x : r.y
  const rx = mix(rxy.y, rxy.x, step(0, py));

  const q = abs(p).sub(b).add(rx);
  return min(max(q.x, q.y), 0.0).add(length(max(q, 0.0))).sub(rx);
});

// Oriented Box
export const sdOrientedBox = Fn(([p, a, b, th]: FnArguments) => {
  const l = length(b.sub(a));
  const d = b.sub(a).div(l);
  const q = p.sub(a.add(b).mul(0.5));

  // Rotate q by d matrix
  const qRotated = vec2(
    d.x.mul(q.x).add(d.y.mul(q.y)),
    d.x.mul(q.y).sub(d.y.mul(q.x))
  );

  const boxDim = vec2(l, th).mul(0.5);
  const qAbs = abs(qRotated).sub(boxDim);
  return length(max(qAbs, 0.0)).add(min(max(qAbs.x, qAbs.y), 0.0));
});

// Segment
export const sdSegment = Fn(([p, a, b]: FnArguments) => {
  const pa = p.sub(a);
  const ba = b.sub(a);
  const h = clamp(dot(pa, ba).div(dot(ba, ba)), 0.0, 1.0);
  return length(pa.sub(ba.mul(h)));
});

// Rhombus
export const sdRhombus = Fn(([p, b]: FnArguments) => {
  const pAbs = abs(p);
  const ndot = Fn(([a, b]: FnArguments) => a.x.mul(b.x).sub(a.y.mul(b.y)));
  const h = clamp(
    ndot(b.sub(pAbs.mul(2.0)), b).div(dot(b, b)),
    -1.0,
    1.0
  );
  const d = length(
    pAbs.sub(b.mul(vec2(h.add(1.0), h.sub(1.0).negate()).mul(0.5)))
  );
  return d.mul(sign(pAbs.x.mul(b.y).add(pAbs.y.mul(b.x)).sub(b.x.mul(b.y))));
});

// ============================================
// Triangles
// ============================================

// Equilateral Triangle
export const sdEquilateralTriangle = Fn(([p, r]: FnArguments) => {
  const k = sqrt(3.0);
  const px = abs(p.x).sub(r);
  const py = p.y.add(r.div(k));

  // Conditional transform
  const cond = px.add(k.mul(py)).greaterThan(0.0);
  const transformed = vec2(
    px.sub(k.mul(py)),
    k.mul(px).negate().sub(py)
  ).div(2.0);

  const pFinal = mix(vec2(px, py), transformed, cond);
  const pxClamped = clamp(pFinal.x, r.mul(-2.0), 0.0);

  return length(vec2(pFinal.x.sub(pxClamped), pFinal.y)).negate().mul(sign(pFinal.y));
});

// Isosceles Triangle
export const sdTriangleIsosceles = Fn(([p, q]: FnArguments) => {
  const px = abs(p.x);
  const a = vec2(px, p.y).sub(q.mul(clamp(dot(vec2(px, p.y), q).div(dot(q, q)), 0.0, 1.0)));
  const b = vec2(px, p.y).sub(q.mul(vec2(clamp(px.div(q.x), 0.0, 1.0), 1.0)));
  const s = sign(q.y).negate();

  const d = min(
    vec2(dot(a, a), s.mul(px.mul(q.y).sub(p.y.mul(q.x)))),
    vec2(dot(b, b), s.mul(p.y.sub(q.y)))
  );

  return sqrt(d.x).negate().mul(sign(d.y));
});

// ============================================
// Polygons
// ============================================

// Pentagon
export const sdPentagon = Fn(([p, r]: FnArguments) => {
  const k = vec3(0.809016994, 0.587785252, 0.726542528);
  const px = abs(p.x);

  // First fold
  const dot1 = dot(vec2(k.x.negate(), k.y), vec2(px, p.y));
  const p1 = vec2(px, p.y).sub(
    vec2(k.x.negate(), k.y).mul(min(dot1, 0.0).mul(2.0))
  );

  // Second fold
  const dot2 = dot(vec2(k.x, k.y), p1);
  const p2 = p1.sub(vec2(k.x, k.y).mul(min(dot2, 0.0).mul(2.0)));

  // Clamp and offset
  const p3 = p2.sub(vec2(clamp(p2.x, k.z.mul(r).negate(), k.z.mul(r)), r));

  return length(p3).mul(sign(p3.y));
});

// Hexagon
export const sdHexagon = Fn(([p, r]: FnArguments) => {
  const k = vec3(-0.866025404, 0.5, 0.577350269);
  const pAbs = abs(p);

  // First fold
  const p1 = pAbs.sub(
    vec2(k.x, k.y).mul(min(dot(vec2(k.x, k.y), pAbs), 0.0).mul(2.0))
  );

  // Clamp and offset
  const p2 = p1.sub(vec2(clamp(p1.x, k.z.mul(r).negate(), k.z.mul(r)), r));

  return length(p2).mul(sign(p2.y));
});

// Octagon
export const sdOctagon = Fn(([p, r]: FnArguments) => {
  const k = vec3(-0.9238795325, 0.3826834323, 0.4142135623);
  const pAbs = abs(p);

  // First fold
  const p1 = pAbs.sub(
    vec2(k.x, k.y).mul(min(dot(vec2(k.x, k.y), pAbs), 0.0).mul(2.0))
  );

  // Second fold
  const p2 = p1.sub(
    vec2(k.x.negate(), k.y).mul(min(dot(vec2(k.x.negate(), k.y), p1), 0.0).mul(2.0))
  );

  // Clamp and offset
  const p3 = p2.sub(vec2(clamp(p2.x, k.z.mul(r).negate(), k.z.mul(r)), r));

  return length(p3).mul(sign(p3.y));
});

// Star (dynamic n and m parameters)
export const sdStar = Fn(([p, r, n, m]: FnArguments) => {
  // Precompute for given shape
  const an = float(3.141593).div(n);
  const en = float(3.141593).div(m); // m is between 2 and n
  const acs = vec2(cos(an), sin(an));
  const ecs = vec2(cos(en), sin(en)); // ecs=vec2(0,1) for regular polygon

  const bn = mod(atan2(p.x, p.y), an.mul(2.0)).sub(an);
  const pTransformed = length(p).mul(vec2(cos(bn), abs(sin(bn))));
  const p1 = pTransformed.sub(r.mul(acs));
  const p2 = p1.add(ecs.mul(clamp(dot(p1, ecs).negate(), 0.0, r.mul(acs.y).div(ecs.y))));

  return length(p2).mul(sign(p2.x));
});

// ============================================
// Curves
// ============================================

// Pie
export const sdPie = Fn(([p, c, r]: FnArguments) => {
  const px = abs(p.x);
  const l = length(vec2(px, p.y)).sub(r);
  const m = length(vec2(px, p.y).sub(c.mul(clamp(dot(vec2(px, p.y), c), 0.0, r))));
  return max(l, m.mul(sign(c.y.mul(px).sub(c.x.mul(p.y)))));
});

// Arc
export const sdArc = Fn(([p, sc, ra, rb]: FnArguments) => {
  const px = abs(p.x);
  const condition = sc.y.mul(px).greaterThan(sc.x.mul(p.y));
  const dist1 = length(vec2(px, p.y).sub(sc.mul(ra)));
  const dist2 = abs(length(vec2(px, p.y)).sub(ra));
  return mix(dist2, dist1, condition).sub(rb);
});

// Ring
export const sdRing = Fn(([p, r, th]: FnArguments) => {
  return abs(length(p).sub(r)).sub(th.mul(0.5));
});

// Horseshoe
export const sdHorseshoe = Fn(([p, c, r, w]: FnArguments) => {
  const px = abs(p.x);
  const l = length(vec2(px, p.y));

  // Rotate by angle c
  const pRot = vec2(
    c.x.negate().mul(px).add(c.y.mul(p.y)),
    c.y.mul(px).add(c.x.mul(p.y))
  );

  // Conditional transform
  const cond1 = pRot.y.greaterThan(0.0);
  const cond2 = pRot.x.greaterThan(0.0);
  const pTransformed = vec2(
    mix(l.mul(sign(c.x).negate()), pRot.x, cond1.or(cond2)),
    mix(l, pRot.y, cond2)
  );

  const pFinal = vec2(pTransformed.x, abs(pTransformed.y.sub(r))).sub(w);
  return length(max(pFinal, 0.0)).add(min(max(pFinal.x, pFinal.y), 0.0));
});

// ============================================
// Special Shapes
// ============================================

// Heart
export const sdHeart = Fn(([p]: FnArguments) => {
  const px = abs(p.x);

  // Check if in upper part
  const inUpper = px.add(p.y).greaterThan(1.0);

  // Upper part distance
  const upperDist = sqrt(dot2(vec2(px, p.y).sub(vec2(0.25, 0.75)))).sub(sqrt(2.0).div(4.0));

  // Lower part distance
  const lowerPart1 = dot2(vec2(px, p.y).sub(vec2(0.00, 1.00)));
  const lowerPart2 = dot2(vec2(px, p.y).sub(max(px.add(p.y), 0.0).mul(0.5)));
  const lowerDist = sqrt(min(lowerPart1, lowerPart2)).mul(sign(px.sub(p.y)));

  return mix(lowerDist, upperDist, inUpper);
});

// Egg
export const sdEgg = Fn(([p, ra, rb]: FnArguments) => {
  const k = sqrt(3.0);
  const px = abs(p.x);
  const r = ra.sub(rb);

  const cond1 = p.y.lessThan(0.0);
  const cond2 = k.mul(px.add(r)).lessThan(p.y);

  const dist1 = length(vec2(px, p.y)).sub(r);
  const dist2 = length(vec2(px, p.y.sub(k.mul(r))));
  const dist3 = length(vec2(px.add(r), p.y)).sub(r.mul(2.0));

  return mix(
    mix(dist3, dist2, cond2),
    dist1,
    cond1
  ).sub(rb);
});

// Cross exterior, bound interior
export const sdCross = Fn(([p, b, r]: FnArguments) => {
  const pAbs = abs(p);
  const pSwap = mix(pAbs, vec2(pAbs.y, pAbs.x), step(pAbs.x, pAbs.y));
  const q = pSwap.sub(b);
  const k = max(q.y, q.x);
  const w = mix(vec2(b.y.sub(pSwap.x), k.negate()), q, step(0, k));
  return sign(k).mul(length(max(w, 0.0))).add(r);
});

// Rounded X
export const sdRoundedX = Fn(([p, w, r]: FnArguments) => {
  const pAbs = abs(p);
  return length(pAbs.sub(min(pAbs.x.add(pAbs.y), w).mul(0.5))).sub(r);
});

// Ellipse - simplified
export const sdEllipseSimple = Fn(([p, radius, scale]: FnArguments) => {
  const scaledPosition = p.mul(scale)
  return length(scaledPosition).sub(radius)
})

// Ellipse
export const sdEllipse = Fn(([p, ab]: FnArguments) => {
  const pAbs = abs(p);
  const p1 = select(pAbs.x.greaterThan(pAbs.y), vec2(pAbs.y, pAbs.x), pAbs);
  const ab1 = select(pAbs.x.greaterThan(pAbs.y), vec2(ab.y, ab.x), ab);

  const l = ab1.y.mul(ab1.y).sub(ab1.x.mul(ab1.x));
  const m = ab1.x.mul(p1.x).div(l);
  const m2 = m.mul(m);
  const n = ab1.y.mul(p1.y).div(l);
  const n2 = n.mul(n);
  const c = m2.add(n2).sub(1.0).div(3.0);
  const c3 = c.mul(c).mul(c);
  const q = c3.add(m2.mul(n2).mul(2.0));
  const d = c3.add(m2.mul(n2));
  const g = m.add(m.mul(n2));

  // Branch 1: d < 0.0
  const h1 = acos(q.div(c3)).div(3.0);
  const s1 = cos(h1);
  const t1 = sin(h1).mul(sqrt(3.0));
  const rx1 = sqrt(c.negate().mul(s1.add(t1).add(2.0)).add(m2));
  const ry1 = sqrt(c.negate().mul(s1.sub(t1).add(2.0)).add(m2));
  const co1 = ry1.add(sign(l).mul(rx1)).add(abs(g).div(rx1.mul(ry1))).sub(m).div(2.0);

  // Branch 2: d >= 0.0
  const h2 = m.mul(n).mul(sqrt(d)).mul(2.0);
  const s2 = sign(q.add(h2)).mul(pow(abs(q.add(h2)), 1.0 / 3.0));
  const u2 = sign(q.sub(h2)).mul(pow(abs(q.sub(h2)), 1.0 / 3.0));
  const rx2 = s2.negate().sub(u2).sub(c.mul(4.0)).add(m2.mul(2.0));
  const ry2 = s2.sub(u2).mul(sqrt(3.0));
  const rm2 = sqrt(rx2.mul(rx2).add(ry2.mul(ry2)));
  const co2 = ry2.div(sqrt(rm2.sub(rx2))).add(g.mul(2.0).div(rm2)).sub(m).div(2.0);

  const co = select(d.lessThan(0.0), co1, co2);
  const coSqr = co.mul(co);
  const r = ab1.mul(vec2(co, sqrt(float(1.0).sub(coSqr))));
  return length(r.sub(p1)).mul(sign(p1.y.sub(r.y)));
});

// Parabola
export const sdParabola = Fn(([pos, k]: FnArguments) => {
  const px = abs(pos.x);
  const ik = float(1.0).div(k);
  const p = ik.mul(pos.y.sub(ik.mul(0.5))).div(3.0);
  const q = ik.mul(ik).mul(px).mul(0.25);
  const h = q.mul(q).sub(p.mul(p).mul(p));
  const r = sqrt(abs(h));

  const x1 = pow(q.add(r), 1.0 / 3.0).sub(pow(abs(q.sub(r)), 1.0 / 3.0).mul(sign(r.sub(q))));
  const x2 = cos(atan2(r, q).div(3.0)).mul(sqrt(p)).mul(2.0);
  const x = select(h.greaterThan(0.0), x1, x2);

  return length(pos.sub(vec2(x, k.mul(x).mul(x)))).mul(sign(pos.x.sub(x)));
});

// Quadratic Bezier
export const sdBezier = Fn(([pos, A, B, C]: FnArguments) => {
  const a = B.sub(A);
  const b = A.sub(B.mul(2.0)).add(C);
  const c = a.mul(2.0);
  const d = A.sub(pos);
  const kk = float(1.0).div(dot(b, b));
  const kx = kk.mul(dot(a, b));
  const ky = kk.mul(dot(a, a).mul(2.0).add(dot(d, b))).div(3.0);
  const kz = kk.mul(dot(d, a));

  const res = float(0.0).toVar();
  const p = ky.sub(kx.mul(kx));
  const p3 = p.mul(p).mul(p);
  const q = kx.mul(kx.mul(kx).mul(2.0).sub(ky.mul(3.0))).add(kz);
  const h = q.mul(q).add(p3.mul(4.0));

  // Branch 1: h >= 0.0
  const hSqrt = sqrt(h);
  const x_branch1 = vec2(hSqrt, hSqrt.negate()).sub(q).div(2.0);
  const uv = sign(x_branch1).mul(pow(abs(x_branch1), vec2(1.0 / 3.0)));
  const t_branch1 = clamp(uv.x.add(uv.y).sub(kx), 0.0, 1.0);
  const res1 = dot2(d.add(c.add(b.mul(t_branch1)).mul(t_branch1)));

  // Branch 2: h < 0.0
  const z = sqrt(p.negate());
  const v = acos(q.div(p.mul(z).mul(2.0))).div(3.0);
  const m = cos(v);
  const n = sin(v).mul(1.732050808);
  const t_branch2 = clamp(vec3(m.add(m), n.negate().sub(m), n.sub(m)).mul(z).sub(kx), 0.0, 1.0);
  const res2 = min(
    dot2(d.add(c.add(b.mul(t_branch2.x)).mul(t_branch2.x))),
    dot2(d.add(c.add(b.mul(t_branch2.y)).mul(t_branch2.y)))
  );

  res.assign(select(h.greaterThanEqual(0.0), res1, res2));

  return sqrt(res);
});

// Vesica
export const sdVesica = Fn(([p, w, h]: FnArguments) => {
  const pAbs = abs(p);
  const d = w.mul(w).sub(h.mul(h)).div(h).mul(0.5);

  const c = mix(
    vec3(0.0, w, 0.0),
    vec3(d.negate(), 0.0, d.add(h)),
    step(d.mul(pAbs.x.sub(w)), w.mul(pAbs.y))
  );

  return length(vec2(pAbs.x, pAbs.y).sub(vec2(c.y, c.x))).sub(c.z);
});

// Moon
export const sdMoon = Fn(([p, d, ra, rb]: FnArguments) => {
  const py = abs(p.y);
  const a = ra.mul(ra).sub(rb.mul(rb)).add(d.mul(d)).div(d.mul(2.0));
  const b = sqrt(max(ra.mul(ra).sub(a.mul(a)), 0.0));

  const cond = d.mul(p.x.mul(b).sub(py.mul(a))).greaterThan(d.mul(d).mul(max(b.sub(py), 0.0)));
  const dist1 = length(vec2(p.x, py).sub(vec2(a, b)));
  const dist2 = max(
    length(vec2(p.x, py)).sub(ra),
    length(vec2(p.x, py).sub(vec2(d, 0))).sub(rb).negate()
  );

  return mix(dist2, dist1, cond);
});

// Rounded Cross
export const sdRoundedCross = Fn(([p, h]: FnArguments) => {
  const k = h.add(1.0).add(h.recip()).mul(0.5);
  const pAbs = abs(p);

  const cond = pAbs.x.lessThan(1.0).and(pAbs.y.lessThan(pAbs.x.mul(k.sub(h)).add(h)));
  const dist1 = k.sub(sqrt(dot2(pAbs.sub(vec2(1, k)))));
  const dist2 = sqrt(min(
    dot2(pAbs.sub(vec2(0, h))),
    dot2(pAbs.sub(vec2(1, 0)))
  ));

  return mix(dist2, dist1, cond);
});

// ============================================
// Operations
// ============================================

// Make any shape rounded
export const opRound = (sdf: any, r: any) => {
  return sdf.sub(r);
};

// Make any shape annular (ring-like)
export const opOnion = (sdf: any, r: any) => {
  return abs(sdf).sub(r);
};

// Union
export const opUnion = (d1: any, d2: any) => {
  return min(d1, d2);
};

// Intersection
export const opIntersection = (d1: any, d2: any) => {
  return max(d1, d2);
};

// Subtraction
export const opSubtraction = (d1: any, d2: any) => {
  return max(d1.negate(), d2);
};

// Smooth union
export const opSmoothUnion = (d1: any, d2: any, k: any) => {
  const h = clamp(d2.sub(d1).div(k.mul(2.0)).add(0.5), 0.0, 1.0);
  return mix(d2, d1, h).sub(k.mul(h).mul(h.sub(1.0)));
};

// Smooth intersection
export const opSmoothIntersection = (d1: any, d2: any, k: any) => {
  const h = clamp(d2.sub(d1).div(k.mul(2.0)).add(0.5), 0.0, 1.0);
  return mix(d2, d1, h).add(k.mul(h).mul(h.sub(1.0)));
};

// Smooth subtraction
// @ts-ignore
export const opSmoothSubtraction = (d1: any, d2: any, k: any) => {
  const h = clamp(d1.add(d2).div(k.mul(2.0)).add(0.5), 0.0, 1.0);
  return mix(d2, d1.negate(), h).add(k.mul(h).mul(h.sub(1.0)));
};
