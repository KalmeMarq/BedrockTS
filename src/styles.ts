export class Color {
  private code: string
  private name: string

  public constructor(code: string, name: string) {
    this.code = code
    this.name = name
  }

  public getCode(): string {
    return this.code
  }

  public getName(): string {
    return this.name
  }
}

export class Styles {
  public static COLORS: Map<string, Color> = new Map()
  public static DARK_RED = Styles.registerCode(new Color('§4', 'dark_red'))
  public static RED = Styles.registerCode(new Color('§c', 'red'))
  public static GOLD = Styles.registerCode(new Color('§6', 'gold'))
  public static YELLOW = Styles.registerCode(new Color('§e', 'yellow'))
  public static DARK_GREEN = Styles.registerCode(new Color('§2', 'dark_green'))
  public static GREEN = Styles.registerCode(new Color('§a', 'green'))
  public static AQUA = Styles.registerCode(new Color('§b', 'aqua'))
  public static DARK_AQUA = Styles.registerCode(new Color('§3', 'dark_aqua'))
  public static DARK_BLUE = Styles.registerCode(new Color('§1', 'dark_blue'))
  public static BLUE = Styles.registerCode(new Color('§9', 'blue'))
  public static LIGHT_PURPLE = Styles.registerCode(new Color('§d', 'light_purple'))
  public static DARK_PURPLE = Styles.registerCode(new Color('§5', 'dark_purple'))
  public static WHITE = Styles.registerCode(new Color('§f', 'white'))
  public static GRAY = Styles.registerCode(new Color('§7', 'gray'))
  public static DARK_GRAY = Styles.registerCode(new Color('§8', 'dark_gray'))
  public static BLACK = Styles.registerCode(new Color('§0', 'black'))
  public static OBFUSCATED = Styles.registerCode(new Color('§k', 'obfuscated'))
  public static BOLD = Styles.registerCode(new Color('§l', 'bold'))
  public static STRIKETHROUGH = Styles.registerCode(new Color('§m', 'strikethrough'))
  public static UNDERLINE = Styles.registerCode(new Color('§n', 'underline'))

  private static registerCode(color: Color) {
    Styles.COLORS.set(color.getName(), color)
    return color
  }
}
