// OrbitMechanics - Keplerian orbital mechanics for celestial bodies
// Handles orbital elements, position calculation, and orbital transfers
import * as THREE from 'three';
export class OrbitMechanics {
    config;
    G; // Gravitational constant
    centralMass;
    constructor(config = {}) {
        this.config = {
            centralBodyMass: config.centralBodyMass ?? 1.0,
            gravitationalConstant: config.gravitationalConstant ?? 1.0
        };
        this.G = this.config.gravitationalConstant;
        this.centralMass = this.config.centralBodyMass;
    }
    // Convert orbital elements to state vectors (position, velocity)
    elementsToState(elements, time) {
        const { a, e, i, omega, w, M0, epoch } = elements;
        const dt = time - epoch;
        // Mean motion
        const n = Math.sqrt(this.G * this.centralMass / (a * a * a));
        // Mean anomaly
        const M = M0 + n * dt;
        // Solve Kepler's equation for eccentric anomaly E
        // M = E - e * sin(E)
        let E = M;
        for (let iter = 0; iter < 10; iter++) {
            const f = E - e * Math.sin(E) - M;
            const df = 1 - e * Math.cos(E);
            const dE = f / df;
            E -= dE;
            if (Math.abs(dE) < 1e-10)
                break;
        }
        // True anomaly
        const cosE = Math.cos(E);
        const sinE = Math.sin(E);
        const cosNu = (cosE - e) / (1 - e * cosE);
        const sinNu = (Math.sqrt(1 - e * e) * sinE) / (1 - e * cosE);
        const nu = Math.atan2(sinNu, cosNu);
        // Radius
        const r = a * (1 - e * cosE);
        // Position in orbital plane
        const xOrb = r * cosNu;
        const yOrb = r * sinNu;
        const zOrb = 0;
        // Velocity in orbital plane
        const vMag = Math.sqrt(this.G * this.centralMass * (2 / r - 1 / a));
        const vxOrb = -vMag * sinNu / Math.sqrt(1 - e * e) * (1 - e * cosE);
        const vyOrb = vMag * cosNu / Math.sqrt(1 - e * e) * (1 - e * cosE);
        const vzOrb = 0;
        // Rotate to 3D space: R = Rz(-omega) * Rx(-i) * Rz(-w)
        const cosO = Math.cos(omega), sinO = Math.sin(omega);
        const cosI = Math.cos(i), sinI = Math.sin(i);
        const cosW = Math.cos(w), sinW = Math.sin(w);
        // Rotation matrix
        const R11 = cosO * cosW - sinO * sinW * cosI;
        const R12 = -cosO * sinW - sinO * cosW * cosI;
        const R13 = sinO * sinI;
        const R21 = sinO * cosW + cosO * sinW * cosI;
        const R22 = -sinO * sinW + cosO * cosW * cosI;
        const R23 = -cosO * sinI;
        const R31 = sinW * sinI;
        const R32 = cosW * sinI;
        const R33 = cosI;
        // Apply rotation to position
        const position = new THREE.Vector3(R11 * xOrb + R12 * yOrb + R13 * zOrb, R21 * xOrb + R22 * yOrb + R23 * zOrb, R31 * xOrb + R32 * yOrb + R33 * zOrb);
        // Apply rotation to velocity
        const velocity = new THREE.Vector3(R11 * vxOrb + R12 * vyOrb + R13 * vzOrb, R21 * vxOrb + R22 * vyOrb + R23 * vzOrb, R31 * vxOrb + R32 * vyOrb + R33 * vzOrb);
        return { position, velocity };
    }
    // Convert state vectors to orbital elements
    stateToElements(state, time) {
        const { position, velocity } = state;
        const r = position.clone();
        const v = velocity.clone();
        const rMag = r.length();
        const vMag = v.length();
        // Specific angular momentum
        const h = r.clone().cross(v);
        const hMag = h.length();
        // Eccentricity vector
        const mu = this.G * this.centralMass;
        const eVec = v.clone().cross(h).multiplyScalar(1 / mu).sub(r.clone().normalize());
        const e = eVec.length();
        // Semi-major axis
        const energy = vMag * vMag / 2 - mu / rMag;
        const a = -mu / (2 * energy);
        // Inclination
        const i = Math.acos(h.z / hMag);
        // Node vector
        const n = new THREE.Vector3(-h.y, h.x, 0);
        const nMag = n.length();
        // Longitude of ascending node
        let omega = 0;
        if (nMag > 1e-10) {
            omega = Math.acos(n.x / nMag);
            if (n.y < 0)
                omega = 2 * Math.PI - omega;
        }
        // Argument of periapsis
        let w = 0;
        if (nMag > 1e-10 && e > 1e-10) {
            w = Math.acos(n.dot(eVec) / (nMag * e));
            if (eVec.z < 0)
                w = 2 * Math.PI - w;
        }
        // True anomaly
        let nu = 0;
        if (e > 1e-10) {
            nu = Math.acos(eVec.dot(r) / (e * rMag));
            if (r.dot(v) < 0)
                nu = 2 * Math.PI - nu;
        }
        // Mean anomaly
        const E = 2 * Math.atan(Math.sqrt((1 - e) / (1 + e)) * Math.tan(nu / 2));
        const M = E - e * Math.sin(E);
        // Mean motion
        const nMotion = Math.sqrt(mu / (a * a * a));
        return {
            a,
            e,
            i,
            omega,
            w,
            M0: M,
            epoch: time
        };
    }
    // Calculate position at time (simple circular orbit)
    calculateCircularPosition(radius, angularSpeed, startAngle, time) {
        const angle = startAngle + angularSpeed * time;
        return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    }
    // Calculate orbital period
    getOrbitalPeriod(a) {
        return 2 * Math.PI * Math.sqrt(a * a * a / (this.G * this.centralMass));
    }
    // Calculate circular orbital speed
    getCircularSpeed(radius) {
        return Math.sqrt(this.G * this.centralMass / radius);
    }
    // Calculate escape velocity
    getEscapeVelocity(radius) {
        return Math.sqrt(2 * this.G * this.centralMass / radius);
    }
    // Hohmann transfer calculation
    calculateHohmannTransfer(r1, r2) {
        const aTransfer = (r1 + r2) / 2;
        const v1Circular = this.getCircularSpeed(r1);
        const v2Circular = this.getCircularSpeed(r2);
        const vPeri = Math.sqrt(this.G * this.centralMass * (2 / r1 - 1 / aTransfer));
        const vApo = Math.sqrt(this.G * this.centralMass * (2 / r2 - 1 / aTransfer));
        return {
            dv1: Math.abs(vPeri - v1Circular),
            dv2: Math.abs(v2Circular - vApo),
            transferTime: Math.PI * Math.sqrt(aTransfer * aTransfer * aTransfer / (this.G * this.centralMass))
        };
    }
    // Update config
    setCentralMass(mass) {
        this.centralMass = mass;
    }
    setGravitationalConstant(G) {
        this.G = G;
    }
}
// Default orbital elements for solar system planets (simplified)
export const SOLAR_SYSTEM_ELEMENTS = {
    mercury: { a: 0.39, e: 0.206, i: 0.122, omega: 0.803, w: 0.503, M0: 0, epoch: 0 },
    venus: { a: 0.72, e: 0.007, i: 0.059, omega: 1.335, w: 0.963, M0: 0, epoch: 0 },
    earth: { a: 1.0, e: 0.017, i: 0, omega: 0, w: 1.796, M0: 0, epoch: 0 },
    mars: { a: 1.52, e: 0.093, i: 0.032, omega: 0.864, w: 0.620, M0: 0, epoch: 0 },
    jupiter: { a: 5.2, e: 0.048, i: 0.023, omega: 1.753, w: 0.241, M0: 0, epoch: 0 },
    saturn: { a: 9.54, e: 0.054, i: 0.043, omega: 1.981, w: 1.628, M0: 0, epoch: 0 },
    uranus: { a: 19.2, e: 0.047, i: 0.014, omega: 1.379, w: 1.628, M0: 0, epoch: 0 },
    neptune: { a: 30.1, e: 0.009, i: 0.031, omega: 2.346, w: 2.463, M0: 0, epoch: 0 }
};
//# sourceMappingURL=OrbitMechanics.js.map