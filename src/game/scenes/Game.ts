import { EventBus } from "../EventBus";
import { Scene } from "phaser";
import { Confederate } from "../objects/Confederate";
import { Union } from "../objects/Union";
import { Geom } from "phaser";

export class Game extends Scene {
    background: Phaser.GameObjects.Image;

    graphics: Phaser.GameObjects.Graphics;
    path: Phaser.Curves.Path;

    washingtonCircle: Phaser.GameObjects.Shape;
    washingtonText: Phaser.GameObjects.Text;

    // Wave
    wave: number = 1;

    // Speed of enemies (1 + (wave - 1) * 0.1)
    speed: number = 1;

    // Array of all enemies
    enemies: Phaser.GameObjects.Group;

    // Array of all defenders
    defenders: Phaser.GameObjects.Group;

    // path that defenders follow (not displayed)
    defenderPath: Phaser.Curves.Path;

    health: number = 100;

    healthBar: Phaser.GameObjects.Rectangle;

    constructor() {
        super("Game");
    }

    createBackground() {
        this.background = this.add.sprite(
            this.sys.canvas.width / 2,
            this.sys.canvas.height / 2,
            "map"
        );
        this.background.setDisplaySize(
            this.sys.canvas.width,
            this.sys.canvas.height
        );
    }

    createPath() {
        this.graphics = this.add.graphics();
        this.path = this.add.path(96, -32);
        this.path.lineTo(96, 100);
        this.path.lineTo(900, 100);
        this.path.lineTo(900, 668);
        this.path.lineTo(96, 668);
        this.path.lineTo(96, 450);
        this.path.lineTo(450, 450);

        this.graphics.lineStyle(5, 0xffffff, 1);
        this.path.draw(this.graphics);
    }

    createDefenderPath() {
        this.defenderPath = this.add.path(450, 450);
        this.defenderPath.lineTo(96, 450);
        this.defenderPath.lineTo(96, 668);
        this.defenderPath.lineTo(900, 668);
        this.defenderPath.lineTo(900, 100);
        this.defenderPath.lineTo(96, 100);
        this.defenderPath.lineTo(96, -32);
    }

    createWashington() {
        this.washingtonCircle = this.add.circle(450, 450, 10, 0x00ff00);
        this.washingtonText = this.add.text(460, 450, "Washington", {
            font: "1000 18px Inter",
            color: "#000000",
            fontStyle: "strong",
        });
    }

    onEnemyReachWashington(i: Confederate) {
        return () => {
            console.log("Enemy reached Washington");
            this.enemies.remove(i, true, true);
            this.cameras.main.shake(100, 0.005);
            this.health -= 2 * this.wave;
            EventBus.emit("health-change", this.health);
            if (this.enemies.getLength() == 0) {
                console.log('onEnemyReachWashington wc')
                EventBus.emit("wave-complete");
            }
        };
    }

    createHealthBar(
        x: number,
        y: number,
        width: number,
        height: number,
        health: number,
        maxHealth: number
    ) {
        this.add.rectangle(
            x,
            y,
            width,
            height,
            0x000000
        ).strokeColor = 0xffffff;
        this.healthBar = this.add.rectangle(
            x,
            y,
            width * (health / maxHealth) - 2,
            height - 2,
            0xff0000
        );

        EventBus.on("health-change", (health: number) => {
            if (health <= 0) {
                this.scene.start("GameOver");
            }
            this.health = health;
            this.healthBar.width = width * (health / maxHealth);
        });
    }

    makeWave(defenders: number) {
        const rectangle = this.add
            .rectangle(0, 0, 1024, 768, 0x999999, 0.8)
            .setOrigin(0, 0);
        const text = this.add.text(20, 300, "Confederates are attacking!", {
            font: "800 70px Inter",
            color: "#000000",
        });
        setTimeout(() => {
            rectangle.destroy();
            text.destroy();

            this.createWave(defenders);
        }, 3000);
    }

    createWave(defenders: number) {
        this.speed = 1.1 + (this.wave - 1) * 0.1;

        let remainingEnemies = 5 * Math.floor(Math.pow(this.wave, 1.1));
        let remainingDefenders = defenders;

        const int = setInterval(() => {
            if (remainingEnemies == 0 && remainingDefenders == 0) {
                clearInterval(int);
            }

            if (remainingEnemies > 0) {
                const co = new Confederate(
                    this,
                    this.path,
                    96,
                    -32,
                    this.speed,
                    () => {}
                );
                co.onComplete = this.onEnemyReachWashington(co);
                this.enemies.add(co);
                remainingEnemies--;
            }

            if (remainingDefenders > 0) {
                this.defenders.add(
                    new Union(
                        this,
                        this.defenderPath,
                        450,
                        450,
                        this.speed,
                        () => {}
                    )
                );
                remainingDefenders--;
            }
        }, 250 / this.speed);

        this.wave++;
    }

    waveComplete() {
        this.enemies.destroy();
        this.defenders.destroy();

        this.enemies = this.add.group();
        this.defenders = this.add.group();

        setTimeout(() => {
            const rectangle = this.add
                .rectangle(0, 0, 1024, 768, 0x999999, 0.8)
                .setOrigin(0, 0);
            const text = this.add.text(20, 300, "Confederates defeated!", {
                font: "800 70px Inter",
                color: "#000000",
            });
            setTimeout(() => {
                rectangle.destroy();
                text.destroy();

                EventBus.emit("wave-complete", this.defenders.getLength());
            }, 3000);
        }, 1000);
    }

    create() {
        this.scale.setGameSize(1024, 768);
        this.createBackground();
        this.createPath();
        this.createDefenderPath();
        this.createWashington();
        this.createHealthBar(520, 10, 500, 10, this.health, 100);
        this.wave = 1;

        this.speed = 1 + (this.wave - 1) * 0.1;
        this.enemies = this.add.group();
        this.defenders = this.add.group();

        EventBus.emit("main-scene-ready", this);

        EventBus.on("next-wave", (questionsCorrect: number) => {
            this.makeWave(questionsCorrect + 5);
        });
    }

    update() {
        enemyLoop: for (const i of this.enemies.getChildren()) {
            for (const j of this.defenders.getChildren()) {
                if (
                    Geom.Intersects.RectangleToRectangle(
                        (i as Confederate).getBounds(),
                        (j as Union).getBounds()
                    )
                ) {
                    (i as Confederate).stopFollow();
                    (j as Union).stopFollow();
                    this.enemies.remove(i, true, true);
                    this.defenders.remove(j, true, true);

                    if (this.enemies.getLength() == 0) {
                        console.log('update wc')
                        this.waveComplete();
                    }
                    continue enemyLoop;
                }
            }
        }
    }
}
