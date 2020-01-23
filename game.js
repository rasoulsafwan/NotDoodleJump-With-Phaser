// var tile;
var scaleRatio = window.devicePixelRatio / 3;
var player;
var floor;
var tile;
var tilesGroup;
var tileChild;
var breakTilesGroup;
var breakTileChild;
var DisTilesGroup
var DisTileChild;
var springGroup;
var springChild;
var starGroup;
var starChild;
var score = 0;
var scoreText;
var tn;
var td;
var tb;
var zoneL;
var zoneR;
var rocket;
var spring;
var star;
var enemy_m;
var enemy_s;
class Game extends Phaser.Scene {
	constructor() {
		super("Game");
	}

	preload() {
		/* Preload all assets. */
		this.load.svg("player", "assets/player-01.svg", { scale: .8 });
		// this.load.svg("tile", "assets/");
		this.load.svg("tile-n", "assets/tile-n-01.svg", { scale: 1 });
		this.load.svg("tile-d", "assets/tile-d-01.svg", { scale: 1 });
		this.load.svg("tile-b", "assets/tile-b-01.svg", { scale: 1 });
		this.load.svg("rocket", "assets/");
		this.load.svg("spring", "assets/spring.svg", {scale: 1.8});
		this.load.svg("star", "assets/star-01.svg", {scale: 2.1});
		this.load.svg("enemy-m", "assets/enemy-m-01.svg", {scale: 1});
		this.load.svg("enemy-s", "assets/enemy-s-01.svg", {scale: 1});
	}

	create() {
		
		/* Create Floor */
		floor = this.physics.add.image(game.config.width/2, 830,'tile-d');
		floor.setImmovable();
		floor.scale = 6;

		/* Create Tiles/Platforms */
		this.createTiles();
		/* Create Breaking Tiles/Platforms Group */
		this.createBreakTiles();
		/* Create Disappearing Tiles/Platforms Group */
		this.createDisTiles();
		/* Create Player Model */
		this.createPlayer();
		/* Create Springs */
		this.createSpring();
		/* Create Stars */
		this.createStars();
		/* Score Text */
		scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#a0f' }).setScrollFactor(0);
		/* Touch Zones */
		zoneL = this.add.zone(0, 0, game.config.width/2, game.config.height).setInteractive().setScrollFactor(0);
		zoneR = this.add.zone(game.config.width/2, 0, game.config.width/2, game.config.height).setInteractive().setScrollFactor(0);

		/* Collision checks and events */
		this.physics.add.collider(player, floor);
		this.physics.add.collider(player, tilesGroup, this.bounceBack, null, this);
		this.physics.add.collider(player, DisTilesGroup, this.TileDisappear, null, this);
		this.physics.add.overlap(player, breakTilesGroup, this.TileBreak, null, this);
		this.physics.add.collider(player, springGroup, this.BigBounce, null, this);
		this.physics.add.overlap(player, starGroup, this.pickStars, null, this);

		/* camera and tile tracking vars */
		this.cameraYMin = 99999;
		this.tileYMin = 99999;
		
		/* Control setup, Kbd  */
		this.key_left = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
		this.key_right = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
		this.key_Up = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
		/* Mouse Clicks */
		this.input.mouse.disableContextMenu();
	}
	
