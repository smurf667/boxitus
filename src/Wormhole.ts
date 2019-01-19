import {Level} from "./Level";
import {Player} from "./Player";
import {Sfx} from "./Sfx";
import {Sound} from "./Sfx";
import {SVGSupport} from "./SVGSupport";
import {Tile} from "./Tile";

/**
 * Representation of a wormhole tile.
 * There can be at most one wormhole in a level.
 * Entering it in one direction makes the player
 * exit on the other side in the same direction.
 */
export class Wormhole extends Tile {

  private exit: Wormhole;

  /**
   * Creates the wormhole for the level.
   * @param level the level the wormhole tile is for.
   */
  constructor(level: Level) {
    super(level);
  }

  /**
   * Sets the opposing exit of the wormhole.
   * @param other the other exit
   */
  public setExit(other: Wormhole): void {
    this.exit = other;
  }

  /**
   * @inheritdoc
   */
  public createElement(): SVGElement {
    const svgSupport = this.level.getSVGSupport();
    const result = svgSupport.createElement("g");
    const group = svgSupport.createElement("g");
    group.appendChild(
      svgSupport.createElement("path", {
        d: "M 0,16 a 1,1 0 0,0 32,0",
        fill: "#333",
      }));
    group.appendChild(
      svgSupport.createElement("path", {
        d: "M 0,16 a 1,1 0 1,1 32,0",
        fill: "#999",
      }));
    group.appendChild(
      svgSupport.createElement("circle", {
        cx: "8",
        cy: "16",
        fill: "#333",
        r: "8",
      }));
    group.appendChild(
      svgSupport.createElement("circle", {
        cx: "24",
        cy: "16",
        fill: "#999",
        r: "8",
      }));
    group.appendChild(
      svgSupport.createElement("animateTransform", {
        attributeName: "transform",
        attributeType: "XML",
        dur: "1s",
        from: "0 16 16",
        repeatCount: "indefinite",
        to: "360 16 16",
        type: "rotate",
      }));
    result.appendChild(group);
    return result;
  }

  /**
   * A wormhole can always be entered.
   * @returns true always
   */
  public occupiable(): boolean {
    return true;
  }

  /**
   * Teleports the player to the exit of the
   * opposing wormhole.
   */
  public contact(): void {
    const player = this.level.getPlayer();
    if (player.distance(this) <= Player.SPEED) {
      Sfx.play(Sound.MOVE);
      const e = this.exit.getElement();
      player.place(parseInt(e.getAttribute(Tile.X), 10), parseInt(e.getAttribute(Tile.Y), 10));
    }
  }

}
