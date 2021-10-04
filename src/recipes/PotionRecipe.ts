import AddonPack, { Registry } from "../addon";
import { getFromRegex, JsonArray, JsonObject } from "../utils";
import { RecipeClass } from "./Recipe";

export class PotionRecipeBuilder {
  private input: string
  private reagent: string
  private output: string
  
  private constructor(input: string, reagent: string, output: string) {
    this.input = input
    this.reagent = reagent
    this.output = output
  }

  public static brewing(input: string, reagent: string, output: string) {
    return new PotionRecipeBuilder(input, reagent, output)
  }

  public save(registry: Registry<RecipeClass>, path: string) {
    registry.register(new PotionRecipeClass(path, this.input, this.reagent, this.output))
  }
}

export class PotionRecipeClass implements RecipeClass {
  public id: string
  public path: string
  public input: string
  public reagent: string
  public output: string
  
  public constructor(path: string, input: string, reagent: string, output: string) {
    this.path = path
    this.id = getFromRegex(path, /[^/]+$/)[0] ?? 'unknown'
    this.input = input
    this.reagent = reagent
    this.output = output
  }

  public serializeRecipeData() {
    const recipeObj = new JsonObject()
    recipeObj.addProperty('format_version', '1.12')

    const recipe = new JsonObject()
    const desc = new JsonObject()
    desc.addProperty('identifier', AddonPack.namespace + ':' + this.id)

    recipe.add('tags', new JsonArray(['brewing_stand']))
    recipe.addProperty('input', this.input)
    recipe.addProperty('reagent', this.reagent)
    recipe.addProperty('output', this.output)

    recipeObj.add('minecraft:recipe_brewing_mix', recipe)

    return recipeObj.toJSON()
  }
}