import {Level} from "./Level";
import {Sfx} from "./Sfx";
import {Sound} from "./Sfx";
import {SVGSupport} from "./SVGSupport";
import {Direction} from "./Tile";
import {Tile} from "./Tile";

export interface Vector {
  x: number;
  y: number;
}

/**
 * The player of the game.
 * For representation purposes this is considered a "tile".
 */
export class Player extends Tile {

  public static readonly SPEED: number = 8;
  public static readonly SPACE = " ";
  public static readonly DOWN = "ArrowDown";
  public static readonly LEFT = "ArrowLeft";
  public static readonly RIGHT = "ArrowRight";
  public static readonly UP = "ArrowUp";

  private static readonly FLASH: number = 40;

  private readonly position: Vector;
  private readonly delta: Vector;
  private direction: Direction;
  private body: SVGElement;
  private target: number;

  /**
   * Creates the player for the level.
   * @param level the level the player belongs to
   */
  constructor(level: Level) {
    super(level);
    this.delta = { x: 0, y: 0 };
    this.position = { x: 0, y: 0 };
  }

  /**
   * Looks at the game's key map and handles any pressed keys.
   */
  public handleKeys(): void {
    const keys = this.level.getKeys();
    if (keys.get(Player.SPACE) === true) {
      this.level.abort();
    }
    if (this.isMoving()) {
      return;
    }
    let pressed = false;
    if (keys.get(Player.LEFT) === true) {
      this.setDirection(Direction.LEFT);
      keys.set(Player.LEFT, false);
      pressed = true;
    } else if (keys.get(Player.RIGHT) === true) {
      this.setDirection(Direction.RIGHT);
      keys.set(Player.RIGHT, false);
      pressed = true;
    } else if (keys.get(Player.DOWN) === true) {
      this.setDirection(Direction.DOWN);
      keys.set(Player.DOWN, false);
      pressed = true;
    } else if (keys.get(Player.UP) === true) {
      this.setDirection(Direction.UP);
      keys.set(Player.UP, false);
      pressed = true;
    }
    if (pressed) {
      const next = this.getTileLocation();
      const neighbour = this.level.tileAt(next.x + this.delta.x, next.y + this.delta.y);
      if (neighbour && !neighbour.occupiable()) {
        // resting, and there's something in the way
        this.delta.x = 0;
        this.delta.y = 0;
        neighbour.contact();
      } else {
        Sfx.play(Sound.MOVE);
      }
    }
  }

  /**
   * @inheritdoc
   */
  public place(x: number, y: number): void {
    super.place(x, y);
    this.position.x = 32 * x;
    this.position.y = 32 * y;
  }

  /**
   * Returns the coordinates of the tile the player is
   * on, or where she will be next.
   * @param next true to project which tile is being occupied in the next frame
   */
  public getTileLocation(next?: boolean): Vector {
    const result = {
      x: Math.floor(this.position.x / 32),
      y: Math.floor(this.position.y / 32),
    };
    if (next) {
      result.x += this.delta.x > 0 ? this.delta.x : 0;
      result.y += this.delta.y > 0 ? this.delta.y : 0;
    }
    return result;
  }

  /**
   * @inheritdoc
   */
  public createElement(): SVGElement {
    const svgSupport = this.level.getSVGSupport();
    const result = svgSupport.createElement("g");
    result.appendChild(
      svgSupport.createElement("circle", {
        "cx": "16",
        "cy": "16",
        "fill": "transparent",
        "r": "13",
        "stroke": "#8de",
        "stroke-width": "3",
      }));
    this.body = svgSupport.createElement("circle", {
      "cx": "16",
      "cy": "16",
      "fill": "#4c4ccf",
      "r": "10",
      "stroke": "#8de",
      "stroke-dasharray": "10",
      "stroke-width": "8",
    });
    this.body.appendChild(
      svgSupport.createElement("animateTransform", {
        attributeName: "transform",
        attributeType: "XML",
        dur: "5s",
        from: "0 16 16",
        repeatCount: "indefinite",
        to: "360 16 16",
        type: "rotate",
      }));
    result.appendChild(this.body);
    result.appendChild(
      svgSupport.createElement("circle", {
        cx: "16",
        cy: "16",
        fill: "#8de",
        r: "3",
        stroke: "transparent",
      }));
    return result;
  }

  /**
   * Moves the player for one animation frame.
   */
  public step(): boolean {
    super.step();
    if (this.isMoving()) {
      this.position.x += Player.SPEED * this.delta.x;
      this.position.y += Player.SPEED * this.delta.y;
      super.placeSVG(this.position.x, this.position.y);
    }
    const activity = this.target - this.frame;
    if (activity >= 0)  {
      const svgSupport = this.level.getSVGSupport();
      svgSupport.setAttributes(this.body, { opacity: (1 - activity / Player.FLASH).toString() });
    }
    return true;
  }

  /**
   * Stops the player at the given coordinates.
   * @param tx the x coordinate of the tile position to stop the player at
   * @param ty the y coordinate of the tile position to stop the player at
   * @param onTile flag to indicate whether to directly place or also use the
   * player's delta
   */
  public stop(tx: number, ty: number, onTile?: boolean): void {
    if (this.delta.x === 0 && this.delta.y === 0) {
      return;
    }
    this.target = Player.FLASH + this.frame;
    if (onTile === true) {
      this.place(tx, ty);
    } else {
      this.place(tx - this.delta.x, ty - this.delta.y);
    }
    this.delta.x = 0;
    this.delta.y = 0;
    Sfx.play(Sound.STOP);
  }

  /**
   * @inheritdoc
   */
  public contact(): void {
    // TODO i guess this will not be called?
  }

  /**
   * Indicates whether the player is moving or not.
   */
  public isMoving(): boolean {
    return this.delta.x !== 0 || this.delta.y !== 0;
  }

  /**
   * Returns the direction the player is traveling int.
   */
  public getDirection(): Direction {
    return this.direction;
  }

  /**
   * Sets the direction the player is to travel in.
   * @param direction the direction to travel in
   */
  public setDirection(direction: Direction): void {
    switch (direction) {
    case Direction.LEFT:
      this.delta.x = -1;
      this.delta.y = 0;
      break;
    case Direction.RIGHT:
      this.delta.x = 1;
      this.delta.y = 0;
      break;
    case Direction.DOWN:
      this.delta.x = 0;
      this.delta.y = 1;
      break;
    case Direction.UP:
      this.delta.x = 0;
      this.delta.y = -1;
      break;
    default:
      break;
    }
    this.direction = direction;
  }

  /**
   * Returns the distance of the place to the given tile
   * @param tile the tile to compute the distance to.
   */
  public distance(tile: Tile): number {
    const loc = tile.getTileLocation();
    loc.x *= 32;
    loc.y *= 32;
    return Math.sqrt(
      (loc.x - this.position.x) * (loc.x - this.position.x) +
      (loc.y - this.position.y) * (loc.y - this.position.y));
  }

}
