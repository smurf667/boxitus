import {Level} from "./Level";
import {Levels} from "./Levels";
import {Logo} from "./Logo";
import {Player} from "./Player";
import {SVGSupport} from "./SVGSupport";
import {Veil} from "./Veil";

/**
 * Main entry point into the game.
 * This bootstraps the required HTML DOM elements and SVG
 * elements. It first shows the logo and code box.
 * A four character level code can be entered to go to a
 * particular level, if known, or the game can be started
 * at the first level.
 */
export class Game {

  private static readonly TEXTS: string[] = [
    "Stay a while. Stay forever!",
    "There is no escape!",
    "Resistance is futile!",
    "To be or not to be!",
    "You shall not pass.",
    "Abandon all hope!",
    "Termination bliss.",
  ];

  private readonly svgSupport: SVGSupport;
  private readonly svg: SVGElement;
  private readonly keys: Map<string, boolean>;

  private logo: Logo;
  private sleeper: HTMLVideoElement;
  private lastSleep: number;
  private readonly zeroPos = {
    beta: undefined,
    gamma: undefined,
  };

  /**
   * Creates the game in the given window.
   * This establishing the rendering part and the
   * IO part (key input and mobile orientation sensor,
   * if available).
   */
  constructor() {
    this.lastSleep = new Date().getTime();
    this.svgSupport = new SVGSupport();
    this.keys = new Map();
    const root = document.createElement("div");
    const cssPosition = "position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 16;";
    root.setAttribute("id", "panel");
    root.setAttribute("tabindex", "0");
    root.setAttribute("style", cssPosition);
    root.setAttribute("class", "main");
    const game = this;
    const keyHandler = (event) => {
      const keyDown = event.type === "keydown";
      game.keys.set(event.key, keyDown);
      if (keyDown && this.logo) {
        this.logo.handleKey(event.key);
        if (event.key === Player.SPACE) {
          root.onclick(undefined);
        }
      }
    };
    root.onkeyup = keyHandler;
    root.onkeydown = keyHandler;
    const starter = () => {
      if (this.logo) {
        this.logo.start();
        this.logo = null;
      }
    };
    root.onclick = (event) => starter();
    // mobile device support, a bit shaky but hopefully usable
    if ("ontouchstart" in window) {
      root.ontouchstart = (event) => starter();
      window.addEventListener("deviceorientation", (event) => {
        if (this.zeroPos.beta === undefined) {
          this.zeroPos.beta = Math.min(90, Math.max(-90, Math.round(event.beta)));
          this.zeroPos.gamma = Math.round(event.gamma);
          return;
        }
        const deltaBeta = Math.round(event.beta) - this.zeroPos.beta;
        const deltaGamma = Math.round(event.gamma) - this.zeroPos.gamma;
        const sign = -Math.sign(this.zeroPos.gamma);

        const sensx = 10;
        const sensy = 10;
        const simulatedKey: any = {
          type: "keydown",
        };
        if (Math.abs(deltaBeta) > Math.abs(deltaGamma)) {
          if (Math.abs(deltaBeta) > sensx) {
            simulatedKey.key = sign * deltaBeta > 0 ? Player.RIGHT : Player.LEFT;
          } else {
            game.keys.set(Player.RIGHT, false);
            game.keys.set(Player.LEFT, false);
          }
        } else if (Math.abs(deltaGamma) > sensy) {
          simulatedKey.key = sign * deltaGamma > 0 ? Player.UP : Player.DOWN;
        } else {
          game.keys.set(Player.UP, false);
          game.keys.set(Player.DOWN, false);
        }

        if (simulatedKey.key) {
          game.preventSleep();
          keyHandler(simulatedKey);
        }
      }, true);
    }
    this.svg = this.svgSupport.createElement("svg", { viewBox: "0 0 640 480" });
    const resizer = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (width > height) {
        game.svg.setAttribute("height", height.toString(10));
      } else {
        game.svg.setAttribute("width", width.toString(10));
      }
    };
    resizer();
    window.onresize = resizer;
    this.svgSupport.createLayers(this.svg, !("ontouchstart" in window));
    root.appendChild(this.svg);
    const info = document.createElement("h1");
    info.setAttribute("class", "info");
    info.setAttribute("style", cssPosition);
    info.appendChild(document.createTextNode("requires landscape mode"));
    info.appendChild(document.createElement("br"));
    info.appendChild(document.createTextNode("disable auto-rotation"));
    info.appendChild(document.createElement("br"));
    const rotateIcon = this.svgSupport.createElement("svg", { width: "256", height: "256", viewBox: "0 0 256 256" });
    const group = this.svgSupport.createElement("g", { "fill": "transparent", "stroke": "white", "stroke-width": "2" });
    rotateIcon.appendChild(group);
    group.appendChild(this.svgSupport.createElement("rect", {
      height: "192",
      rx: "10",
      ry: "10",
      width: "112",
      x: "72",
      y: "32",
    }));
    group.appendChild(this.svgSupport.createElement("rect", {
      height: "144",
      rx: "10",
      ry: "10",
      width: "96",
      x: "80",
      y: "40",
    }));
    group.appendChild(this.svgSupport.createElement("circle", { cx: "128", cy: "204", r: "10" }));
    group.appendChild(this.svgSupport.createElement("animateTransform", {
      attributeName: "transform",
      dur: "2.5s",
      fill: "freeze",
      from: "0 128 128",
      repeatCount: "1",
      to: "-90 128 128",
      type: "rotate",
    }));
    info.appendChild(rotateIcon);
    document.body.appendChild(info);

