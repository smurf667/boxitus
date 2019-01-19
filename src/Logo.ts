import {Game} from "./Game";
import {Levels} from "./Levels";
import {SVGSupport} from "./SVGSupport";
import {Veil} from "./Veil";

export class Logo {

  private static readonly ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz-";
  private static readonly UNKNOWN = "????";

  private readonly initialCode: string;
  private readonly game: Game;
  private readonly svgSupport: SVGSupport;
  private readonly svg: SVGElement;
  private code: SVGElement;

  constructor(game: Game, svgSupport: SVGSupport, root: SVGElement, initialCode?: string) {
    this.game = game;
    this.svgSupport = svgSupport;
    this.svg = root;
    this.initialCode = initialCode ? initialCode : Logo.UNKNOWN;
  }

  public handleKey(key: string): void {
    if (Logo.ALPHABET.indexOf(key) >= 0) {
      if (this.code.textContent.length === 4) {
        this.code.textContent = key;
      } else {
        this.code.textContent += key;
        if (this.code.textContent.length === 4 && this.game.hasLevel(this.code.textContent)) {
          this.hide(this.code.textContent);
        }
      }
    }
  }

  public start(): void {
    this.hide(Levels.getData(this.code.textContent) ? this.code.textContent : Levels.initialCode());
  }

  public run(): void {
    this.code = this.svgSupport.createLogo(this.svg).querySelector("#code") as SVGElement;
    this.code.textContent = this.initialCode;
    const appear = new Veil(this.svgSupport.createVeils(this.svg), this.svgSupport, true);
    const stepper = () => {
      if (appear.step()) {
        window.requestAnimationFrame(stepper);
      } else {
        this.svgSupport.clear(this.svg, SVGSupport.LAYER_VEIL);
      }
    };
    window.requestAnimationFrame(stepper);
  }

  protected hide(code: string): void {
    const disappear = new Veil(this.svgSupport.createVeils(this.svg), this.svgSupport, false);
    const stepper = () => {
      if (disappear.step()) {
        window.requestAnimationFrame(stepper);
      } else {
        this.svgSupport.clear(this.svg, SVGSupport.LAYER_VEIL);
        this.game.runLevel(code);
      }
    };
    window.requestAnimationFrame(stepper);
  }

}
