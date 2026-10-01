/* Optional art overrides — see README.md in this folder.
   A value is either a file inside assets/overrides/ ("jca/dragon.png"),
   or a region of a texture atlas: { src, size: [atlas w, atlas h], rect: [x, y, w, h] }. */
window.MA = window.MA || {};

/* Persona 5 style deck: one 508 x 1020 WebP per card, keyed by Rider–Waite number (8 Strength, 11 Justice).
   Cut from the original arcana atlas, whose Marseille order swaps VIII and XI. */
MA.OVERRIDES = {
  "tarot/p5/back": "p5/back.webp",
  "tarot/p5/0": "p5/00-fool.webp",                    // Le Mat
  "tarot/p5/1": "p5/01-magician.webp",                // Le Bateleur
  "tarot/p5/2": "p5/02-high-priestess.webp",          // La Papesse
  "tarot/p5/3": "p5/03-empress.webp",                 // L'Impératrice
  "tarot/p5/4": "p5/04-emperor.webp",                 // L'Empereur
  "tarot/p5/5": "p5/05-hierophant.webp",              // Le Pape
  "tarot/p5/6": "p5/06-lovers.webp",                  // L'Amoureux
  "tarot/p5/7": "p5/07-chariot.webp",                 // Le Chariot
  "tarot/p5/8": "p5/08-strength.webp",                // La Force
  "tarot/p5/9": "p5/09-hermit.webp",                  // L'Hermite
  "tarot/p5/10": "p5/10-wheel-of-fortune.webp",        // La Roue de Fortune
  "tarot/p5/11": "p5/11-justice.webp",                 // La Justice
  "tarot/p5/12": "p5/12-hanged-man.webp",              // Le Pendu
  "tarot/p5/13": "p5/13-death.webp",                   // (XIII)
  "tarot/p5/14": "p5/14-temperance.webp",              // Tempérance
  "tarot/p5/15": "p5/15-devil.webp",                   // Le Diable
  "tarot/p5/16": "p5/16-tower.webp",                   // La Maison Dieu
  "tarot/p5/17": "p5/17-star.webp",                    // L'Étoile
  "tarot/p5/18": "p5/18-moon.webp",                    // La Lune
  "tarot/p5/19": "p5/19-sun.webp",                     // Le Soleil
  "tarot/p5/20": "p5/20-judgement.webp",               // Le Jugement
  "tarot/p5/21": "p5/21-world.webp",                   // Le Monde

  /* Jackie Chan Adventures talismans: one 224 x 224 transparent WebP per animal, cut from the medallion sheet. */
  "jca/rat": "jca/rat.webp",
  "jca/ox": "jca/ox.webp",
  "jca/tiger": "jca/tiger.webp",
  "jca/rabbit": "jca/rabbit.webp",
  "jca/dragon": "jca/dragon.webp",
  "jca/snake": "jca/snake.webp",
  "jca/horse": "jca/horse.webp",
  "jca/goat": "jca/goat.webp",    // the Sheep talisman
  "jca/monkey": "jca/monkey.webp",
  "jca/rooster": "jca/rooster.webp",
  "jca/dog": "jca/dog.webp",
  "jca/pig": "jca/pig.webp",
};
