export function compactBasicArray(obj: any, indent = 2) {
  function replacer(key: any, value: any) {
    if (Array.isArray(value) && !value.some(x => x && typeof x === 'object')) {
      return `\uE000${JSON.stringify(value.map(v => typeof v === 'string' ? v.replace(/"/g, '\uE001') : v))}\uE000`.replace(/,/g, ', ');
    }
  
    return value;
  }

  return JSON.stringify(obj, replacer, indent).replace(/"\uE000([^\uE000]+)\uE000"/g, (m) =>
    m.substr(2, m.length - 4).replace(/\\"/g, '"').replace(/\uE001/g, '\\\"')
  )
}

export class JsonArray<T = any> {
  private arr: T[] = []

  public constructor(array?: T[]) {
    if (array) this.arr = [...array]
  }

  public add(value: boolean | string | number | JsonObject | JsonArray): void {
    if (value instanceof JsonObject || value instanceof JsonArray) {
      this.arr.push(value.toJSON())
    } else {
      this.arr.push(value as any)
    }
  }

  public addAll(array: JsonArray) {
    this.arr.push(...array.toJSON())
  }

  public toString(): any {
    return JSON.stringify(this.arr)
  }

  public toJSON(): any {
    return this.arr
  }
}

export class JsonObject<T = any> {
  private obj: Record<string, T> = {}

  public add(key: string, value: JsonObject<T> | JsonArray): void {
    this.obj[key] = value.toJSON()
  }

  public addProperty(key: string, value: boolean | string | number): void {
    this.obj[key] = value as any
  }

  public toString(): any {
    return JSON.stringify(this.obj)
  }

  public toJSON(): any {
    return this.obj
  }
}

export function getFromRegex(str: string, regex: RegExp): RegExpMatchArray | [] {
  const m = str.match(regex)
  return m ?? []
}