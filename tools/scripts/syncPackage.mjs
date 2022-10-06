import { readFileSync, writeFileSync } from 'fs'

const localPackageRaw = readFileSync('package.json', 'utf-8')
const localPackage = JSON.parse(localPackageRaw)
const globalPackage = JSON.parse(readFileSync('../../package.json', 'utf-8'))

const propertiesToCopy = [
  'license',
  'author',
  'contributors',
  'repository',
  'homepage',
  'bugs',
]

for(const property of propertiesToCopy) {
  if (globalPackage[property]) {
    localPackage[property] = globalPackage[property]
  }
}

const updatedLocalPackageRaw = JSON.stringify(localPackage, null, 2) + '\n'

if (updatedLocalPackageRaw !== localPackageRaw) {
  writeFileSync('package.json', updatedLocalPackageRaw, 'utf-8')
}
