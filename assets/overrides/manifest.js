/* Optional art overrides — see README.md in this folder.
   A value is either a file inside assets/overrides/ ("jca/dragon.png"),
   or a region of a texture atlas: { src, size: [atlas w, atlas h], rect: [x, y, w, h] }. */
window.MA = window.MA || {};

/* arcana.png: Persona 5 style deck on a 10 x 3 grid of 513 x 1025 px cells (1 px separators):
   card back, then the Major Arcana in Marseille order (VIII La Justice, XI La Force).
   Rects are the cell interiors inset 2 px (so the pink separators never bleed in) and include the numeral and title. */
const ATLAS = [5131, 3076];
MA.OVERRIDES = {
  "tarot/p5/back": { src: "arcana.png", size: ATLAS, rect: [3, 3, 508, 1020] },
  "tarot/p5/0": { src: "arcana.png", size: ATLAS, rect: [516, 3, 508, 1020] },   // Fool
  "tarot/p5/1": { src: "arcana.png", size: ATLAS, rect: [1029, 3, 508, 1020] },   // Magician
  "tarot/p5/2": { src: "arcana.png", size: ATLAS, rect: [1542, 3, 508, 1020] },   // High Priestess
  "tarot/p5/3": { src: "arcana.png", size: ATLAS, rect: [2055, 3, 508, 1020] },   // Empress
  "tarot/p5/4": { src: "arcana.png", size: ATLAS, rect: [2568, 3, 508, 1020] },   // Emperor
  "tarot/p5/5": { src: "arcana.png", size: ATLAS, rect: [3081, 3, 508, 1020] },   // Hierophant
  "tarot/p5/6": { src: "arcana.png", size: ATLAS, rect: [3594, 3, 508, 1020] },   // Lovers
  "tarot/p5/7": { src: "arcana.png", size: ATLAS, rect: [4107, 3, 508, 1020] },   // Chariot
  "tarot/p5/8": { src: "arcana.png", size: ATLAS, rect: [1029, 1028, 508, 1020] },   // Strength
  "tarot/p5/9": { src: "arcana.png", size: ATLAS, rect: [3, 1028, 508, 1020] },   // Hermit
  "tarot/p5/10": { src: "arcana.png", size: ATLAS, rect: [516, 1028, 508, 1020] },   // Wheel of Fortune
  "tarot/p5/11": { src: "arcana.png", size: ATLAS, rect: [4620, 3, 508, 1020] },   // Justice
  "tarot/p5/12": { src: "arcana.png", size: ATLAS, rect: [1542, 1028, 508, 1020] },   // Hanged Man
  "tarot/p5/13": { src: "arcana.png", size: ATLAS, rect: [2055, 1028, 508, 1020] },   // Death
  "tarot/p5/14": { src: "arcana.png", size: ATLAS, rect: [2568, 1028, 508, 1020] },   // Temperance
  "tarot/p5/15": { src: "arcana.png", size: ATLAS, rect: [3081, 1028, 508, 1020] },   // Devil
  "tarot/p5/16": { src: "arcana.png", size: ATLAS, rect: [3594, 1028, 508, 1020] },   // Tower
  "tarot/p5/17": { src: "arcana.png", size: ATLAS, rect: [4107, 1028, 508, 1020] },   // Star
  "tarot/p5/18": { src: "arcana.png", size: ATLAS, rect: [4620, 1028, 508, 1020] },   // Moon
  "tarot/p5/19": { src: "arcana.png", size: ATLAS, rect: [3, 2053, 508, 1020] },   // Sun
  "tarot/p5/20": { src: "arcana.png", size: ATLAS, rect: [516, 2053, 508, 1020] },   // Judgement
  "tarot/p5/21": { src: "arcana.png", size: ATLAS, rect: [1029, 2053, 508, 1020] },   // World
};
