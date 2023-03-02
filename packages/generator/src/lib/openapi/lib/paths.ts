import {
  generateFromSchemaObject,
  parseRefString,
} from '../../shared/schemaParser'
import { AddImportFn, Import, ReferenceObject } from '../../shared/types'
import {
  HttpVerb,
  ParameterObject,
  PathItemObject,
  RequestBody,
  ResponseObject,
  Route,
} from './types'

export const pathGenerator = (
  globalParameters: Record<string, ParameterObject>
) => {
  const expressifyPath = (path: string): string =>
    path.replace(/{/g, ':').replace(/}/g, '')

  const parseResponse = (
    response: ResponseObject,
    addImports: AddImportFn
  ): string => {
    const schema = response.content?.['application/json']?.schema

    if (!schema) return ''
    return generateFromSchemaObject(schema, addImports)
  }

  const getType = (param: ParameterObject): string => {
    if (param.type) param.type
    if (param.schema) {
      if ('type' in param.schema) return param.schema.type
    }
    return 'any'
  }

  const propName = (name: string): string => {
    if (name.indexOf('-') === -1) return name
    return `'${name}'`
  }

  const generateProps = (
    params: Array<ReferenceObject | ParameterObject>,
    filter:
      | 'query'
      | 'header'
      | 'path'
      | /* V3 */ 'cookie'
      | /* V2 */ 'formData'
      | /* V2 */ 'body'
  ): string => {
    const props = params
      .map((it) => {
        if ('$ref' in it) {
          return globalParameters[it.$ref]
        } else {
          return it
        }
      })
      .filter((p) => p.in === filter)
      .map((p) => `${propName(p.name)}${p.required ? '' : '?'}: ${getType(p)}`)

    if (props.length) return `{${props.join(', ')}}`

    return 'never'
  }

  const generateBody = (body: RequestBody, addImport: AddImportFn): string => {
    if (body?.content?.['application/json']) {
      const content = body.content['application/json']?.schema

      return generateFromSchemaObject(content, addImport)
    }

    return 'never'
  }

  const multipleTypesString = (arr: unknown[]): string =>
    `${arr.filter((i) => i).join(' | ')}`

  const arrString = (arr: unknown[]): string =>
    `[${arr.filter((i) => i).join(', ')}]`

  const generateResponse = (
    responses: Record<string, ReferenceObject | ResponseObject>,
    addImport: AddImportFn,
    errors = false
  ): string => {
    const responseTypes = Object.entries(responses)
      .map(([strCode, response]) => {
        const code = parseInt(strCode, 10)
        if (code >= 400 !== errors) return
        if ('$ref' in response)
          return [code, parseRefString(response.$ref, addImport)]

        return arrString([
          code,
          parseResponse(response as ResponseObject, addImport) || 'void',
        ])
      })
      .filter((r) => r)
    if (responseTypes.length) return multipleTypesString(responseTypes)

    return 'never'
  }

  const generateRoutes = (
    path: string,
    item: PathItemObject,
    addImport: AddImportFn
  ): Route[] => {
    const verbs: HttpVerb[] = ['get', 'post', 'put', 'patch', 'delete']

    const routes: Array<Route | undefined> = verbs.map((verb) => {
      const operation = item[verb]
      if (!operation) return undefined

      return {
        url: expressifyPath(path),
        method: verb,
        requestBody: generateBody(
          operation.requestBody as RequestBody,
          addImport
        ),
        requestParams: generateProps(operation.parameters || [], 'path'),
        requestQuery: generateProps(operation.parameters || [], 'query'),
        requestHeaders: generateProps(operation.parameters || [], 'header'),
        response: generateResponse(operation.responses, addImport),
        errorResponse: generateResponse(operation.responses, addImport, true),
      }
    })

    return routes.filter((r) => r)
  }

  const generatePaths = (
    paths: Record<string, PathItemObject>
  ): [Route[], Import[]] => {
    const imports = [] as Import[]
    const routes = Object.entries(paths).flatMap(([path, item]) =>
      generateRoutes(path, item, (imp) => imports.push(imp))
    )

    return [routes, imports]
  }

  return {
    generate: generatePaths,
  }
}
