/**
 * Container for the levels.
 */
export class Levels {

  /**
   * Returns the raw level data.
   * @param code the code for the level, optional (if not specified,
   * the first level is returned)
   * @returns the level elements as a string array - see Level for
   * how these are parsed
   */
  public static getData(code?: string): string[] {
    const idx = code ? Levels.DATA.index.indexOf(code) : 0;
    return idx >= 0 ? Levels.DATA.data[idx] : undefined;
  }

  /**
   * Returns the first level code.
   */
  public static initialCode(): string {
    return Levels.DATA.index[0];
  }

  /**
   * Returns the next level code for the given code.
   * @param code the current level code
   */
  public static nextCode(code: string): string {
    const idx = Levels.DATA.index.indexOf(code);
    return idx >= 0 ? Levels.DATA.index[(idx + 1) % Levels.DATA.index.length] : Levels.initialCode();
  }

  /**
   * Returns displayable information about the level
   * number.
   * @param code the level code for which to return the level number
   */
  public static number(code: string): string {
    return (1 + Levels.DATA.index.indexOf(code)) + "/" + Levels.DATA.index.length;
  }

  /**
   * Decodes the compressed level information into runtime usable information.
   * The levels are compressed into a PNG to conserve space, and parsed into
   * raw string arrays here.
   * This method must be called before the game can run.
   */
  public static decode(): Promise<void> {
    return new Promise<void>((resolve) => {
      const img = document.createElement("img");
      img.src = Levels.ENCODED;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, img.width, img.height);
        for (let y = 0; y < img.height; y++) {
          let code = "";
          for (let i = 0 ; i < 4; i++) {
            code += String.fromCharCode(ctx.getImageData(i, y, 1, 1).data[0]);
          }
          Levels.DATA.index.push(code);
          const level = [];
          let row = "";
          for (let i = 0 ; i < 15 * 20; i++) {
            row += String.fromCharCode(ctx.getImageData(i + 4, y, 1, 1).data[0]);
            if ((i + 1) % 20 === 0) {
              level.push(row);
              row = "";
            }
          }
          Levels.DATA.data.push(level);
        }
        resolve();
      };
    });
  }

  private static readonly DATA = { index: [], data: [] };

  // the levels, compressed in a PNG - created using the Java editor
  private static readonly ENCODED = "data:image/png;base64,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";

}
