import prettier = require('prettier')

const header = `/**
  * This file was auto-generated.
  * Do not make direct changes to the file.
  */
 
 /* tslint:disable */
 /* eslint-disable */`

export const formatFile = (rows: string[]) => {
  const withHeader = [header, ...rows]
  return prettier.format(withHeader.join('\n\n'), {
    parser: 'typescript',
    singleQuote: true,
    semi: false,
  })
}

export const formatTitle = (title: string) => {
  return title.replace(/ /g, '').replace(/[^a-zA-Z0-9]/g, '_')
}
