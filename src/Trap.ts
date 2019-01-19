import {Level} from "./Level";
import {Player} from "./Player";
import {Sfx} from "./Sfx";
import {Sound} from "./Sfx";
import {SVGSupport} from "./SVGSupport";
import {Direction} from "./Tile";
import {Tile} from "./Tile";
import {Wall} from "./Wall";

/**
 * Representation of a trap. A trap can be vertical or horizontal
 * and has a middle (which can be passed, activating the trap) and
 * two sides (which contract to the middle once passed).
 */
export class Trap extends Tile {

  private readonly direction: Direction; // LEFT or UP
  private readonly side: Direction; // RIGHT or LEFT
  private timer: number;
  private readonly offset: number;
  private frequency: number;
  private sides: Trap[];

  /**
   * Creates the trap (or side of a trap).
   * @param level the level the trap is for
   * @param direction the direction (left/up)
   * @param side flag to indicate whether this tile is a side or not
   */
  constructor(level: Level, direction: Direction, side?: Direction) {
    super(level);
    this.direction = direction;
    this.side = side;
    this.timer = 0;
    this.offset = Math.round(Math.random() * 100);
    this.frequency = this.newFrequency();
  }

  /**
   * Indicates that post-processing is require.
   * @returns true always
   */
  public wantsPostProcess(): boolean {
    return true;
  }

  /**
   * Prepares the level for the trap; this means that the
   * sides are added to the level. The level will manage
   * overlapping sides.
   * @param x the x coordinate of the trap
   * @param y the y coordinate of the trap
   */
  public postProcess(x: number, y: number): void {
    const left = new Trap(this.level, this.direction, Direction.LEFT).init();
    const right = new Trap(this.level, this.direction, Direction.RIGHT).init();
    this.sides = [ left, right ] as Trap[];
    if (this.direction === Direction.LEFT) {
      this.level.setTile(x, y - 1, left);
      this.level.setTile(x, y + 1, right);
    } else {
      this.level.setTile(x - 1, y, left);
      this.level.setTile(x + 1, y, right);
    }
  }

  /**
   * Indicates whether this tile is a trap side or not.
   */
  public isSide(): boolean {
    return this.side !== undefined;
  }

  /**
   * @inheritdoc
   */
  public createElement(): SVGElement {
    return this.isSide() ? this.createSide() : this.createMain();
  }

  /**
   * Animates the trap for one frame.
   * Once activated and the player traversing the trap,
   * the sides are contracted. Once done, the trap is
   * internally replaced with a wall, and the sides removed.
   */
  public step(): boolean {
    super.step();
    if (this.timer === 0) {
      if (this.side === undefined) {
        this.level.getSVGSupport().setAttributes(this.getElement(), {
          opacity: 0.5 + Math.sin((this.frame + this.offset) * Math.PI / this.frequency) / 3,
        });
        if (this.frame % 360 === 0) {
          this.frequency = this.newFrequency();
        }
      }
      return true;
    }
    this.timer--;
    if (this.side === undefined) {
      if (this.timer === 0) {
        return false;
      }
      // fade the energy bar
      const elem = this.getElement();
      this.level.getSVGSupport().setAttributes(elem, {
        "stroke-opacity": (Math.round(this.timer * 100 / Player.SPEED) / 100).toString() },
      );
      // move the sides
      const x = parseInt(elem.getAttribute(Tile.X), 10);
      const y = parseInt(elem.getAttribute(Tile.Y), 10);
      const offset = 1.5 + Math.round( (Player.SPEED - this.timer) * 16 / Player.SPEED );
      if (this.direction === Direction.LEFT) {
        this.sides[0].placeSVG(32 * x, 32 * y - offset);
        this.sides[1].placeSVG(32 * x, 32 * y + offset);
      } else {
        this.sides[0].placeSVG(32 * x - offset, 32 * y);
        this.sides[1].placeSVG(32 * x + offset, 32 * y);
      }
      if (this.timer === 1) {
        const wall = new Wall(this.level).init();
        // this does not render, but blocks
        this.level.setTile(x, y, wall);
        // remove the sides
        for (const side of this.sides) {
          const element = side.getElement();
          this.level.removeTile(
            parseInt(element.getAttribute(Tile.X), 10),
            parseInt(element.getAttribute(Tile.Y), 10),
            side);
        }
      }
    }
    return true;
  }

  /**
   * Indicates that the center of the trap is traversable.
   */
  public occupiable(): boolean {
    return this.side === undefined;
  }

  /**
   * On contact of the center, activates the trap.
   * Contact with the sides stops the player.
   */
  public contact(): void {
    if (this.side !== undefined) {
      const e = this.getElement();
      this.level.getPlayer().stop(parseInt(e.getAttribute(Tile.X), 10), parseInt(e.getAttribute(Tile.Y), 10));
      return;
    }
    if (this.sides && this.timer === 0) {
      for (const trap of this.sides) {
        trap.timer = Player.SPEED;
      }
      this.timer = Player.SPEED;
      Sfx.play(Sound.TRAP);
    }
  }

  private newFrequency(): number {
    return (5 + Math.round(Math.random() * 10)) * 5;
  }

  private createMain(): SVGElement {
    const svgSupport = this.level.getSVGSupport();
    const result = svgSupport.createElement("g");
    const line = "stroke-width:5;stroke:rgb(0,128,192)";
    const lineHi = "stroke-width:1;stroke:rgb(255,255,255)";
    if (this.direction === Direction.UP) {
      result.appendChild(
        svgSupport.createElement("line", {
          style: line,
          x1: "0", x2: "31", y1: "15",  y2: "15",
        }));
      result.appendChild(
        svgSupport.createElement("line", {
          style: lineHi,
          x1: "0", x2: "31", y1: "15", y2: "15",
        }));
    } else {
      result.appendChild(
        svgSupport.createElement("line", {
          style: line,
          x1: "15", x2: "15", y1: "0", y2: "31",
        }));
      result.appendChild(
        svgSupport.createElement("line", {
          style: lineHi,
          x1: "15", x2: "15", y1: "0", y2: "31",
        }));
    }
    return result;
  }

  private createSide(): SVGElement {
    const svgSupport = this.level.getSVGSupport();
    const result = svgSupport.createElement("g");
    const line = "stroke:rgb(204,48,16);stroke-width:3;fill:rgb(96,32,16)";
    const lineHi = "stroke:rgb(255,255,255);stroke-width:1;fill:transparent";
    if (this.direction === Direction.LEFT) {
      const shape = {
        height: "15",
        style: line,
        width: "32",
        y: this.side === Direction.LEFT ? "16" : "0",
      };
      result.appendChild(svgSupport.createElement("rect", shape));
      shape.style = lineHi;
      result.appendChild(svgSupport.createElement("rect", shape));
    } else {
      const shape = {
        height: "32",
        style: line,
        width: "15",
        x: this.side === Direction.LEFT ? "16" : "0",
      };
      result.appendChild(svgSupport.createElement("rect", shape));
      shape.style = lineHi;
      result.appendChild(svgSupport.createElement("rect", shape));
    }
    return result;
  }

}
