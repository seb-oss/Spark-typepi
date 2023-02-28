import { readFileSync } from 'fs'
import {
  generate,
  generateBaseData,
  generateRoutesDefinition,
} from '../lib/schema'
import { OpenAPI3 } from '../lib/types'

import prettier = require('prettier')

const format = (str: string) => {
  return prettier.format(str, {
    semi: false,
    parser: 'typescript',
  })
}

const schemaTxt = readFileSync(
  __dirname + '/../../../../testdata/openapi.json',
  'utf-8'
)

describe('schema', () => {
  let schema: OpenAPI3
  beforeAll(() => {
    schema = JSON.parse(schemaTxt)
  })
  describe('generateBaseData', () => {
    describe('types', () => {
      it('finds all types', () => {
        const generated = generateBaseData({ schema })

        expect(generated.types).toEqual({
          Card: expect.any(String),
          CardSettings: expect.any(String),
          CardList: expect.any(String),
          Documented: expect.any(String),
          HttpError: expect.any(String),
        })
      })
      it('generates all properties', () => {
        const generated = generateBaseData({ schema })

        expect(format(generated.types.Card)).toEqual(
          format(
            `export type Card = {
  id: string
  ownerId: string
  nameOnCard: string
  settings?: CardSettings
}`
          )
        )
      })
      it('generates deep properties', () => {
        const generated = generateBaseData({ schema })

        expect(format(generated.types.CardSettings)).toEqual(
          format(
            `export type CardSettings = {
  cardId: string
  frozen: {
    value: boolean
    editableByChild: boolean
  }
}`
          )
        )
      })
      it('generates array properties', () => {
        const generated = generateBaseData({ schema })

        expect(format(generated.types.CardList)).toEqual(
          format(
            `export type CardList = {
  cards: Card[]
}`
          )
        )
      })
      it('generates docs', () => {
        const generated = generateBaseData({ schema })

        expect(format(generated.types.Documented)).toEqual(
          format(`/**
 * A documented type
 */
export type Documented = {
  /**
   * The id of the documented type
   */
  id: string
  /**
   * Settings
   */
  settings?: CardSettings
}`)
        )
      })
    })
    describe('paths', () => {
      it('rewrites urls', () => {
        const generated = generateBaseData({ schema })

        expect(generated.paths[0].url).toEqual('/:cardId')
      })
      it('sets the correct method', () => {
        const generated = generateBaseData({ schema })
        const getCard = generated.paths[0]

        expect(getCard.method).toEqual('get')
      })
      it('finds all methods', () => {
        const generated = generateBaseData({ schema })
        const deleteCard = generated.paths[1]

        expect(deleteCard.url).toEqual('/:cardId')
        expect(deleteCard.method).toEqual('delete')
      })
      it('generates parameters', () => {
        const generated = generateBaseData({ schema })
        const getCard = generated.paths[0]

        expect(getCard.requestParams).toEqual('{cardId: string}')
      })
      it('generates query', () => {
        const generated = generateBaseData({ schema })
        const getCard = generated.paths[0]

        expect(getCard.requestQuery).toEqual('{cardNickname: boolean}')
      })
      it('generates headers', () => {
        const generated = generateBaseData({ schema })
        const getCard = generated.paths[0]

        expect(getCard.requestHeaders).toEqual(
          "{'X-User-Id': string, 'X-Distributor-Id'?: string}"
        )
      })
      it('generates body', () => {
        const generated = generateBaseData({ schema })
        const putCardSettings = generated.paths[2]

        expect(putCardSettings.requestBody).toEqual('CardSettings')
      })
      it('generates response', () => {
        const generated = generateBaseData({ schema })
        const getCard = generated.paths[0]

        expect(getCard.response).toEqual('[200, Card]')
      })
      it('generates errorResponse', () => {
        const generated = generateBaseData({ schema })
        const getCard = generated.paths[0]

        expect(getCard.errorResponse).toEqual('[401, HttpError]')
      })
    })
  })
  describe('generateRoutesDefinition', () => {
    it('generates a RoutesDefinition', () => {
      const generated = generateBaseData({ schema })
      const map = generateRoutesDefinition(generated.paths)

      expect(map).toEqual({
        get: {
          '/:cardId':
            "TypedRoute<{cardId: string}, {cardNickname: boolean}, {'X-User-Id': string, 'X-Distributor-Id'?: string}, never, [200, Card], [401, HttpError]>",
        },
        put: {
          '/:cardId/settings':
            "TypedRoute<{cardId: string}, never, {'x-forwarded-authorization': string}, CardSettings, [204, void], never>",
        },
        delete: {
          '/:cardId':
            'TypedRoute<{cardId: string}, {cardNickname: boolean}, never, never, [200, Card], never>',
        },
      })
    })
  })
  describe('generate', () => {
    it('generates a correct document', () => {
      const generated = generate({ schema })
      const expected = `/**
 * This file was auto-generated.
 * Do not make direct changes to the file.
 */

/* tslint:disable */
/* eslint-disable */

export type Card = {
  id: string
  ownerId: string
  nameOnCard: string
  settings?: CardSettings
}

export type CardSettings = {
  cardId: string
  frozen: {
    value: boolean
    editableByChild: boolean
  }
}

export type CardList = {
  cards: Card[]
}

/**
 * A documented type
 */
export type Documented = {
  /**
   * The id of the documented type
   */
  id: string
  /**
   * Settings
   */
  settings?: CardSettings
}

export type HttpError = {
  message: string
  stack?: string
}

type TypedRoute<RequestParams, RequestQuery, RequestHeaders, RequestBody, Response, ErrorResponse> = {
  requestParams: RequestParams
  requestQuery: RequestQuery
  requestHeaders: RequestHeaders
  requestBody: RequestBody
  response: Response
  error: ErrorResponse
}

export type Cards_APIRoutesDefinition = {
  get: {
    '/:cardId': TypedRoute<{cardId: string}, {cardNickname: boolean}, {'X-User-Id': string, 'X-Distributor-Id'?: string}, never, [200, Card], [401, HttpError]>,
  },
  delete: {
    '/:cardId': TypedRoute<{cardId: string}, {cardNickname: boolean}, never, never, [200, Card], never>,
  },
  put: {
    '/:cardId/settings': TypedRoute<{cardId: string}, never, {'x-forwarded-authorization': string}, CardSettings, [204, void], never>,
  },
}
`
      expect(format(generated)).toEqual(format(expected))
    })
  })
})
