import {Level} from "./Level";
import {Player} from "./Player";
import {Sfx} from "./Sfx";
import {Sound} from "./Sfx";
import {SVGSupport} from "./SVGSupport";
import {Direction} from "./Tile";
import {Tile} from "./Tile";

/**
 * Represents a sensor tile. A sensor has four sides which
 * must be activated before a portal will let a player pass.
 * If a side is blocked by a non-traversable tile, that side
 * will be auto-activated.
 */
export class Sensor extends Tile {

  private readonly sides: Map<Direction, SVGElement>;

  /**
   * Creates the sensor for the given level.
   * @param level the level the sensor is for.
   */
  constructor(level: Level) {
    super(level);
    this.sides = new Map();
  }

  /**
   * Indicates that post-processing is needed.
   * @returns true always
   */
  public wantsPostProcess(): boolean {
    return true;
  }

  /**
   * Post-processes the level. This activates the sides of the
   * sensor that are blocked by non-traversable tiles.
   * @param x the x coordinate of the tile location
   * @param y the y coordinate of the tile location
   */
  public postProcess(x: number, y: number): void {
    if (x === 0 || this.level.tileAt(x - 1, y) !== undefined) {
      this.activate(Direction.RIGHT);
    }
    if (x === 19 || this.level.tileAt(x + 1, y) !== undefined) {
      this.activate(Direction.LEFT);
    }
    if (y === 0 || this.level.tileAt(x, y - 1) !== undefined) {
      this.activate(Direction.DOWN);
    }
    if (y === 14 || this.level.tileAt(x, y + 1) !== undefined) {
      this.activate(Direction.UP);
    }
  }

  /**
   * @inheritdoc
   */
  public createElement(): SVGElement {
    const triangles = [
      "4,0, 27,0, 16,12",
      "31,4, 31,27, 20,16",
      "27,31, 4,31, 16,20",
      "0,27, 0,4, 12,16",
    ];
    const directions = [
      Direction.DOWN,
      Direction.LEFT,
      Direction.UP,
      Direction.RIGHT,
    ];
    const svgSupport = this.level.getSVGSupport();
    const result = svgSupport.createElement("g");
    while (triangles.length > 0) {
      const points = triangles.shift();
      const triangle = svgSupport.createElement("polygon", {
        points,
        style: "fill:rgb(16,128,32);stroke-width:3;stroke:rgb(16,192,32)",
      });
      this.sides.set(directions.shift(), triangle);
      result.appendChild(triangle);
      result.appendChild(svgSupport.createElement("polygon", {
        points,
        style: "fill:transparent;stroke-width:1;stroke:rgb(255,255,255)",
      }));
    }
    return result;
  }

  /**
   * Indicates whether the sensor is completely activated or not.
   */
  public activated(): boolean {
    return this.sides.size === 0;
  }

  /**
   * Activates a side of the sensor.
   * @param direction the direction (side) of the sensor to activate
   * @returns true if the side was activated, false otherwise
   */
  public activate(direction: Direction): boolean {
    const side = this.sides.get(direction);
    if (side) {
      this.sides.delete(direction);
      side.setAttribute("style", "fill:rgb(248,204,0);stroke-width:3;stroke:rgb(224,192,0)");
      return true;
    }
    return false;
  }

  /**
   * Stops the player and activates the side of the sensor
   * the player has touched.
   */
  public contact(): void {
    const player = this.level.getPlayer();
    const direction = player.getDirection();
    const e = this.getElement();
    this.level.getPlayer().stop(parseInt(e.getAttribute(Tile.X), 10), parseInt(e.getAttribute(Tile.Y), 10));
    if (this.activate(direction)) {
      Sfx.play(Sound.SENSOR);
    }
  }

}
