import {Bomb} from "./Bomb";
import {Deflector} from "./Deflector";
import {Levels} from "./Levels";
import {Overlap} from "./Overlap";
import {Player} from "./Player";
import {Vector} from "./Player";
import {Portal} from "./Portal";
import {Sensor} from "./Sensor";
import {Sfx} from "./Sfx";
import {Sound} from "./Sfx";
import {SVGSupport} from "./SVGSupport";
import {Direction} from "./Tile";
import {Tile} from "./Tile";
import {Trap} from "./Trap";
import {Veil} from "./Veil";
import {Wall} from "./Wall";
import {Wormhole} from "./Wormhole";

type TileFactory = (level: Level) => Tile;

/**
 * Representation of a level.
 * When created, the raw level data in form of a string array
 * is parsed and the level elements are created using the tile
 * factories.
 */
export class Level {

  /**
   * Initializes the tile factories, i.e. the creators for
   * the elements of the level.
   */
  public static init() {
    Level.tileFactories.set("w", (l) => new Wall(l).init() );
    Level.tileFactories.set("B", (l) => new Bomb(l).init() );
    Level.tileFactories.set("p", (l) => new Portal(l, false).init() );
    Level.tileFactories.set("P", (l) => new Portal(l, true).init() );
    Level.tileFactories.set("x", (l) => new Player(l).init() );
    Level.tileFactories.set("a", (l) => new Deflector(l, 0).init() );
    Level.tileFactories.set("b", (l) => new Deflector(l, 1).init() );
    Level.tileFactories.set("c", (l) => new Deflector(l, 2).init() );
    Level.tileFactories.set("d", (l) => new Deflector(l, 3).init() );
    Level.tileFactories.set("T", (l) => new Trap(l, Direction.LEFT).init() );
    Level.tileFactories.set("t", (l) => new Trap(l, Direction.UP).init() );
    Level.tileFactories.set("h", (l) => new Wormhole(l).init() );
    Level.tileFactories.set("s", (l) => new Sensor(l).init() );
  }

  private static readonly tileFactories: Map<string, TileFactory> = new Map();

  private readonly code: string;
  private readonly keys: Map<string, boolean>;
  private readonly svg: SVGElement;
  private readonly svgSupport: SVGSupport;
  private readonly tiles: Tile[][];
  private readonly activeTiles: Tile[];
  private readonly sensors: Sensor[];
  private readonly player: Player;

  private time: number;
  private frame: number;
  private success: boolean;
  private aborted: boolean;
  private clearBombs: boolean;
  private showVeil: Veil;
  private hideVeil: Veil;
  private skull: SVGElement;

  /**
   * Creates the level.
   * @param code the code of the level
   * @param keys the game key map, which is asynchronously updated and can be read at any time
   * @param svg the root SVG element
   * @param svgSupport the SVG support utility
   * @param data the raw level data
   */
  constructor(code: string, keys: Map<string, boolean>, svg: SVGElement, svgSupport: SVGSupport, data: string[]) {
    this.code = code;
    this.keys = keys;
    this.svg = svg;
    this.svgSupport = svgSupport;
    this.tiles = [];
    this.activeTiles = [];
    this.sensors = [];
    this.clearBombs = false;
    this.player = this.build(data);
    this.frame = -1;
    this.success = false;
    this.aborted = false;
  }

  /**
   * Returns whether the level was successfully completed.
   */
  public isSolved(): boolean {
    return this.success;
  }

  /**
   * Returns whether the level was aborted.
   * To abort, press the space bar.
   */
  public isAborted(): boolean {
    return this.aborted;
  }

  /**
   * Returns the SVG support utility.
   */
  public getSVGSupport(): SVGSupport {
    return this.svgSupport;
  }

