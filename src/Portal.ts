import {Level} from "./Level";
import {Player} from "./Player";
import {SVGSupport} from "./SVGSupport";
import {Tile} from "./Tile";

/**
 * A portal to exit a level.
 * If instructed, the portal will only let the player pass
 * once all bombs are cleared in the level.
 */
export class Portal extends Tile {

  private skull: SVGElement;
  private allBombs: boolean;

  /**
   * Creates the portal.
   * @param level the level the portal is for.
   * @param allBombs flag to indicate whether all bombs must be
   * cleared from the level
   */
  constructor(level: Level, allBombs: boolean) {
    super(level);
    this.allBombs = allBombs;
  }

  /**
   * @inheritdoc
   */
  public createElement(): SVGElement {
    const svgSupport = this.level.getSVGSupport();
    const result = svgSupport.createElement("g");
    const path = "M 0 8 L 0 0 L 31 0 L 31 31 L 0 31 L 0 23";
    result.appendChild(
      svgSupport.createElement("path", {
        d: path,
        style: "stroke:rgb(204,48,204);stroke-width:3;fill:transparent",
      }));
    result.appendChild(
      svgSupport.createElement("path", {
        d: path,
        style: "stroke:white;stroke-width:1;fill:transparent",
      }));
    result.appendChild(
      svgSupport.createElement("line", {
        style: "stroke-width:5;stroke:white;fill:none;marker-end:url(#triangle)",
        x1: "25",
        x2: "10",
        y1: "15",
        y2: "15",
      }));
    this.skull = svgSupport.createElement("g", { fill: "white", opacity: "0" });
    this.skull.appendChild(
      svgSupport.createElement("ellipse", { cx: "15", cy: "12", rx: "16", ry: "12" }));
    this.skull.appendChild(
      svgSupport.createElement("ellipse", { cx: "15", cy: "22", rx: "12", ry: "8" }));
    const mouth = svgSupport.createElement("g", { fill: "#225" });
    mouth.appendChild(
      svgSupport.createElement("circle", { cx: "9", cy: "12", r: "4" }));
    mouth.appendChild(
      svgSupport.createElement("circle", { cx: "21", cy: "12", r: "4" }));
    mouth.appendChild(
      svgSupport.createElement("polygon", { points: "15,17, 19,21, 11,21" }));
    mouth.appendChild(
      svgSupport.createElement("rect", { x: "6.5", y: "25", width: "2", height: "5" }));
    mouth.appendChild(
      svgSupport.createElement("rect", { x: "11.5", y: "25", width: "2", height: "5" }));
    mouth.appendChild(
      svgSupport.createElement("rect", { x: "16.5", y: "25", width: "2", height: "5" }));
    mouth.appendChild(
      svgSupport.createElement("rect", { x: "21.5", y: "25", width: "2", height: "5" }));
    this.skull.appendChild(mouth);
    result.appendChild(this.skull);
    return result;
  }

  /**
   * Indicates that the player can be in the portal.
   */
  public occupiable(): boolean {
    return true;
  }

  /**
   * Returns the skull image (which when shown is used to
   * indicate that the portal will not let the player passed).
   */
  public getSkull(): SVGElement {
    return this.skull;
  }

  /**
   * Indicates whether to complete the level all bombs must
   * be cleared or not.
   */
  public clearAllBombs(): boolean {
    return this.allBombs;
  }

  /**
   * Handles the player contact with the portal.
   * If all checks are good, the level is completed,
   * otherwise the player dies an unworthy death :-)
   */
  public contact(): void {
    if (this.level.getPlayer().distance(this) <= Player.SPEED) {
      const e = this.getElement();
      this.level.getPlayer().stop(parseInt(e.getAttribute(Tile.X), 10), parseInt(e.getAttribute(Tile.Y), 10), true);
      if (this.allBombs) {
        this.level.exit(this.level.bombCount() === 0);
      } else {
        this.level.exit(true);
      }
    }
  }

}