    const fullscreen = this.svgSupport.createElement("svg", { width: "48", height: "48", viewBox: "0 0 36 36" });
    fullscreen.appendChild(this.svgSupport.createElement("path", {
      d: "M0 0h36v36h-36z",
      fill: "#225",
    }));
    fullscreen.appendChild(this.svgSupport.createElement("path", {
      d: "M10 21h-3v8h8v-3h-5v-5zm-3-6h3v-5h5v-3h-8v8zm19 11h-5v3h8v-8h-3v5zm-5-19v3h5v5h3v-8h-8z",
      fill: "#349",
      stroke: "white",
    }));
    fullscreen.setAttribute("class", "fs main");
    const action = () => {
      const p = game.svg.requestFullscreen();
    };
    fullscreen.onclick = action;
    fullscreen.ontouchend = action;
    document.addEventListener("fullscreenchange", () => {
      // TODO looks like a bug in TS https://github.com/Microsoft/TSJS-lib-generator/issues/551
      if ((document as any).fullscreenElement) {
        window.screen.orientation.lock("landscape").catch((e) => { /* silently ignore */ });
      }
    }, false);
    // read the compressed level information and
    // afterwards become ready to play...
    Levels.decode().then(() => {
      document.body.appendChild(root);
      document.body.appendChild(fullscreen);
      root.focus();
      this.run(window.location.hash);
    });
  }

  /**
   * Checks if the level for the given code exists.
   * @param code the code to check
   * @returns true if a level exists for the code
   */
  public hasLevel(code: string): boolean {
    return Levels.getData(code) !== undefined;
  }

  /**
   * Runs the game by showing the logo.
   * @param code the code of the level to start at; optional
   * (if not specified, the first level will be used)
   */
  public run(code?: string) {
    if (code && code.startsWith("#")) {
      code = code.substring(1);
    }
    this.logo = new Logo(this, this.svgSupport, this.svg, this.hasLevel(code) ? code : undefined);
    this.logo.run();
  }

  /**
   * Runs a level.
   * @param code the code of the level to run
   */
  public runLevel(code: string) {
    this.logo = null;
    this.zeroPos.beta = undefined; // recalibrate for orientation sensor
    window.location.hash = code;
    const level: Level = new Level(code, this.keys, this.svg, this.svgSupport, Levels.getData(code));
    level.render();
    const stepper = (timestamp: number) => {
      if (level.step(timestamp)) {
        window.requestAnimationFrame(stepper);
      } else {
        if (level.isSolved()) {
          this.runLevel(Levels.nextCode(code));
        } else {
          this.speak();
          if (level.isAborted()) {
            this.runLevel(code);
          } else {
            this.run(code);
          }
        }
      }
    };
    window.requestAnimationFrame(stepper);
  }

  /**
   * A little gag, say some discouraging sentence when
   * a level is not solved.
   */
  private speak(): void {
    if ("speechSynthesis" in window) {
      new Promise<SpeechSynthesisVoice[]>((resolve) => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length) {
          resolve(voices);
        } else {
          window.speechSynthesis.onvoiceschanged = () => {
            resolve(window.speechSynthesis.getVoices());
          };
        }
      }).then((voices) => {
        const candidates = voices.filter( (v) => {
          return v.lang.startsWith("en-US");
        });
        const message = new SpeechSynthesisUtterance();
        message.voice = candidates.length > 0 ? candidates[0] : voices[0];
        message.text = Game.TEXTS[Math.floor(Math.random() * Game.TEXTS.length)];
        message.volume = 1;
        message.rate = 0.7;
        message.pitch = 0.1;
        window.speechSynthesis.speak(message);
      });
    }
  }

  /**
   * On mobile devices, try to prevent the screen from being
   * turned off to conserve energy (aka "sleep").
   * This is a bit of a crazy hack as the "Wake Lock API" is
   * not yet available in current browsers (beginning of 2019).
   */
  private preventSleep(): void {
    if (this.sleeper) {
      const now = new Date().getTime();
      // plays the video after 15s
      if (now - this.lastSleep > 15000) {
        this.lastSleep = now;
        const p = this.sleeper.play();
        p.catch((e) => { /* ignore */ });
      }
    } else {
      const game = this;
      const video = document.createElement("video");
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      const source = document.createElement("source");
      // https://github.com/richtr/NoSleep.js/blob/master/src/media.js
      source.src = "data:video/mp4;base64,AAAAIGZ0eXBtcDQyAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAACKBtZGF0AAAC8wYF///v3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE0MiByMjQ3OSBkZDc5YTYxIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNCAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTEgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MToweDExMSBtZT1oZXggc3VibWU9MiBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0wIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MCA4eDhkY3Q9MCBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0wIHRocmVhZHM9NiBsb29rYWhlYWRfdGhyZWFkcz0xIHNsaWNlZF90aHJlYWRzPTAgbnI9MCBkZWNpbWF0ZT0xIGludGVybGFjZWQ9MCBibHVyYXlfY29tcGF0PTAgY29uc3RyYWluZWRfaW50cmE9MCBiZnJhbWVzPTMgYl9weXJhbWlkPTIgYl9hZGFwdD0xIGJfYmlhcz0wIGRpcmVjdD0xIHdlaWdodGI9MSBvcGVuX2dvcD0wIHdlaWdodHA9MSBrZXlpbnQ9MzAwIGtleWludF9taW49MzAgc2NlbmVjdXQ9NDAgaW50cmFfcmVmcmVzaD0wIHJjX2xvb2thaGVhZD0xMCByYz1jcmYgbWJ0cmVlPTEgY3JmPTIwLjAgcWNvbXA9MC42MCBxcG1pbj0wIHFwbWF4PTY5IHFwc3RlcD00IHZidl9tYXhyYXRlPTIwMDAwIHZidl9idWZzaXplPTI1MDAwIGNyZl9tYXg9MC4wIG5hbF9ocmQ9bm9uZSBmaWxsZXI9MCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAAOWWIhAA3//p+C7v8tDDSTjf97w55i3SbRPO4ZY+hkjD5hbkAkL3zpJ6h/LR1CAABzgB1kqqzUorlhQAAAAxBmiQYhn/+qZYADLgAAAAJQZ5CQhX/AAj5IQAD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";
      source.type = "video/mp4";
      video.oncanplay = () => {
        game.sleeper = video;
        game.preventSleep();
      };
      video.appendChild(source);
    }

  }

}