  /**
   * Renders the leven into the SVG root element.
   * This is only called once when the level is established.
   * Every other update to the view happens through SVG DOM manipulation.
   */
  public render(): void {
    const layer = this.svgSupport.clear(this.svg, SVGSupport.LAYER_MIDDLE);
    for (let ry = 0; ry < this.tiles.length; ry++) {
      for (let rx = 0; rx < this.tiles[ry].length; rx++) {
        const tile: Tile = this.tiles[ry][rx];
        if (tile) {
          tile.place(rx, ry);
          const element = tile.getElement();
          layer.appendChild(element);
        }
      }
    }
    layer.appendChild(this.player.getElement());
    let info = this.svgSupport.createElement("text", {
      style: "font: bold 18px sans-serif; fill: black; stroke: gold; stroke-width: 2; paint-order: stroke;",
      x: "6",
      y: "18",
    });
    layer.appendChild(info);
    info.textContent = this.code;
    let y = 18;
    const messageStyle = "font: bold 12px sans-serif; fill: white; " +
      "stroke: black; stroke-width: 0.5; paint-order: stroke; text-anchor: end;";
    info = this.svgSupport.createElement("text", {
      style: messageStyle,
      x: "632",       y,
    });
    info.textContent = Levels.number(this.code);
    layer.appendChild(info);
    y += 14;
    if (this.clearBombs) {
      info = this.svgSupport.createElement("text", {
        style: messageStyle,
        x: "632",
        y,
      });
      info.textContent = "clear bombs";
      layer.appendChild(info);
      y += 14;
    }
    if (this.sensors.length > 0) {
      info = this.svgSupport.createElement("text", {
        style: messageStyle,
        x: "632",
        y,
      });
      info.textContent = "activate sensors";
      layer.appendChild(info);
    }
    this.showVeil = new Veil(this.svgSupport.createVeils(this.svg), this.svgSupport, true);
//    console.log("svg", new XMLSerializer().serializeToString(this.svg));
  }

  /**
   * Returns the player.
   */
  public getPlayer(): Player {
    return this.player;
  }

  /**
   * Animates one frame
   * @param timestamp the current time stamp (optional)
   */
  public step(timestamp?: number): boolean {
    this.frame++;
    if (!this.time) {
      this.time = timestamp;
    }
    const delta = Math.min((timestamp - this.time), 250);
    // one step no shorter than 40ms
    if (delta >= 40) {
      if (this.showVeil) {
        if (!this.showVeil.step()) {
          this.svgSupport.clear(this.svg, SVGSupport.LAYER_VEIL);
          this.showVeil = undefined;
        }
      } else if (this.hideVeil) {
        if (!this.hideVeil.step()) {
          this.svgSupport.clear(this.svg, SVGSupport.LAYER_VEIL);
          return false;
        }
      }
      const playerLocation = this.player.getTileLocation();
      if (this.isOutOfBounds(playerLocation)) {
        this.exit(false);
      } else {
        if (this.player.isMoving()) {
          const next = this.player.getTileLocation(true);
          if (!this.isOutOfBounds(next)) {
            if (this.tiles[next.y][next.x]) {
              this.tiles[next.y][next.x].contact();
            }
          }
        } else {
          const position = this.player.getTileLocation();
          if (this.tiles[position.y][position.x] && !this.tiles[position.y][position.x].occupiable()) {
            this.exit(false);
            return true;
          }
        }
        if (!this.success) {
          this.player.handleKeys();
          this.player.step();
        }
      }
      let bombs = 0;
      let sensors = 0;
      for (let i = this.activeTiles.length; --i >= 0; ) {
        const tile = this.activeTiles[i];
        if (tile.step() === false) {
          const elem = tile.getElement();
          if (elem.parentNode) {
            elem.parentNode.removeChild(elem);
          }
          this.activeTiles.splice(i, 1);
          const location = tile.getTileLocation();
          this.tiles[location.y][location.x] = undefined;
        } else {
          if (tile instanceof Bomb) {
            bombs++;
          } else if (tile instanceof Sensor) {
            sensors += (tile as Sensor).activated() ? 0 : 1;
          }
        }
      }
      if (this.skull) {
        if (sensors > 0 || (this.clearBombs && bombs > 0)) {
          this.skull.setAttribute("opacity", (0.5 + Math.sin(this.frame * Math.PI / 45) / 2).toString(10));
        } else {
          this.skull.setAttribute("opacity", "0");
        }
      }
    }
    return true;
  }

  /**
   * Leave the level.
   * @param ok the success flag, which may be overridden by sensor and bomb conditions
   */
  public exit(ok: boolean): void {
    const result = ok && this.checkSensors();
    if (!this.hideVeil) {
      this.hideVeil = new Veil(this.svgSupport.createVeils(this.svg), this.svgSupport, false);
      Sfx.play(result ? Sound.EXIT : Sound.EXPLODE);
    }
    this.success = result;
  }

  /**
   * Quits the level.
   */
  public abort(): void {
    this.aborted = true;
    this.exit(false);
  }

  /**
   * Returns the tile at the given location.
   * @param x the x coordinate for the tile
   * @param y the y coordinate for the tile
   * @returns the tile at the location, or undefined
   */
  public tileAt(x: number, y: number): Tile {
    const row = this.tiles[y];
    if (row) {
      return row[x];
    }
    return undefined;
  }

