class DefaultScene extends Phaser.Scene {
    // this.player;
    // this.stars;
    // this.bombs;
    // this.platforms;
    // this.cursors;
    // this.scoreText;

    constructor() {
        super({ key: 'default', active: false });
        this.gameOver = false;
    }

    preload () {
        this.score = 0;
        this.gameOver = false;

        Array.from({length: 9}, (_, i) => {
            this.load.image(`stage${i}`, `assets/stage${i}.png`);
            this.load.image(`ground${i}`, `assets/stage${i}ground.png`);
        });

        this.load.image('polaroid', 'assets/polaroid.png');
        
        this.load.image('star', 'assets/star.png');
        this.load.image('bomb', 'assets/bomb.png');
        this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 200, frameHeight: 300 });
        this.load.spritesheet('enermy', 'assets/enermy.png', { frameWidth: 200, frameHeight: 300 });

        const backdrop = this.load.image('backdrop', 'assets/backdrop.png');
    }

    create () {
        this.score = 0;
        this.count = 10;

        //  A simple background for our game
        this.add.image(800, 450, `stage${currentStage}`);

        //  The platforms group contains the ground and the 2 ledges we can jump on
        this.platforms = this.physics.add.staticGroup();

        //  Here we create the ground.
        //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
        this.platforms.create(800, 864, `ground${currentStage}`).setScale(1).refreshBody();

        //  Now let's create some ledges
        //   platforms.create(600, 400, 'ground');
        //   platforms.create(50, 250, 'ground');
        //   platforms.create(750, 220, 'ground');

        // The player and its settings
        this.player = this.physics.add.sprite(200, 550, 'dude');

        //  Player physics properties. Give the little guy a slight bounce.
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);

        this.enermy = this.physics.add.sprite(1400, 550, 'enermy');

        //  Player physics properties. Give the little guy a slight bounce.
        this.enermy.setBounce(0.2);
        this.enermy.setCollideWorldBounds(true);

        if (!this.anims.anims.size) {
            //  Our player animations, turning, walking left and walking right.
            this.anims.create({
                key: 'left',
                frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
                frameRate: 10,
                repeat: -1
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

            // enermy player animations, turning, walking left and walking right.
            this.anims.create({
                key: 'eleft',
                frames: this.anims.generateFrameNumbers('enermy', { start: 0, end: 3 }),
                frameRate: 10,
                repeat: -1
            });

            this.anims.create({
                key: 'eturn',
                frames: [ { key: 'enermy', frame: 4 } ],
                frameRate: 20
            });

            this.anims.create({
                key: 'eright',
                frames: this.anims.generateFrameNumbers('enermy', { start: 5, end: 8 }),
                frameRate: 10,
                repeat: -1
            });
        }
        this.polaroid = this.add.image(800, 520, 'polaroid');
        this.polaroid.setScale(1 - 0.05 * currentStage);
        // this.polaroid.setAlpha(0.5);

        //  Input Events
        this.cursors = this.input.keyboard.createCursorKeys();

        //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
        // this.stars = this.physics.add.group({
        //     key: 'star',
        //     repeat: 11,
        //     setXY: { x: 12, y: 0, stepX: 70 }
        // });

        // this.stars.children.iterate(function (child) {

        //     //  Give each star a slightly different bounce
        //     child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));

        // });

        this.bombs = this.physics.add.group();

        //  The score
        this.scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });
        this.countText = this.add.text(750, 72, '10', { fontSize: '128px', fill: '#000' });

        //  Collide the player and the stars with the platforms
        this.physics.add.collider(this.player, this.platforms);
        // this.physics.add.collider(this.stars, this.platforms);
        this.physics.add.collider(this.bombs, this.platforms);

        //  Collide the enermy and the stars with the platforms
        this.physics.add.collider(this.enermy, this.platforms);

        this.physics.add.collider(this.player, this.enermy);

        //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
        // this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);

        this.physics.add.collider(this.player, this.bombs, this.hitBomb, null, this);

        this.secondInterval = setInterval(() => this.countdown(), 1000);

        this.physics.add.overlap(this.player, this.polaroid, this.checkPicture, null, this);
    }

    update () {
        if (this.gameOver) {
            return;
        }

        if (this.count === 0) {
            this.checkPicture(this.player, this.polaroid);
        }

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);

            this.player.anims.play('left', true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);

            this.player.anims.play('right', true);
        } else {
            this.player.setVelocityX(0);

            this.player.anims.play('turn');
        }

        if (this.cursors.up.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-330);
        }
    }

    collectStar (player, star) {
        star.disableBody(true, true);

        //  Add and update the score
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);

        if (this.stars.countActive(true) === 0) {
            //  A new batch of stars to collect
            this.stars.children.iterate(function (child) {

                child.enableBody(true, child.x, 0, true, true);

            });

            var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

            var bomb = this.bombs.create(x, 16, 'bomb');
            bomb.setBounce(1);
            bomb.setCollideWorldBounds(true);
            bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
            bomb.allowGravity = false;

        }
    }

    checkPicture (player, polaroid) {
        const intersect = Phaser.Geom.Intersects.RectangleToRectangle(player.getBounds(), polaroid.getBounds());
        if (!this.count && intersect && currentStage < 9) {
            this.clearSecondInterval();
            currentStage += 1;
            gotoNextStage();
        } else {
            const backdrop = this.add.image(800, 450, 'backdrop');
            backdrop.alpha = 0.9;
            this.add.text(450, 400, 'Game Over', { fontSize: '128px', fill: '#000' });
            this.countText.setText('');
            this.gameOver = true;
        }
    }

    countdown () {
        if (this.count <= 0) {
            this.clearSecondInterval();
            return;      
        };
        this.count -= 1;
        this.countText.setText(this.count);
    }

    clearSecondInterval () {
        if (this.secondInterval) {
            clearInterval(this.secondInterval);
        }
        this.secondInterval = undefined;
    }

    hitBomb (player, bomb) {
        this.physics.pause();

        this.player.setTint(0xff0000);

        this.player.anims.play('turn');

        this.gameOver = true;
    }
}

var config = {
  type: Phaser.AUTO,
  width: 1600,
  height: 900,
  physics: {
      default: 'arcade',
      arcade: {
          gravity: { y: 300 },
          debug: false
      }
  },
  scene: DefaultScene
};

function gotoNextStage() {
    game.scene.scenes[0].scene.restart();
}
var game = new Phaser.Game(config);
var currentStage = 1