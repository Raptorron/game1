import Phaser from "phaser";
import logoImg from "./assets/logo.png";

const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
        gravity: { y: 300 },
        debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);

function preload() {
  this.load.image('sky', 'src/assets/sky.png');
  this.load.image('ground', 'src/assets/platform.png');
  this.load.image('star', 'src/assets/star.png');
  this.load.image('bomb', 'src/assets/bomb.png');
  this.load.image('button', 'src/assets/reset.png', { frameWidth: 132, frameHeight: 48 });
  this.load.spritesheet('dude', 'src/assets/dude.png', { frameWidth: 32, frameHeight: 48 }); //spritesheet contains animation frames
}

//variables
let player;
let stars;
let bombs;
let platforms;
let cursors;
let score = 0;
let highScore = 0;
let gameOver = false;
let scoreText;
let highScoreText;
let button;

function create() {

  //background
  this.add.image(400, 300, 'sky');

  //foreground platforms
  platforms = this.physics.add.staticGroup();
  platforms.create(400, 568, 'ground').setScale(2).refreshBody();
  platforms.create(400, 400, 'ground');
  platforms.create(50, 250, 'ground');
  platforms.create(750, 220, 'ground');

  //reset button
  button = this.add.image(370, 30, 'button');
  button.setScale(.03);
  button.setInteractive();

  //scores diplayed
  scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });
  highScoreText = this.add.text(480, 16, 'high score: 0', { fontSize: '32px', fill: '#000' });

  //dynamic player
  player = this.physics.add.sprite(100, 450, 'dude');
  player.setBounce(0.2); //player will slightly bounce after landing
  player.setCollideWorldBounds(true);
  player.body.setGravityY(200)

  //player animations
  this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }), //frames 0, 1, 2, 3
      frameRate: 10, //10fps
      repeat: -1 //loop
  });
  this.anims.create({
      key: 'turn',
      frames: [ { key: 'dude', frame: 4 } ],
      frameRate: 20
  });
  this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1
  });

  //keyboard function (up, down, left, right)
  cursors = this.input.keyboard.createCursorKeys();

  //stars
  stars = this.physics.add.group({
    key: 'star',
    repeat: 11,
    setXY: { x: 12, y: 0, stepX: 70 }
  });
  stars.children.iterate(function (child) {
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
  });

  //bombs
  bombs = this.physics.add.group();

  let x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400); //bomb drops on opposite side of screen as player
  let bomb = bombs.create(x, 20, 'bomb');
  bomb.setScale(1.7);
  bomb.setBounce(1);
  bomb.setCollideWorldBounds(true);
  bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
  bomb.allowGravity = false;

  //Collisions
  this.physics.add.collider(player, platforms);
  this.physics.add.collider(stars, platforms);
  this.physics.add.collider(bombs, platforms);

  //Overlap
  this.physics.add.overlap(player, stars, collectStar, null, this); //when player runs over stars, collect them

  this.physics.add.collider(player, bombs, hitBomb, null, this);

}

function update() {

  //player movement
  if (cursors.left.isDown) {
    player.setVelocityX(-160);
    player.anims.play('left', true);
  }
  else if (cursors.right.isDown) {
    player.setVelocityX(160);
    player.anims.play('right', true);
  }
  else {
    player.setVelocityX(0);
    player.anims.play('turn');
  }
  if (cursors.up.isDown && player.body.touching.down) {
    //player can only jump off the ground
    player.setVelocityY(-430);
  }
}

function collectStar (player, star) {
  //disables the star body and adds to score
  star.disableBody(true, true);
  score += 1;
  scoreText.setText('score: ' + score);

  if (stars.countActive(true) === 0) {
    //  A new batch of stars to collect
    stars.children.iterate(function (child) {
      child.enableBody(true, child.x, 0, true, true);
    });
    //A new bomb drops each round
    let x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
    let newBomb = bombs.create(x, 20, 'bomb');
    newBomb.setScale(1.7);
    newBomb.setBounce(1);
    newBomb.setCollideWorldBounds(true);
    newBomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    newBomb.allowGravity = false;
  }
}

function hitBomb (player, bomb) {
  this.physics.pause();
  player.setTint(0xff0000); //turns the player red
  player.anims.play('turn');
  gameOver = true;

  //when reset button is clicked, reset game but keep high score
  button.on('pointerdown', () => {
    //set high score
    if(score > highScore){
      highScore = score;
      highScoreText.setText('high score: ' + highScore);
    }
    //reset
    score = 0;
    scoreText.setText('score: ' + score);
    this.physics.resume();
    player.clearTint();
    bombs.clear(true);
    //new stars on reset
    stars.children.iterate(function (child) {
      child.enableBody(true, child.x, 0, true, true);
    });
    //new bomb on reset
    let x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
    let newBomb2 = bombs.create(x, 20, 'bomb');
    newBomb2.setScale(1.7);
    newBomb2.setBounce(1);
    newBomb2.setCollideWorldBounds(true);
    newBomb2.setVelocity(Phaser.Math.Between(-200, 200), 20);
    newBomb2.allowGravity = false;
  });
}

