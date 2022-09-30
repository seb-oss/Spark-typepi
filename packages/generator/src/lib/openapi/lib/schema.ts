import { generatePaths } from './paths'
import { generateTypes } from './schemaTypes'
import { HttpVerb, OpenAPI3, Route } from './types'

export interface GenerateOptions {
  schema: OpenAPI3
}

interface GenerateResult {
  types: Record<string, string>
  paths: Route[]
}

export const generateBaseData = ({ schema }: GenerateOptions): GenerateResult => {
  const types = (schema.components?.schemas)
    ? generateTypes(schema.components.schemas)
    : {}
  
  const paths = generatePaths(schema.paths)

  return { types, paths }
}

export const generateRoutesDefinition = (routes: Route[]): Partial<Record<HttpVerb, Record<string, string>>> => {
  const map: Partial<Record<HttpVerb, Record<string, string>>> = {}
  return routes.reduce((map, { method, requestBody, requestParams, requestQuery, resultBody, url }) => {
    if (!map[method]) map[method] = {}
    map[method][url] = `TypedRoute<${requestParams}, ${resultBody}, ${requestBody}, ${requestQuery}>`
    
    return map
  }, map)
}

const header = `/**
 * This file was auto-generated.
 * Do not make direct changes to the file.
 */

/* tslint:disable */
/* eslint-disable */`

const typedRoute = `type TypedRoute<RequestParams, ResultBody, RequestBody, RequestQuery> = {
  requestParams: RequestParams
  resultBody: ResultBody
  requestBody: RequestBody
  requestQuery: RequestQuery
}`

export const generate = ({ schema }: GenerateOptions): string => {
  const data = generateBaseData({ schema })

  const rows: string[] = [header]

  // types
  Object.values(data.types).forEach((type) => rows.push(type))

  // routes
  const map = generateRoutesDefinition(data.paths)
  rows.push(typedRoute)
  rows.push(
`export type RoutesDefinition = {
${Object.entries(map).map(([method, routes]) => (
`  ${method}: {
${Object.entries(routes).map(([url, type]) => (
`    '${url}': ${type},`
)).join('\n')}
  },`  
)).join('\n')}
}
`
  )


  return rows.join('\n\n')
}