  /**
   * Removes the tile at the given location.
   * This realizes some special handling for traps,
   * as they may overlap - for this the special
   * Overlap tile is used.
   * @param x the x coordinate for the tile
   * @param y the y coordinate for the tile
   * @param tile the tile to remove, optional
   */
  public removeTile(x: number, y: number, tile?: Tile): void {
    const old = this.tileAt(x, y);
    this.tiles[y][x] = undefined;
    if (tile && old instanceof Overlap) {
      if (!(old as Overlap).removeChild(tile)) {
        return;
      }
    }
    const idx = this.activeTiles.indexOf(old);
    if (idx >= 0) {
      this.activeTiles.splice(idx, 1);
    }
  }

  /**
   * Sets the given tile at the given location.
   * To remove a tile the removeTile method should be used.
   * @param x the x coordinate for the tile
   * @param y the y coordinate for the tile
   * @param tile the tile to set
   */
  public setTile(x: number, y: number, tile: Tile): void {
    let removeFromSVG = true;
    const old = this.tileAt(x, y);
    if (old instanceof Trap) {
      const trap = old as Trap;
      if (trap.isSide()) {
        // overlap with tile
        const overlap = new Overlap(this);
        overlap.init();
        overlap.addChild(old);
        overlap.addChild(tile);
        tile = overlap;
        removeFromSVG = false;
      } else {
        // do nothing, simple replace (below)
      }
    } else if (old instanceof Overlap) {
      const overlap = old as Overlap;
      overlap.addChild(tile);
      tile.place(x, y);
      return;
    }
    this.tiles[y][x] = tile;
    tile.place(x, y);
    this.activeTiles.push(tile);
    const idx = this.activeTiles.indexOf(old);
    if (idx >= 0) {
      const elem = old.getElement();
      if (removeFromSVG && elem.parentNode) {
        elem.parentNode.removeChild(elem);
      }
      this.activeTiles.splice(idx, 1);
    }
  }

  /**
   * Returns the key mapping used in the level.
   */
  public getKeys(): Map<string, boolean> {
    return this.keys;
  }

  /**
   * Returns the number of active bombs in the level.
   */
  public bombCount(): number {
    let count = 0;
    for (const row of this.tiles) {
      for (const tile of row) {
        if (tile instanceof Bomb) {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Checks if the given location is out of bounds or not.
   * @param location the location to check
   * @returns true if out of bounds
   */
  private isOutOfBounds(location: Vector): boolean {
    return location.x < 0 || location.x > 19 ||
      location.y < 0 || location.y > 14;
  }

  private checkSensors(): boolean {
    for (const sensor of this.sensors) {
      if (!sensor.activated()) {
        return false;
      }
    }
    return true;
  }

  private build(data: string[]): Player {
    let result;
    let wormhole;
    for (const row of data) {
      const elements = [];
      for (const tile of [...row]) {
        const creator: TileFactory = Level.tileFactories.get(tile);
        if (creator) {
          const element = creator.call(undefined, this, [ this ]);
          if (element instanceof Player) {
            result = element as Player;
            result.place(elements.length, this.tiles.length);
            elements.push(undefined);
          } else {
            elements.push(element);
            this.activeTiles.push(element);
            if (element instanceof Portal) {
              this.clearBombs = (element as Portal).clearAllBombs();
              this.skull = (element as Portal).getSkull();
            } else if (element instanceof Wormhole) {
              const other: Wormhole = element as Wormhole;
              if (wormhole) {
                wormhole.setExit(other);
                other.setExit(wormhole);
              } else {
                wormhole = other;
              }
            } else if (element instanceof Sensor) {
              this.sensors.push(element as Sensor);
            }
          }
        } else {
          elements.push(undefined);
        }
      }
      this.tiles.push(elements);
    }
    const postProc = [] as Tile[];
    const pos = [];
    for (let y = 0; y < this.tiles.length; y++) {
      for (let x = 0; x < this.tiles[y].length; x++) {
        const tile: Tile = this.tiles[y][x];
        if (tile && tile.wantsPostProcess()) {
          postProc.push(tile);
          pos.push({ x, y });
        }
      }
    }
    for (let i = 0; i < postProc.length; i++) {
      postProc[i].postProcess(pos[i].x, pos[i].y);
    }
    return result;
  }

}

Level.init();