	update(delta) {
		
		/* Dynamically change world bounds based on player pos */
		// scene.physics.world.setBounds(x, y, width, height, checkLeft, checkRight, checkUp, checkDown);
        this.physics.world.setBounds(0, -player.yChange, this.physics.world.bounds.width, this.game.config.height + player.yChange);
		
        /* Camera tracking */
        // this.cameras.main.startFollow(player, true);
        this.cameras.main.setLerp(.5);
		this.cameras.main.centerOnY(player.y);
		
		/* Arrow buttons */
		if (this.key_right.isDown) player.body.velocity.x = 400;
		else if (this.key_left.isDown) player.body.velocity.x = -400;
		else player.body.velocity.x = 0;
		
		/* Touch events !? */
		var pointer = this.input.activePointer;
		
		if (pointer.isDown){
			if (pointer.x > 300) {
				player.body.velocity.x = 400;
			} else  if (pointer.x < 301){
				player.body.velocity.x = -400;
			}
			else player.body.velocity.x = 0;
		};
		
		/* Device Orientation */
		window.addEventListener("deviceorientation", this.handleOrientation, true);
		
		/* Up arrow to give Y velocity for debug beyond camera screen */
		if (this.key_Up.isDown) player.body.velocity.y = -400;

		/* Wrap the player from left <==> right of the screen. */
		this.physics.world.wrap(player, player.width / 6, false);

        /* track the maximum amount that the hero has travelled */
		player.yChange = Math.max( player.yChange, Math.abs( player.y - player.yOrig ) );
		
		/* For each tilesGroup child, find out which is the highest
		if one goes below the camera view, then create a new one at a distance from the highest one
		these are pooled so they are very performant */
		tilesGroup.children.iterate(function( item ) {
			var chance = Phaser.Math.Between(1, 100);
			var chance2 = Phaser.Math.Between(1, 100);
			var xAxis;
			var yAxis = this.tileYMin - 200;
			this.tileYMin = Math.min( this.tileYMin, item.y );
			this.cameraYMin = Math.min( this.cameraYMin, player.y - this.game.config.height + 430 );
			
			if( item.y > this.cameraYMin + this.game.config.height ){
				item.destroy();
				/* 15% chance for Disappearing Tile */
				if (chance > 70 && chance < 86)
				{
					xAxis = Phaser.Math.Between( 100, this.physics.world.bounds.width - 100 );
					tn = this.spawnTile( xAxis, yAxis, 'tile-n');
					td = this.spawnTileDis( Phaser.Math.Between( 100, xAxis - 100 ) || Phaser.Math.Between( xAxis+100, this.physics.world.bounds.width - 100 ), Phaser.Math.Between(yAxis + 100 , yAxis - 100), 'tile-d');
				}
				/* 15% chance for Breaking Tile */
				else if ( chance > 85)
				{
					xAxis = Phaser.Math.Between( 100, this.physics.world.bounds.width - 100 );
					tn = this.spawnTile( xAxis, yAxis, 'tile-n');
					tb = this.spawnTileBreak( Phaser.Math.Between( xAxis + 100, this.physics.world.bounds.width - 100 ) || Phaser.Math.Between( 100, xAxis - 100 ), Phaser.Math.Between(yAxis + 100 , yAxis - 100), 'tile-b');
				}
				/* Else Regular Tiles */
				else if (chance < 71)
					xAxis = Phaser.Math.Between( 100, this.physics.world.bounds.width - 100 );
					tn = this.spawnTile( xAxis, yAxis, 'tile-n');
					
				/* 20% chance2 of spawning spring */
				if (chance2 > 60 && chance2 < 81) {
					this.spawnSpring(xAxis, yAxis - 5, 'spring')
				}
				/* 20% chance2 of spawning stars */
				else if (chance2 > 80) {
					this.spawnStar(Phaser.Math.Between( 100, this.physics.world.bounds.width - 100 ), Phaser.Math.Between(yAxis, yAxis - 100), 'star')
					
				} 
				else if (chance2 < 61){
					
				}
			}
		}, this );
		
	}

	/* Create Player Model */
	createPlayer() {
        player = this.physics.add.image(game.config.width/2, 3*game.config.height/4, "player");
		// player.body.setCollideWorldBounds();
		player.setVelocity(0, -400);
		player.setGravityY(360);
		player.setBounce(0.4);
		player.body.checkCollision.up = false;
		player.body.checkCollision.down = true;
		player.body.checkCollision.left = false;
		player.body.checkCollision.right = false;
		player.depth = 1;

		player.yOrig = player.y;
        player.yChange = 0;
    }
	
