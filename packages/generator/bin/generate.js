#!/usr/bin/env node

const { generate } = require('../src')
const parse = require('yargs-parser')
const { i, o } = parse(process.argv)

generate({ input: i, output: o })
