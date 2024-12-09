let flock = [];
let obstacles = [];
let sharks = []; // Tableau contenant tous les requins (mâles et femelles)
let fishImage, sharkImage, sharkFemaleImage, bgImage;
let target, labelNbBoids, labelNbSharks; // Ajout de labelNbSharks
let alignSlider, cohesionSlider, separationSlider, boundariesSlider, perceptionSlider, sizeSlider;

function preload() {
  fishImage = loadImage('assets/niceFishtransparent.png'); // Poisson
  sharkImage = loadImage('assets/requin.png'); // Requin mâle
  sharkFemaleImage = loadImage('assets/requinFemelle.jpg'); // Requin femelle
  bgImage = loadImage('assets/background.jpg'); // Image d'arrière-plan
}

function setup() {
  createCanvas(1600, 800);

  // Sliders pour ajuster les comportements
  const posYSliderDeDepart = 10;
  alignSlider = creerUnSlider("Poids alignment", 0, 2, 1.5, 0.1, 10, posYSliderDeDepart);
  cohesionSlider = creerUnSlider("Poids cohesion", 0, 2, 1, 0.1, 10, posYSliderDeDepart + 30);
  separationSlider = creerUnSlider("Poids séparation", 0, 15, 3, 0.1, 10, posYSliderDeDepart + 60);
  boundariesSlider = creerUnSlider("Poids boundaries", 0, 15, 10, 1, 10, posYSliderDeDepart + 90);
  perceptionSlider = creerUnSlider("Perception radius", 15, 60, 25, 1, 10, posYSliderDeDepart + 120);
  sizeSlider = creerUnSlider("Taille des poissons", 4, 40, 6, 1, 10, posYSliderDeDepart + 150);

  // Créer les poissons
  for (let i = 0; i < 200; i++) {
    let boid = new Boid(random(width), random(height), fishImage);
    boid.r = random(8, 40);
    flock.push(boid);
  }

  // Affichage du nombre de boids
  labelNbBoids = createP("Nombre de boids : " + flock.length);
  labelNbBoids.style('color', 'white');
  labelNbBoids.position(10, posYSliderDeDepart + 180);

  // Affichage du nombre de requins
  labelNbSharks = createP("Nombre de requins : " + sharks.length);
  labelNbSharks.style('color', 'white');
  labelNbSharks.position(10, posYSliderDeDepart + 210);

  // Cible (souris)
  target = createVector(mouseX, mouseY);
  target.r = 50;

  // Ajouter un requin mâle
  let shark = new Boid(width / 2, height / 2, sharkImage);
  shark.r = 40;
  shark.maxSpeed = 7;
  shark.maxForce = 0.5;
  sharks.push(shark);

  // Ajouter un requin femelle
  let sharkFemale = new Boid(width / 3, height / 3, sharkFemaleImage);
  sharkFemale.r = 40;
  sharkFemale.maxSpeed = 5;
  sharkFemale.maxForce = 0.3;
  sharks.push(sharkFemale);
}

function draw() {
  // Afficher l'image d'arrière-plan
  image(bgImage, 800, 400, width, height);

  // Mise à jour du nombre de boids
  labelNbBoids.html("Nombre de boids : " + flock.length);

  // Mise à jour du nombre de requins
  labelNbSharks.html("Nombre de requins : " + sharks.length);

  // Mettre à jour les sliders pour ajuster les comportements des poissons
  flock.forEach(boid => {
    boid.alignWeight = alignSlider.value();
    boid.cohesionWeight = cohesionSlider.value();
    boid.separationWeight = separationSlider.value();
    boid.boundariesWeight = boundariesSlider.value();
    boid.perceptionRadius = perceptionSlider.value();
    boid.r = sizeSlider.value();
  });

  // Dessiner la souris (cible des poissons)
  target.x = mouseX;
  target.y = mouseY;
  fill("lightgreen");
  ellipse(target.x, target.y, target.r);

  // Dessiner les obstacles
  obstacles.forEach(obstacle => obstacle.show());

  // Mettre à jour et afficher les poissons
  for (let boid of flock) {
    boid.fleeWithTargetRadius(target);

    let avoidForce = boid.avoid(obstacles);
    avoidForce.mult(2);
    boid.applyForce(avoidForce);

    boid.flock(flock);
    boid.update();
    boid.show();
  }

  // Mise à jour et affichage de tous les requins
  for (let i = 0; i < sharks.length; i++) {
    let shark = sharks[i];

    // Comportement wander
    let wanderForce = shark.wander();
    wanderForce.mult(1);
    shark.applyForce(wanderForce);

    // Évitement des obstacles
    let avoidForce = shark.avoid(obstacles);
    avoidForce.mult(2);
    shark.applyForce(avoidForce);

    // Trouver le poisson le plus proche
    let closest = shark.getVehiculeLePlusProche(flock);
    if (closest) {
      let d = dist(shark.pos.x, shark.pos.y, closest.pos.x, closest.pos.y);
      if (d < 70) {
        let seekForce = shark.seek(closest.pos);
        seekForce.mult(7);
        shark.applyForce(seekForce);
      }
      if (d < 5) {
        flock.splice(flock.indexOf(closest), 1); // Le requin mange le poisson
      }
    }

    shark.update();
    shark.show();
    shark.edges(); // Maintenir les requins dans le canvas

    // Reproduction avec d'autres requins
    for (let j = i + 1; j < sharks.length; j++) {
      let otherShark = sharks[j];
      let distance = dist(shark.pos.x, shark.pos.y, otherShark.pos.x, otherShark.pos.y);

      // Vérifier s'ils sont proches pour se reproduire
      if (distance < 50 && random(1) < 0.01) {
        let isMale = random(1) < 0.5; // 50% mâle ou femelle
        let newShark = new Boid(
          (shark.pos.x + otherShark.pos.x) / 2,
          (shark.pos.y + otherShark.pos.y) / 2,
          isMale ? sharkImage : sharkFemaleImage
        );
        newShark.r = 40;
        newShark.maxSpeed = 5;
        newShark.maxForce = 0.3;
        sharks.push(newShark);

        console.log(isMale ? "Un nouveau requin mâle est né !" : "Une nouvelle femelle requin est née !");
      }
    }
  }
}

// Ajouter un obstacle en cliquant
function mousePressed() {
  obstacles.push(new Obstacle(mouseX, mouseY, random(20, 100), "green"));
}

// Classe Obstacle
class Obstacle {
  constructor(x, y, r, color) {
    this.pos = createVector(x, y);
    this.r = r;
    this.color = color;
  }

  show() {
    fill(this.color);
    ellipse(this.pos.x, this.pos.y, this.r * 2);
  }
}

function creerUnSlider(label, min, max, val, step, posX, posY) {
  let slider = createSlider(min, max, val, step);
  let labelP = createP(label);
  labelP.position(posX, posY);
  labelP.style('color', 'white');

  slider.position(posX + 150, posY + 17);

  let valueSpan = createSpan(slider.value());
  valueSpan.position(posX + 300, posY + 17);
  valueSpan.style('color', 'white');
  valueSpan.html(slider.value());

  slider.input(() => {
    valueSpan.html(slider.value());
  });

  return slider;
}

function mouseDragged() {
  const b = new Boid(mouseX, mouseY, fishImage);
  b.r = random(8, 40);
  flock.push(b);
}
