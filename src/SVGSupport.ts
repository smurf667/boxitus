/**
 * Utility for creation and manipulation of SVG elements.
 * This also establishes the different layers on the root SVG element
 * the game uses for rendering.
 */
export class SVGSupport {

  public static readonly LAYER_BACK = "back";
  public static readonly LAYER_MIDDLE = "middle";
  public static readonly LAYER_VEIL = "veil";

  private static readonly SVG_NS = "http://www.w3.org/2000/svg";
  // tslint:disable-next-line:max-line-length
  private static readonly LOGO = [["0,0", { d: "M 0 0 L 48 0 L 48 60 L 64 60 L 64 128 L 0 128 z M 8 8 L 8 60 L 40 60 L 40 8 z M 8 68 L 24 84 L 24 120 L 56 120 L 56 68 z" }],
  // tslint:disable-next-line:max-line-length
  ["80,0", { d: "M 0 0 L 64 0 L 64 128 L 0 128 z M 8 8 L 8 68 L 24 84 L 24 120 L 56 120 L 56 8 z" }, { d: "M 24 48 L 24 -16 L 16 -16 L 32 -32 L 48 -16 L 40 -16 L 40 48 z", fill: "url(#escgrad)" }],
  // tslint:disable-next-line:max-line-length
  ["160,0", { d: "M 0 0 L 8 0 L 8 8 L 32 48 L 56 8 L 56 0 L 64 0 L 64 12 L 36 60 L 64 116 L 64 128 L 56 128 L 56 120 L 32 72 L 8 120 L 8 128 L 0 128 L 0 116 L 28 60 L 0 12 z" }],
  // tslint:disable-next-line:max-line-length
  ["240,0", { d: "M 0 0 L 8 0 L 8 68 L 24 84 L 24 128 L 0 128 z" }],
  // tslint:disable-next-line:max-line-length
  ["264,0", { d: "M 0 0 L 64 0 L 64 8 L 36 8 L 36 68 L 52 84 L 52 128 L 28 128 L 28 8 L 0 8 z" }],
  // tslint:disable-next-line:max-line-length
  ["344,0", { d: "M 0 0 L 8 0 L 8 68 L 24 84 L 24 120 L 56 120 L 56 0 L 64 0 L 64 128 L 0 128 z" }],
  // tslint:disable-next-line:max-line-length
  ["424,0", { d: "M 0 0 L 64 0 L 64 16 L 56 16 L 56 8 L 8 8 L 8 48 L 64 48 L 64 128 L 0 128 L 0 68 L 8 68 L 24 84 L 24 120 L 56 120 L 56 56 L 0 56 z" }]];

  /**
   * Creates an SVG element with the given name.
   * @param name the name of the SVG element
   * @param attrs attributes of the element, optional
   */
  public createElement(name: string, attrs?: any): SVGElement {
    const result = document.createElementNS(SVGSupport.SVG_NS, name);
    if (attrs) {
      this.setAttributes(result, attrs);
    }
    return result;
  }

  /**
   * Sets attributes for the given SVG element
   * @param element the element to set the attributes on
   * @param attrs the attributes to set
   */
  public setAttributes(element: SVGElement, attrs: any): void {
    for (const v in attrs) {
      if (attrs.hasOwnProperty(v)) {
        element.setAttributeNS(null, v, attrs[v]);
      }
    }
  }

  /**
   * Creates the layers (groups) on the root SVG for the game.
   * @param root the root element
   * @param decoration flag to use decoration (beautifying the background);
   * this can be set to false to reduce graphics workload when the game is running
   */
  public createLayers(root: SVGElement, decoration: boolean): void {
    root.appendChild(this.createDefs());
    const background = this.createElement("g", { id: SVGSupport.LAYER_BACK, fill: "#0894e8" });
    background.appendChild(
      this.createElement("rect", { width: "100%", height: "100%", fill: "#225" }));
    if (decoration) {
      this.bubbles(background, {
        count: 5,
        maxr: 96,
        maxx: 640,
        maxy: 480,
        minr: 48,
        minx: 0,
        miny: 0,
      });
    }
    root.appendChild(background);
    root.appendChild(this.createElement("g", { id: SVGSupport.LAYER_MIDDLE }));
    root.appendChild(this.createElement("g", { id: SVGSupport.LAYER_VEIL }));
    root.appendChild(this.createElement("rect", {
      fill: "#000",
      height: "100%",
      transform: "scale(-1,1)",
      width: "50%",
    }));
    root.appendChild(this.createElement("rect", { x: "100%", width: "50%", height: "100%", fill: "#000" }));
  }

