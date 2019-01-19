import {Level} from "./Level";
import {Player} from "./Player";
import {SVGSupport} from "./SVGSupport";
import {Tile} from "./Tile";

/**
 * A special tile which can record "overlapping" tiles.
 * This case happens for traps, as the sides may occupy the
 * same tile location.
 */
export class Overlap extends Tile {

  private group: SVGElement;
  private tiles: Tile[];

  /**
   * Creates the overlap tile for the given level.
   * @param level the level the overlap tile belongs to
   */
  constructor(level: Level) {
    super(level);
    this.tiles = [];
  }

  /**
   * Creates the SVG element; this is a non-displaying group
   * element only - it can hold the overlapping SVG elements of
   * the tiles it stores.
   */
  public createElement(): SVGElement {
    this.group = this.level.getSVGSupport().createElement("g");
    return this.group;
  }

  /**
   * Adds the given tile as an overlapping child to this tile.
   * @param tile the overlapping tile
   */
  public addChild(tile: Tile): void {
    this.tiles.push(tile);
    this.group.appendChild(tile.getElement());
  }

  /**
   * Removes the given tile from the list of overlapping tiles
   * @param tile the tile to remove
   * @returns true if the overlap does not hold children any more
   */
  public removeChild(tile: Tile): boolean {
    const idx = this.tiles.indexOf(tile);
    if (idx >= 0) {
      this.tiles.splice(idx, 1);
      // technically, remove SVGElement of tile from group, but for traps I want to keep them around
      // traps are the only things that overlap, so...
    }
    // return true if childless
    return this.tiles.length === 0;
  }

  /**
   * Stops the player on contact.
   */
  public contact(): void {
    const e = this.getElement();
    this.level.getPlayer().stop(parseInt(e.getAttribute(Tile.X), 10), parseInt(e.getAttribute(Tile.Y), 10));
  }

  /**
   * Delegates the frame animation call to all overlapping children.
   * @returns true as long as the overlapping tile has children
   */
  public step(): boolean {
    for (const tile of this.tiles) {
      tile.step();
    }
    return this.tiles.length > 0;
  }

  /**
   * Places the tile and all its children at the given location.
   * @param x the x coordinate to place (in "tile space", not SVG coordinates)
   * @param y the y coordinate to place (in "tile space", not SVG coordinates)
   */
  public place(x: number, y: number): void {
    const element = this.getElement();
    element.setAttribute(Tile.X, x.toString());
    element.setAttribute(Tile.Y, y.toString());
    for (const tile of this.tiles) {
      tile.place(x, y);
    }
  }

}
