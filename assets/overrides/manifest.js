/* Optional art overrides — see README.md in this folder.
   A value is either a file inside assets/overrides/ ("jca/dragon.png"),
   or a region of a texture atlas: { src, size: [atlas w, atlas h], rect: [x, y, w, h] }. */
window.MA = window.MA || {};

/* images.jpg: Persona 5 style deck — card back, then the Major Arcana in Marseille order
   (VIII La Justice, XI La Force), ten cells per row. Rects include the numeral and the title. */
const ATLAS = [577, 346];
MA.OVERRIDES = {
  "tarot/p5/back": { src: "images.jpg", size: ATLAS, rect: [0, 0, 58, 116] },
  "tarot/p5/0": { src: "images.jpg", size: ATLAS, rect: [58.7, 0.0, 55, 107] },   // Fool
  "tarot/p5/1": { src: "images.jpg", size: ATLAS, rect: [116.4, 0.0, 55, 107] },   // Magician
  "tarot/p5/2": { src: "images.jpg", size: ATLAS, rect: [174.1, 0.0, 55, 107] },   // High Priestess
  "tarot/p5/3": { src: "images.jpg", size: ATLAS, rect: [231.8, 0.0, 55, 107] },   // Empress
  "tarot/p5/4": { src: "images.jpg", size: ATLAS, rect: [289.5, 0.0, 55, 107] },   // Emperor
  "tarot/p5/5": { src: "images.jpg", size: ATLAS, rect: [347.2, 0.0, 55, 107] },   // Hierophant
  "tarot/p5/6": { src: "images.jpg", size: ATLAS, rect: [404.9, 0.0, 55, 107] },   // Lovers
  "tarot/p5/7": { src: "images.jpg", size: ATLAS, rect: [462.6, 0.0, 55, 107] },   // Chariot
  "tarot/p5/8": { src: "images.jpg", size: ATLAS, rect: [116.4, 115.5, 55, 107] },   // Strength
  "tarot/p5/9": { src: "images.jpg", size: ATLAS, rect: [1.0, 115.5, 55, 107] },   // Hermit
  "tarot/p5/10": { src: "images.jpg", size: ATLAS, rect: [58.7, 115.5, 55, 107] },   // Wheel of Fortune
  "tarot/p5/11": { src: "images.jpg", size: ATLAS, rect: [520.3, 0.0, 55, 107] },   // Justice
  "tarot/p5/12": { src: "images.jpg", size: ATLAS, rect: [174.1, 115.5, 55, 107] },   // Hanged Man
  "tarot/p5/13": { src: "images.jpg", size: ATLAS, rect: [231.8, 115.5, 55, 107] },   // Death
  "tarot/p5/14": { src: "images.jpg", size: ATLAS, rect: [289.5, 115.5, 55, 107] },   // Temperance
  "tarot/p5/15": { src: "images.jpg", size: ATLAS, rect: [347.2, 115.5, 55, 107] },   // Devil
  "tarot/p5/16": { src: "images.jpg", size: ATLAS, rect: [404.9, 115.5, 55, 107] },   // Tower
  "tarot/p5/17": { src: "images.jpg", size: ATLAS, rect: [462.6, 115.5, 55, 107] },   // Star
  "tarot/p5/18": { src: "images.jpg", size: ATLAS, rect: [520.3, 115.5, 55, 107] },   // Moon
  "tarot/p5/19": { src: "images.jpg", size: ATLAS, rect: [1.0, 231.0, 55, 107] },   // Sun
  "tarot/p5/20": { src: "images.jpg", size: ATLAS, rect: [58.7, 231.0, 55, 107] },   // Judgement
  "tarot/p5/21": { src: "images.jpg", size: ATLAS, rect: [116.4, 231.0, 55, 107] },   // World
};
