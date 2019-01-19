import {Level} from "./Level";
import {Player} from "./Player";
import {SVGSupport} from "./SVGSupport";
import {Tile} from "./Tile";

/**
 * Representation of a wall tile.
 */
export class Wall extends Tile {

  /**
   * Creates the wall tile for the given level.
   * @param level the level the wall is for.
   */
  constructor(level: Level) {
    super(level);
  }

  /**
   * @inheritdoc
   */
  public createElement(): SVGElement {
    const svgSupport = this.level.getSVGSupport();
    const result = svgSupport.createElement("g");
    result.appendChild(
      svgSupport.createElement("rect", {
        height: "32",
        style: "stroke:rgb(204,48,16);stroke-width:3;fill:rgb(96,32,16)",
        width: "32",
      }));
    result.appendChild(
      svgSupport.createElement("rect", {
        height: "32",
        style: "stroke:rgb(255,255,255);stroke-width:1;fill:transparent",
        width: "32",
      }));
    return result;
  }

  /**
   * Stops the player on contact.
   */
  public contact(): void {
    const e = this.getElement();
    this.level.getPlayer().stop(parseInt(e.getAttribute(Tile.X), 10), parseInt(e.getAttribute(Tile.Y), 10));
  }

}
