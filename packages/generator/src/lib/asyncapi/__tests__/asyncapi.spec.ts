import { readFileSync } from 'fs'
import { parse } from 'yaml'
import { generate } from '../schema'
import { AsyncApi } from '../types'

import prettier = require('prettier')

const format = (str: string) => {
  return prettier.format(str, {
    semi: false,
    parser: 'typescript',
  })
}

const schemaTxt = readFileSync(
  __dirname + '/../../../../testdata/asyncapi.yml',
  'utf-8'
)

describe('schema', () => {
  let schema: AsyncApi
  beforeAll(() => {
    schema = parse(schemaTxt)
  })
  describe('generate', () => {
    it('generates a correct document', () => {
      const generated = generate({ schema, name: 'Asyncapi' })
      const expected = `/**
      * This file was auto-generated.
      * Do not make direct changes to the file.
      */
     
     /* tslint:disable */
     /* eslint-disable */
     
     export type MessageB = {
       name?: string
       enabled?: boolean
     }
     
     export type MessageC = {
       name?: string
       description?: string
     }[]
     
     export type AsyncapiChannels = {
       "channel.A": string
     
       "channel.B": MessageB
     
       "channel.C": MessageC
     }
     
`
      expect(format(generated)).toEqual(format(expected))
    })
  })
})
