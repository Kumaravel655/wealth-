// The tour's plan and camera route, in metres. No renderer here: scripts/check-tour.mjs walks this
// same data to prove the camera never clips a wall or a piece of furniture.
// The building runs along -z. Each partition has one door, offset left and right, so the route weaves.
export const H = 3;
export const EYE = 1.5;
export const WALL = 0.12;
export const DOOR = { w: 1.4, h: 2.3 };
export const OUTER = { x: 4.5, back: 3, end: -25 };
export const PARTITIONS = [
  { z: -3, x: 1.5 },
  { z: -8.5, x: -1.5 },
  { z: -14, x: 1.5 },
  { z: -19.5, x: -1.5 },
];

// Footprints the camera must stay clear of: [xMin, zMin, xMax, zMax]. scene.js builds inside these.
export const FURNITURE = [
  [-3.5, -2.3, -1.3, -0.1], // consultation table and chairs
  [3.6, -8.1, 4.5, -3.3],   // record shelves
  [-4.1, -6.4, -2.3, -4.2], // sorting table
  [1.65, -12.4, 4.5, -9.2], // review desk and chairs
  [-4.1, -17.6, -1.5, -15], // hearing table and chairs
  [-2.4, -24.9, 2.4, -24.3], // console under the board
];

// p: camera [x, z]. l: look target [x, y, z]. f: vertical field of view.
// A door gets three keys (before, in, after) so the curve cannot cut its corner.
export const KEYS = [
  { p: [1.4, 2.0], l: [-2.2, 0.9, -1.2], f: 50 },   // 0  consultation room
  { p: [1.5, -1.2], l: [1.5, 1.4, -5], f: 52 },
  { p: [1.5, -3], l: [1.0, 1.4, -6], f: 52 },
  { p: [1.2, -4.6], l: [2.4, 1.35, -7.4], f: 52 },
  { p: [0.4, -5.7], l: [4.2, 1.35, -5.7], f: 50 },  // 4  records room
  { p: [-1.4, -6.9], l: [-1.5, 1.4, -11], f: 52 },
  { p: [-1.5, -8.5], l: [-1.0, 1.4, -12], f: 52 },
  { p: [-1.6, -9.9], l: [2.0, 1.2, -11.5], f: 50 },
  { p: [-1.9, -11.0], l: [3.2, 1.05, -11.0], f: 46 }, // 8  review desk
  { p: [1.3, -12.7], l: [1.5, 1.4, -17], f: 52 },
  { p: [1.5, -14], l: [1.0, 1.4, -18], f: 52 },
  { p: [1.8, -15.5], l: [-1.5, 1.3, -17.2], f: 50 },
  { p: [2.4, -16.3], l: [-3.4, 1.15, -16.3], f: 46 }, // 12 hearing room
  { p: [-1.1, -18.25], l: [-1.5, 1.4, -22], f: 52 },
  { p: [-1.5, -19.5], l: [-1.0, 1.4, -23], f: 52 },
  { p: [-0.8, -20.8], l: [-0.2, 1.6, -25], f: 50 },
  { p: [0, -21.5], l: [0, 1.62, -25], f: 44 },       // 16 due-date wall
];

// Route coordinate is a key index, so room links never depend on page height or a clock.
export const STOP_KEYS = [0, 4, 8, 12, 16];
