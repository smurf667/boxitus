import {Level} from "./Level";
import {Player} from "./Player";
import {SVGSupport} from "./SVGSupport";
import {Direction} from "./Tile";
import {Tile} from "./Tile";

/**
 * A tile representing a 45 degree deflector.
 */
export class Deflector extends Tile {

  /**
   * Creates the direction mappings for the four directions
   * a deflector can work in.
   */
  public static init() {
    let mapping;
    // right
    mapping = new Map();
    mapping.set(Direction.LEFT, Direction.DOWN);
    mapping.set(Direction.UP, Direction.RIGHT);
    Deflector.reflections.set(Direction.RIGHT, mapping);
    // down
    mapping = new Map();
    mapping.set(Direction.RIGHT, Direction.DOWN);
    mapping.set(Direction.UP, Direction.LEFT);
    Deflector.reflections.set(Direction.DOWN, mapping);
    // left
    mapping = new Map();
    mapping.set(Direction.DOWN, Direction.LEFT);
    mapping.set(Direction.RIGHT, Direction.UP);
    Deflector.reflections.set(Direction.LEFT, mapping);
    // up
    mapping = new Map();
    mapping.set(Direction.LEFT, Direction.UP);
    mapping.set(Direction.DOWN, Direction.RIGHT);
    Deflector.reflections.set(Direction.UP, mapping);
  }

  private static readonly reflections: Map<Direction, Map<Direction, Direction>> = new Map();

  private readonly type: Direction;

  /**
   * Creates the deflector for the given level and direction.
   * @param level the level the deflector is for
   * @param type the direction the deflector works in
   */
  constructor(level: Level, type: Direction) {
    super(level);
    this.type = type;
  }

  /**
   * @inheritdoc
   */
  public createElement(): SVGElement {
    let triangle;
    switch (this.type) {
    case Direction.RIGHT:
      triangle = "0,0, 31,0, 0,31";
      break;
    case Direction.DOWN:
      triangle = "0,0, 31,0, 31,31";
      break;
    case Direction.LEFT:
      triangle = "31,0, 31,31, 0,31";
      break;
    case Direction.UP:
      triangle = "0,0, 0,31, 31,31";
      break;
    default:
      triangle = "";
      break;
    }
    const svgSupport = this.level.getSVGSupport();
    const result = svgSupport.createElement("g");
    result.appendChild(
      svgSupport.createElement("polygon", {
        points: triangle,
        style: "fill:rgb(16,128,32);stroke-width:3;stroke:rgb(16,192,32)",
      }));
    result.appendChild(
      svgSupport.createElement("polygon", {
        points: triangle,
        style: "stroke:rgb(255,255,255);stroke-width:1;fill:transparent",
      }));
    return result;
  }

  /**
   * Indicates that the player can be on top of this tile.
   * @returns true always
   */
  public occupiable(): boolean {
    return true;
  }

  /**
   * On contact, when the player is centrally on the tile, deflects
   * the player into the new direction.
   */
  public contact(): void {
    const e = this.getElement();
    const player = this.level.getPlayer();
    const dir = player.getDirection();
    const newDir = Deflector.reflections.get(this.type).get(dir);
    if (newDir === undefined) {
      player.stop(parseInt(e.getAttribute(Tile.X), 10), parseInt(e.getAttribute(Tile.Y), 10));
      return;
    }
    if (player.distance(this) <= Player.SPEED) {
      player.stop(parseInt(e.getAttribute(Tile.X), 10), parseInt(e.getAttribute(Tile.Y), 10), true);
      player.setDirection(newDir);
    }
  }

}

Deflector.init();
