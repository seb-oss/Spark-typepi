/**
 * This is a minimal script to publish your package to "npm".
 * This is meant to be used as-is or customize as you see fit.
 *
 * This script is executed on "dist/path/to/library" as "cwd" by default.
 *
 * You might need to authenticate with NPM before running this script.
 */

import devkit from '@nrwl/devkit'
import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import chalk from 'chalk'
import semver from 'semver'

function invariant(condition, message) {
  if (!condition) {
    console.error(chalk.bold.red(message))
    process.exit(1)
  }
}

// Executing publish script: node path/to/publish.mjs {name} --version {version} --tag {tag}
// Default "tag" to "next" so we won't publish the "latest" tag by accident.
const [, , name, versionOrBump] = process.argv

const graph = devkit.readCachedProjectGraph()
const project = graph.nodes[name]

invariant(
  project,
  `Could not find project "${name}" in the workspace. Is the project.json configured correctly?`
)

const outputPath = project.data?.targets?.build?.options?.outputPath
invariant(
  outputPath,
  `Could not find "build.options.outputPath" of project "${name}". Is project.json configured  correctly?`
)

const packageJson = JSON.parse(readFileSync(`${project.data.root}/package.json`, 'utf-8'))

const validBump = /^{major|minor|patch}$/
const version = validBump.test(versionOrBump) ? semver.inc(packageJson.version, versionOrBump) : version

// A simple SemVer validation to validate the version
invariant(
  version && semver.valid(version),
  `No version provided or version did not match Semantic Versioning, expected: #.#.#-tag.# or #.#.#, got ${version}.`
)

const tag = `${name}-${version}`

process.chdir(outputPath)

// Updating the version in "package.json" before publishing
try {
  const json = JSON.parse(readFileSync(`package.json`).toString())
  json.version = version
  writeFileSync(`package.json`, JSON.stringify(json, null, 2))
} catch (e) {
  console.error(
    chalk.bold.red(`Error reading package.json file from library build output.`)
  )
}

// Execute "npm publish" to publish
execSync(`npm publish --access public --tag ${tag}`)

packageJson.version = version
writeFileSync(`../../../${project.data.root}/package.json`, JSON.stringify(packageJson, null, 2))
