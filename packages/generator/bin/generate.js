#!/usr/bin/env node

const { generate } = require('../src')

const args = {}
let state = ''
const inputs = []
let output = ''
for (const arg of process.argv) {
  if (arg === '-i') {
    state = 'input'
    continue
  }
  if (arg === '-o') {
    state = 'output'
    continue
  }
  if (state === 'input') inputs.push(arg)
  if (state === 'output') output = arg
}

if (inputs.length) args.input = inputs
if (output) args.output = output

generate(args)