	/* Create Regular Tiles/Platform */
    createTiles(){
        tilesGroup = this.physics.add.staticGroup({runChildUpdate: false});
		tilesGroup.enableBody = true;
		tileChild = tilesGroup.getChildren();
		
		// spawnTile();
		for( var i = 0; i<5; i++){
			tn = this.spawnTile( Phaser.Math.Between( 25, this.physics.world.bounds.width - 25 ), this.physics.world.bounds.height - 200 - 200 * i, 'tile-n');
		}
	} 
	
	/* Create Breaking Tiles */
	createBreakTiles(){
		breakTilesGroup = this.physics.add.staticGroup({runChildUpdate: false});
		breakTilesGroup.enableBody = true;
		breakTileChild = breakTilesGroup.getChildren();
	}
	
	/* Create Disappearing Tiles */
	createDisTiles(){
		DisTilesGroup = this.physics.add.staticGroup({runChildUpdate: false});
		DisTilesGroup.enableBody = true;
		DisTileChild = DisTilesGroup.getChildren();
	}

	/* Create Springs */
	createSpring(){
		springGroup = this.physics.add.staticGroup({runChildUpdate: false});
		springGroup.enableBody = true;
		springChild = springGroup.getChildren();
	}

	/* Create Stars */
	createStars(){
		starGroup = this.physics.add.staticGroup({runChildUpdate: false});
		starGroup.enableBody = true;
		starChild = starGroup.getChildren();
	}
	
	/* Sub function for Regular tiles.*/  
    spawnTile(x, y, type){
		tile = tilesGroup.create(x, y, type);
		tile.setImmovable();
		return tile;
	}

	/* Sub function for Breaking tiles.*/  
    spawnTileBreak(x, y, type){
		tile = breakTilesGroup.create(x, y, type);
		tile.setImmovable();
		return tile;
	}
	
	/* Sub function for Disappearing tiles.*/  
    spawnTileDis(x, y, type){
		tile = DisTilesGroup.create(x, y, type);
		tile.setImmovable();
		return tile;
	}

	/* Sub function for Springs.*/  
    spawnSpring(x, y, type){
		spring = springGroup.create(x, y, type);
		spring.setImmovable();
		return spring;
	}

	/* Sub function for Stars.*/  
    spawnStar(x, y, type){
		star = starGroup.create(x, y, type);
		star.setImmovable();
		return star;
	}

	/* Bounce off Regular Tiles / Regular Tile interaction */
	bounceBack(_player, _tilesGroup){
		if (_player.body.touching.down && _tilesGroup.body.touching.up)
            {
				score += 10;
				scoreText.setText('Score: ' + score);              
				player.body.velocity.y = -400;
            }
	}
		
	/* Disappearing Tiles func / Dis Tile Interaction*/
	TileDisappear(_player, _DisTilesGroup){
		DisTilesGroup.children.each(function (e) {			
			if (_player.body.touching.down && e.body.touching.up)
			{
				e.setAlpha(0);              
				score = score + 10;
				player.body.velocity.y = -400;
				scoreText.setText('Score: ' + score);
				
			}            		
		},this);
	}

	/* Breaking Tiles func / Breaking Tile Interaction */
	TileBreak(_player, _breakTilesGroup){
		breakTilesGroup.children.each(function(e){
			if (_player.body.touching.down && e.body.touching.up)
				{
					e.destroy();
				}            
				
			},this);
	}

	/* Spring Interaction func */
	BigBounce(_player, _springGroup){
			if (_player.body.touching.down && _springGroup.body.touching.up)
				{
					score += 100;
					scoreText.setText('Score: ' + score);              
					player.body.velocity.y = -1100;
				}     
	}
	/* Stars Interaction func */
	pickStars(_player, _starGroup){
		starGroup.children.each(function(e){
					score += 20;
					scoreText.setText('Score:' + score);
					e.destroy();
				
			},this);
	}
	handleOrientation (e) {
		var dx = e.gamma;
		if (dx > 0) {
			player.body.velocity.x = 400/45*dx;
		} else if (dx < 0 ){
			player.body.velocity.x = -400/45*dx;
		}
		else player.body.velocity.x = 0;
	}
}
