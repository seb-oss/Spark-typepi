import { formatFile } from '../shared/format'
import { formatImports, Import } from '../shared/imports'
import { formatParsedTypes, ParsedType, parseTypes } from '../shared/schema'
import { formatRoutes } from './format'
import { parseReferencableObjects } from './parser'
import { pathGenerator } from './paths'
import { OpenAPI3 } from './specification'
import { Route } from './types'

type Data = {
  types: ParsedType[]
  imports: Import[]
  paths: Route[]
  title: string
}

export const generateData = (schema: OpenAPI3): Data => {
  const [types, importsFromTypes] = schema.components?.schemas
    ? parseTypes(schema.components.schemas)
    : [[], []]

  const parameters = parseReferencableObjects(
    'parameters',
    schema.components?.parameters
  )

  const [paths, importsFromPaths] = pathGenerator(parameters).generate(
    schema.paths
  )

  return {
    types,
    paths,
    imports: importsFromPaths.concat(importsFromTypes),
    title: schema.info?.title ?? '',
  }
}

const generateFormattedString = ({ title, imports, paths, types }: Data) => {
  const formattedImports = formatImports(imports)
  const formattedTypes = formatParsedTypes(types)
  const formattedRoutes = formatRoutes(title, paths)

  return formatFile([
    ...formattedImports,
    ...formattedTypes,
    ...formattedRoutes,
  ])
}

export const generateOpenApi = (schema: OpenAPI3) => {
  const data = generateData(schema)
  return generateFormattedString(data)
}
