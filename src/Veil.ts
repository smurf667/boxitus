import {SVGSupport} from "./SVGSupport";

export enum VeilMode {
  UP,
  DOWN,
  MIDDLE,
}

/**
 * Fade in and fade out effects for the complete game view.
 */
export class Veil {

  private static readonly START: number = 50;
  private readonly svgSupport: SVGSupport;
  private readonly elements: SVGElement[];
  private readonly opacities: number[];
  private readonly mode: VeilMode;
  private delta: number;
  private remain: number;

  /**
   * Creates the veil.
   *
   * @param elements the bars of the veil
   * @param svgSupport the SVG support utility
   * @param reveal a flag to indicate whether to reveal or hide using the veil
   * @param mode the veil effect mode, optional (random if not specified)
   */
  constructor(elements: SVGElement[], svgSupport: SVGSupport, reveal: boolean, mode?: VeilMode) {
    this.elements = elements;
    this.svgSupport = svgSupport;
    this.opacities = [];
    if (mode === undefined) {
      const modes = Object.keys(VeilMode).map((k) => VeilMode[k]).filter((k) => typeof k === "number");
      this.mode = modes[Math.round(modes.length * Math.random())];
    } else {
      this.mode = mode;
    }
    this.delta = reveal ? -1 : 1;
    this.remain = Veil.START;
    this.fill();
    this.step();
  }

  /**
   * Animates on frame of the veil effect.
   */
  public step(): boolean {
    for (let i = 0; i < this.opacities.length; i++) {
      const opacity = Math.max(0, Math.max(0, Math.min(1, this.opacities[i] / Veil.START)));
      this.svgSupport.setAttributes(this.elements[i], { opacity: opacity.toString() });
      this.opacities[i] += this.delta;
    }
    return --this.remain > 0;
  }

  private fill() {
    for (let i = 0; i < this.elements.length; i++) {
      this.opacities.push(this.delta > 0 ? 1 + 2 * i : Veil.START + 2 * i);
    }
    const next: SVGElement[] = [];
    switch (this.mode) {
    case VeilMode.UP:
      break;
    case VeilMode.DOWN:
      this.elements.reverse();
      break;
    case VeilMode.MIDDLE:
      while (this.elements.length > 0) {
        next.push(this.elements.shift());
        next.push(this.elements.pop());
      }
      while (next.length > 0) {
        this.elements.push(next.pop());
      }
      break;
    default:
      break;
    }
  }

}
