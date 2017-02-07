var game = null;

var Ocean = {
	vr: {
		width: 640,
		height: 363,
		player: null,
		aliens: null,
		bullets: null,
		bulletTime: 0,
		explosions: null,
		fails: null,
		starfield: null,
		score: 0,
		scoreString: '',
		scoreText: null,
		lives: null,
		enemyTimer: 0,
		asteroidTimer: 0,
		stateText: null,
		typesAsteroid: [ 'asteroid1', 'asteroid2', 'asteroid3', 'asteroid4', 'asteroid5', 'asteroid6', 'asteroid7', 'asteroid8', 'asteroid9', 'asteroid10', 'asteroid11' ],
		asteroids: null,
		ready: false,
		countdown: null,
		difficulty: 0,
		aliensSpeed: [4000, 3000, 2000, 1000],
		asteroidsSpeed: [2500, 2000, 1500, 1000],
		cursors: null,
		fireButton: null
	},
	
	init: function(){
		game.state.add("Game", Ocean.Game);
		game.state.start("Game");
	}
};

Ocean.Game = function(game){};

Ocean.Game.prototype = {
	preload: function(){
		game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		game.scale.forceOrientation(true, false);
		game.scale.enterIncorrectOrientation.add(this.handleIncorrect);
		game.scale.leaveIncorrectOrientation.add(this.handleCorrect);
		
		game.load.image('bullet', 'img/bullet.png');
		game.load.spritesheet('invader', 'img/invader32x32x4.png', 32, 32);
		game.load.image('ship', 'img/player.png');
		game.load.spritesheet('kaboom', 'img/explode.png', 128, 128);
		game.load.spritesheet('fail', 'img/explode2.png', 26, 26);
		game.load.image('starfield', 'img/starfield.png');
		
		game.load.image('asteroid1', 'img/asteroid1.png');
		game.load.image('asteroid2', 'img/asteroid2.png');
		game.load.image('asteroid3', 'img/asteroid3.png');
		game.load.image('asteroid4', 'img/asteroid4.png');
		game.load.image('asteroid5', 'img/asteroid5.png');
		game.load.image('asteroid6', 'img/asteroid6.png');
		game.load.image('asteroid7', 'img/asteroid7.png');
		game.load.image('asteroid8', 'img/asteroid8.png');
		game.load.image('asteroid9', 'img/asteroid9.png');
		game.load.image('asteroid10', 'img/asteroid10.png');
		game.load.image('asteroid11', 'img/asteroid11.png');
	},

	create: function(){
		game.physics.startSystem(Phaser.Physics.ARCADE);
		
		//  The scrolling starfield background
		Ocean.vr.starfield = game.add.tileSprite(0, 0, Ocean.vr.width, Ocean.vr.height, 'starfield');
		
		//  Our bullet group
		Ocean.vr.bullets = game.add.group();
		Ocean.vr.bullets.enableBody = true;
		Ocean.vr.bullets.physicsBodyType = Phaser.Physics.ARCADE;
		Ocean.vr.bullets.createMultiple(30, 'bullet');
		Ocean.vr.bullets.setAll('anchor.x', 0.5);
		Ocean.vr.bullets.setAll('anchor.y', 1);
		Ocean.vr.bullets.setAll('outOfBoundsKill', true);
		Ocean.vr.bullets.setAll('checkWorldBounds', true);
		
		//  El Héroe!
		Ocean.vr.player = game.add.sprite(50, game.world.centerY, 'ship');
		Ocean.vr.player.anchor.setTo(0.5, 0.5);
		game.physics.enable(Ocean.vr.player, Phaser.Physics.ARCADE);
		Ocean.vr.player.body.collideWorldBounds = true;
		
		//  The baddies!
		Ocean.vr.aliens = game.add.group();
		Ocean.vr.aliens.enableBody = true;
		Ocean.vr.aliens.physicsBodyType = Phaser.Physics.ARCADE;
		Ocean.vr.aliens.createMultiple(30, 'invader');
		Ocean.vr.aliens.callAll('animations.add', 'animations', 'fly', [ 0, 1, 2, 3 ], 20, true);
		Ocean.vr.aliens.callAll('animations.play', 'animations', 'fly');
		Ocean.vr.aliens.setAll('anchor.x', 0.5);
		Ocean.vr.aliens.setAll('anchor.y', 0.5);
		Ocean.vr.aliens.setAll('outOfBoundsKill', true);
		Ocean.vr.aliens.setAll('checkWorldBounds', true);
			
		// The asteroids
		Ocean.vr.asteroids = game.add.group();
		Ocean.vr.asteroids.enableBody = true;
		Ocean.vr.asteroids.physicsBodyType = Phaser.Physics.ARCADE;
		Ocean.vr.asteroids.setAll('outOfBoundsKill', true);
		Ocean.vr.asteroids.setAll('checkWorldBounds', true);
		
		//  The score
		Ocean.vr.scoreString = 'Score : ';
		Ocean.vr.scoreText = game.add.text(10, 10, Ocean.vr.scoreString + Ocean.vr.score, { font: '34px Arial', fill: '#fff' });
		
		//  Lives
		Ocean.vr.lives = game.add.group();
		game.add.text(game.world.width - 100, 10, 'Lives : ', { font: '34px Arial', fill: '#fff' });
		
		for (var i = 0; i < 3; i++) 
		{
			var ship = Ocean.vr.lives.create(game.world.width - 85 + (30 * i), 60, 'ship');
			ship.anchor.setTo(0.5, 0.5);
			ship.alpha = 0.4;
		}
		
		//  An explosion pool
		Ocean.vr.explosions = game.add.group();
		Ocean.vr.explosions.createMultiple(30, 'kaboom');
		Ocean.vr.explosions.forEach(this.setupInvader, this);
		
		//  An fail pool
		Ocean.vr.fails = game.add.group();
		Ocean.vr.fails.createMultiple(30, 'fail');
		Ocean.vr.fails.forEach(this.setupAsteorid, this);
		
		//  Text
		Ocean.vr.stateText = game.add.text(game.world.centerX, game.world.centerY, ' ', { font: '84px Arial', fill: '#fff' });
		Ocean.vr.stateText.anchor.setTo(0.5, 0.5);
		Ocean.vr.stateText.visible = true;
		
		// Countdown
		Ocean.vr.countdown = game.time.create(false);
		Ocean.vr.countdown.add(Phaser.Timer.SECOND * 5, this.endTimer, this);
		Ocean.vr.countdown.start();
		
		//  And some controls to play the game with
		Ocean.vr.cursors = game.input.keyboard.createCursorKeys();
		Ocean.vr.fireButton = game.input.keyboard.addKey(Phaser.Keyboard.OceanBAR);
		window.addEventListener("deviceorientation", this.handleOrientation, true);
		game.input.onTap.add(this.fireBullet, this);
	},
	
	handleIncorrect: function(){
     	if(!game.device.desktop){
     		document.getElementById("portrait").style.display="block";
     	}
	},

	handleCorrect: function(){
		if(!game.device.desktop){
			document.getElementById("portrait").style.display="none";
		}
	},
	
	handleOrientation: function(e) {
		// Device Orientation API
		var y = e.gamma;
		Ocean.vr.player.body.velocity.y = y * -30;
	},
	
	endTimer: function() {
        // Stop the timer when the delayed event triggers
        Ocean.vr.countdown.stop();
		Ocean.vr.stateText.visible = false;
		Ocean.vr.ready = true;
		Ocean.vr.enemyTimer = game.time.now + Ocean.vr.aliensSpeed[Ocean.vr.difficulty];
    },
	
	setupInvader: function(invader){
		invader.anchor.x = 0.5;
		invader.anchor.y = 0.5;
		invader.animations.add('kaboom');
	},
	
	setupAsteorid: function(asteroid){
		asteroid.anchor.x = 0.5;
		asteroid.anchor.y = 0.5;
		asteroid.animations.add('fail');
	},
	
	fireBullet: function(){
		if(Ocean.vr.player.alive){
			//  To avoid them being allowed to fire too fast we set a time limit
			if (game.time.now > Ocean.vr.bulletTime){
				//  Grab the first bullet we can from the pool
				bullet = Ocean.vr.bullets.getFirstExists(false);

				if (bullet){
					//  And fire it
					bullet.reset(Ocean.vr.player.x + 8, Ocean.vr.player.y + 3);
					bullet.body.velocity.x = 400;
					Ocean.vr.bulletTime = game.time.now + 200;
				}
			}
		}
	},
	
	collisionHandler: function(bullet, alien){
		bullet.kill();
		alien.kill();

		//  Increase the score
		Ocean.vr.score += 20;
		Ocean.vr.scoreText.text = Ocean.vr.scoreString + Ocean.vr.score;

		//  And create an explosion :)
		var explosion = Ocean.vr.explosions.getFirstExists(false);
		explosion.reset(alien.body.x, alien.body.y);
		explosion.play('kaboom', 30, false, true);
		
		if (Ocean.vr.score >= 1000){
			Ocean.vr.difficulty = 3;
		}else if (Ocean.vr.score >= 500){
			Ocean.vr.difficulty = 2;
		}else if (Ocean.vr.score >= 100){
			Ocean.vr.difficulty = 1;
		}
	},
	
	collisionBlockedHandler:function(bullet, asteroid){
		bullet.kill();
		
		//  And create an explosion :)
		var explosion = Ocean.vr.fails.getFirstExists(false);
		explosion.reset(asteroid.body.x, asteroid.body.y);
		explosion.play('fail', 30, false, true);
	},
	
	objectHitsPlayer: function(player, object){
		object.kill();
		live = Ocean.vr.lives.getFirstAlive();

		if (live){
			live.kill();
		}

		//  And create an explosion :)
		var explosion = Ocean.vr.explosions.getFirstExists(false);
		explosion.reset(Ocean.vr.player.body.x, Ocean.vr.player.body.y);
		explosion.play('kaboom', 30, false, true);

		// When the player dies
		if (Ocean.vr.lives.countLiving() < 1){
			Ocean.vr.player.kill();
			Ocean.vr.aliens.callAll('kill');
			Ocean.vr.asteroids.callAll('kill');

			Ocean.vr.stateText.text = " GAME OVER \n Tap to restart";
			Ocean.vr.stateText.visible = true;

			//the "click to restart" handler
			game.input.onTap.addOnce(this.restart,this);
		}
	},
	
	restart: function(){
		//resets the life count
		Ocean.vr.lives.callAll('revive');

		//revives the player
		Ocean.vr.player.revive();
		
		Ocean.vr.difficulty = 0;
		Ocean.vr.score = 0;
		Ocean.vr.scoreText.text = Ocean.vr.scoreString + Ocean.vr.score;
		Ocean.vr.ready = false;
		Ocean.vr.countdown.add(5000, this.endTimer, this);
		Ocean.vr.countdown.start();
	},
	
	enemyShow: function(){		
		alien = Ocean.vr.aliens.getFirstExists(false);

		if (alien){
			alien.reset(Ocean.vr.width, Math.floor(Math.random() * Ocean.vr.height));

			game.physics.arcade.moveToObject(alien, Ocean.vr.player, 120);
			Ocean.vr.enemyTimer = game.time.now + Ocean.vr.aliensSpeed[Ocean.vr.difficulty];
		}
	},
	
	asteroidShow: function(){
		var random = game.rnd.integerInRange(0, Ocean.vr.typesAsteroid.length-1);
		var asteroid = Ocean.vr.asteroids.create(0, 0, Ocean.vr.typesAsteroid[random]);
		asteroid.anchor.setTo(0.5, 0.5);
		
		if (asteroid){
			var y = Math.floor(Math.random() * Ocean.vr.height);
			asteroid.reset(Ocean.vr.width, y);
			asteroid.body.angularVelocity = 25;

			var velocity = (Math.floor(Math.random() * 25) + 5 ) * 10;
			game.physics.arcade.moveToObject(asteroid, {x:0, y:y}, velocity);
			Ocean.vr.asteroidTimer = game.time.now + Ocean.vr.asteroidsSpeed[Ocean.vr.difficulty];
		}
	},
	
	update: function() {
		//  Scroll the background
		Ocean.vr.starfield.tilePosition.x -= 2;

		if(Ocean.vr.ready){
			if(Ocean.vr.player.alive){
				if(Ocean.vr.cursors.up.isDown){
					Ocean.vr.player.body.velocity.y = -200;
				}else if (Ocean.vr.cursors.down.isDown){
					Ocean.vr.player.body.velocity.y = 200;
				}
				
				if (Ocean.vr.fireButton.isDown){
					this.fireBullet();
				}
				
				if (game.time.now > Ocean.vr.enemyTimer){
					this.enemyShow();
				}
				
				if (game.time.now > Ocean.vr.asteroidTimer){
					this.asteroidShow();
				}
				
				//  Run collision
				game.physics.arcade.overlap(Ocean.vr.bullets, Ocean.vr.asteroids, this.collisionBlockedHandler, null, this);
				game.physics.arcade.overlap(Ocean.vr.bullets, Ocean.vr.aliens, this.collisionHandler, null, this);
				game.physics.arcade.overlap(Ocean.vr.asteroids, Ocean.vr.player, this.objectHitsPlayer, null, this);
				game.physics.arcade.overlap(Ocean.vr.aliens, Ocean.vr.player, this.objectHitsPlayer, null, this);
			}
		}
		
	},
	
	render: function() {
		if(Ocean.vr.countdown.running) {
			Ocean.vr.stateText.text = 'Tap to fire\nReady? ' + (Ocean.vr.countdown.duration / 1000).toFixed(0);
		}
	}
};

if ('addEventListener' in document) {
    document.addEventListener('deviceready', function() {
		game = new Phaser.Game(Ocean.vr.width, Ocean.vr.height, Phaser.CANVAS, 'phaser');
        Ocean.init();
    }, false);
}