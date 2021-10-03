import { EDefaultGeo } from ".."

export class SkinClass {
  public name: string
  public texture: string
  public geometry: string
  public type: 'free'

  public constructor(name: string, texture: string)
  public constructor(name: string, texture: string, type: 'free')
  public constructor(name: string, texture: string, geometry: EDefaultGeo | string, type: 'free')
  public constructor(name: string, texture: string, geometry?: string | EDefaultGeo, type?: 'free') {
    this.name = name
    this.texture = texture

    this.geometry = 'geometry.humanoid.custom'
    this.type = 'free'

    if (geometry && type) {
      this.geometry = geometry
      this.type = type
    } else {
      this.type = geometry as 'free'
    }
  }
}