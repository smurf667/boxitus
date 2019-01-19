import {Level} from "./Level";
import {SVGSupport} from "./SVGSupport";

interface Location {
  x: number;
  y: number;
}

export enum Direction {
  RIGHT,
  DOWN,
  LEFT,
  UP,
}

/**
 * Base class for the level elements.
 */
export abstract class Tile {

  public static readonly X: string = "data-x";
  public static readonly Y: string = "data-y";

  protected readonly level: Level;
  protected frame: number;

  private element: SVGElement;

  /**
   * Creates the tile for the given level.
   * @param level the level this tile belongs to.
   */
  constructor(level: Level) {
    this.level = level;
    this.frame = -1;
  }

  /**
   * Initializes the tile, creates the SVG element.
   */
  public init(): Tile {
    this.element = this.createElement();
    return this;
  }

  /**
   * Indicates if the tile wants to post-process after
   * the level has been initially built.
   */
  public wantsPostProcess(): boolean {
    return false;
  }

  /**
   * Indicates if the play can be on the tile.
   */
  public occupiable(): boolean {
    return false;
  }

  /**
   * Post-processing method. Does nothing on this level, but
   * sub-classes might want to implement.
   * @param x the x coordinate of the tile to post-process
   * @param y the y coordinate of the tile to post-process
   */
  public postProcess(x: number, y: number): void { /* do nothing */ }

  /**
   * Processes one animation frame.
   * @returns false if the element should not be considered for future frames
   */
  public step(): boolean {
    this.frame++;
    return true;
  }

  /**
   * Stores the location of the tile and positions it on the SVG root element.
   * @param x the x offset of the tile (in relation to the raw string array)
   * @param y the y offset of the tile (in relation to the raw string array)
   */
  public place(x: number, y: number): void {
    this.element.setAttribute(Tile.X, x.toString());
    this.element.setAttribute(Tile.Y, y.toString());
    this.placeSVG(32 * x, 32 * y);
  }

  /**
   * Returns the tile location in terms of the raw string array.
   * This are values x=0..19 and y=0..15.
   */
  public getTileLocation(): Location {
    return {
      x: parseInt(this.element.getAttribute(Tile.X), 10),
      y: parseInt(this.element.getAttribute(Tile.Y), 10),
    };
  }

  /**
   * Returns the SVG element for the tile.
   */
  public getElement(): SVGElement {
    return this.element;
  }

  /**
   * Handles the contact of the player with the tile.
   */
  public abstract contact(): void;

  protected placeSVG(x: number, y: number): void {
    this.level.getSVGSupport().setAttributes(this.element, { transform: "translate(" + x + "," + y + ")" });
  }

  protected abstract createElement(): SVGElement;

}
