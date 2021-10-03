export class LangClass {
  public path: string
  public data: string
  public replace = false

  public constructor(path: string, data: Record<string, string>, options?: { replace: boolean }) {
    this.path = path

    let result = ''
    Object.entries<string>(data).forEach(([key, value], idx, arr) => {
      result += key + '=' + value + (idx + 1 === arr.length ? '' : '\n')
    })

    this.data = result

    if (options?.replace) this.replace = options.replace
  }
}