  /**
   * Deletes all children for the given layer.
   * @param root the SVG root element
   * @param layerID the layer ID whose children are to be removed.
   */
  public clear(root: SVGElement, layerID: string): SVGElement {
    const group = root.querySelector("#" + layerID) as SVGElement;
    while (group.firstChild) {
      group.removeChild(group.firstChild);
    }
    return group;
  }

  /**
   * Creates the veils used for fading in and out.
   * @param root the root SVG element
   */
  public createVeils(root: SVGElement): SVGElement[] {
    const group = root.querySelector("#" + SVGSupport.LAYER_VEIL) as SVGElement;
    const list: SVGElement[] = [];
    for (let y = 0; y < 480; y += 30) {
      const v = this.createElement("rect", {
        fill: "black",
        height: "30",
        stroke: "transparent",
        width: "100%",
        x: "0",
        y: y.toString(),
      });
      group.appendChild(v);
      list.push(v);
    }
    return list;
  }

  /**
   * Creates the game logo.
   * @param root the SVG root element.
   */
  public createLogo(root: SVGElement): SVGElement {
    const group = this.clear(root, SVGSupport.LAYER_MIDDLE);
    const logo = this.createElement("g", {
      style: "stroke:rgb(220,240,248);stroke-width:3;fill:url(#logograd)",
      transform: "translate(76,112)",
    });
    for (const info of JSON.parse(JSON.stringify(SVGSupport.LOGO))) {
      const letter = this.createElement("g", { transform: "translate(" + info.shift() + ")" });
      for (const path of info) {
        letter.appendChild(this.createElement("path", path));
      }
      logo.appendChild(letter);
    }
    group.appendChild(logo);
    const code = this.createElement("g");
    code.appendChild(this.createElement("rect", {
      "fill": "url(#escgrad)",
      "height": "80",
      "stroke": "rgb(220,240,248)",
      "stroke-width": "3px",
      "width": "320",
      "x": "160",
      "y": "272",
    }));
    const text = this.createElement("text", {
      "contenteditable": true,
      "dominant-baseline": "middle",
      "id": "code",
      "style": "font-family:Sans,Arial;font-size:64px;fill:rgb(220,240,248)",
      "text-anchor": "middle",
      "x": "50%",
      "y": "316",
    });
    text.textContent = "????";
    code.appendChild(text);
    group.appendChild(code);
    return group;
  }

  private createDefs(): SVGElement {
    const result = this.createElement("defs");
    const triangle = this.createElement("marker", {
      id: "triangle",
      markerHeight: "16",
      markerUnits: "strokeWidth",
      markerWidth: "8",
      orient: "auto",
      refX: "1",
      refY: "5",
      viewBox: "0 0 32 32",
    });
    triangle.appendChild(this.createElement("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "white" }));
    result.appendChild(triangle);
    for (const info of [[ "logograd", "#225", "#49e", "#acf" ], [ "escgrad", "#300", "#e44", "#f66" ]]) {
      const grad = this.createElement("linearGradient", {
        id: info.shift(),
        x1: "0%",
        x2: "0%",
        y1: "0%",
        y2: "100%",
      });
      const steps = [ "0%", "70%", "100%" ];
      for (const color of info) {
        grad.appendChild(this.createElement("stop", {
          offset: steps.shift(),
          style: "stop-color:" + color + ";stop-opacity:1",
        }));
      }
      result.appendChild(grad);
    }
    return result;
  }

  private bubbles(root: SVGElement, limits: any) {
    if (limits.minr < 8) {
      return;
    }
    const next: any[] = [];
    for (let i = 0; i < limits.count; i++) {
      const pos = {
        "cx": this.nextInt(limits.maxx, limits.minx),
        "cy": this.nextInt(limits.maxy, limits.miny),
        "fill-opacity": "0.1",
        "r": this.nextInt(limits.maxr, limits.minr),
      };
      root.appendChild(this.createElement("circle", pos));
      next.push(pos);
    }
    for (const position of next) {
      const nextLimit = {
        count: limits.count * 2,
        maxr: limits.maxr / 2,
        maxx: position.cx + 1.5 * position.r,
        maxy: position.cy + 1.5 * position.r,
        minr: limits.minr / 2,
        minx: position.cx - 1.5 * position.r,
        miny: position.cy - 1.5 * position.r,
      };
      this.bubbles(root, nextLimit);
    }
  }

  private nextInt(max: number, min?: number): number {
    return Math.floor(min > 0 ? min + Math.random() * (max - min) : Math.random() * max);
  }

}
