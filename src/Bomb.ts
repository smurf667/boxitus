import {Level} from "./Level";
import {Player} from "./Player";
import {Sfx} from "./Sfx";
import {Sound} from "./Sfx";
import {SVGSupport} from "./SVGSupport";
import {Tile} from "./Tile";

/**
 * Tile representing a bomb. Once activated, it counts
 * down and explodes, removing itself as an obstacle.
 */
export class Bomb extends Tile {

  private text: SVGElement;
  private circle: SVGElement;
  private active: boolean;
  private timer: number;
  private radius: number;

  /**
   * Creates the bomb.
   * @param level the level the bomb is part of
   */
  constructor(level: Level) {
    super(level);
    this.active = false;
    this.radius = 0;
  }

  /**
   * @inheritdoc
   */
  public createElement(): SVGElement {
    this.timer = 5;
    const svgSupport = this.level.getSVGSupport();
    const result = svgSupport.createElement("g");
    result.appendChild(
      svgSupport.createElement("rect", {
        height: "27",
        style: "stroke:rgb(204,192,16);stroke-width:3;fill:rgb(140,64,16)",
        width: "27",
        x: "2",
        y: "2",
      }));
    result.appendChild(
      svgSupport.createElement("rect", {
        height: "27",
        style: "stroke:white;stroke-width:1;fill:transparent",
        width: "27",
        x: "2",
        y: "2",
      }));
    this.text = svgSupport.createElement("text", {
      "dy": ".3em",
      "style": "fill:#fff; font: bold 20px sans-serif;",
      "text-anchor": "middle",
      "x": "15",
      "y": "16",
    });
    this.text.textContent = this.timer.toString();
    result.appendChild(this.text);
    this.circle = svgSupport.createElement("circle", {
      "cx": "16",
      "cy": "16",
      "fill": "yellow",
      "fill-opacity": "0",
      "r": this.radius,
      "stroke": "transparent",
    });
    result.appendChild(this.circle);
    return result;
  }

  /**
   * Animates for a frame.
   * @returns true as long as the bomb is active
   */
  public step(): boolean {
    super.step();
    if (this.active && this.frame % 40 === 0) {
      this.timer--;
      if (this.timer < 0) {
        const elem = this.getElement();
        elem.parentElement.removeChild(elem);
        return false;
      } else {
        this.text.textContent = this.timer.toString();
        Sfx.play(this.timer === 0 ? Sound.EXPLODE : Sound.STOP);
      }
    }
    if (this.timer === 0) {
      this.radius++;
      const opacity = ((40 - this.radius) / 40).toString(10);
      this.circle.setAttribute("r", this.radius.toString(10));
      this.circle.setAttribute("fill-opacity", opacity);
    }
    return true;
  }

  /**
   * On contact, activates the bomb and stops the player.
   */
  public contact(): void {
    const e = this.getElement();
    this.active = true;
    this.level.getPlayer().stop(parseInt(e.getAttribute(Tile.X), 10), parseInt(e.getAttribute(Tile.Y), 10));
  }

}
