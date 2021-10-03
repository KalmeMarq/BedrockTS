// Based (pretty much the same) on sandstone
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

const rootDir = __dirname + '/..'
const distDir = rootDir + '/dist'

const source = readFileSync(__dirname + "/../package.json").toString('utf-8')
const sourceObj = JSON.parse(source)

sourceObj.scripts = {}
sourceObj.devDependencies = {}

if (sourceObj.main.startsWith("dist/")) {
  sourceObj.main = sourceObj.main.slice(5);
}

if(sourceObj.dependencies) delete sourceObj.dependencies.sandstone
if(sourceObj.devDependencies) delete sourceObj.devDependencies.sandstone

writeFileSync(distDir + "/package.json", Buffer.from(JSON.stringify(sourceObj, null, 2), "utf-8"))
writeFileSync(distDir + "/version.txt", Buffer.from(sourceObj.version, "utf-8"))

mkdirSync(distDir + '/templates', { recursive: true })

copyFileSync(rootDir + '/src/templates/spack_manifest.json', distDir + '/templates/spack_manifest.json')
copyFileSync(rootDir + '/src/templates/rpack_manifest.json', distDir + '/templates/rpack_manifest.json')
copyFileSync(rootDir + '/src/templates/bpack_manifest.json', distDir + '/templates/bpack_manifest.json')

copyFileSync(rootDir + '/README.md', distDir + '/README.md')
copyFileSync(rootDir + '/tsconfig.json', distDir + '/.tsconfig.json')