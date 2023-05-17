import prettier = require('prettier')

const header = `/**
  * This file was auto-generated.
  * Do not make direct changes to the file.
  */
 
 /* tslint:disable */
 /* eslint-disable */`

export const formatFile = (rows: string[]) => {
  const withHeader = [header, ...rows]
  try {
    return prettier.format(withHeader.join('\n\n'), {
      parser: 'typescript',
      singleQuote: true,
      semi: false,
    })
  } catch (e) {
    console.error(e)
    console.error(
      'A file has been generated, but it cannot be formatted. Make sure the file is correct!!!'
    )
    return rows.join('\n')
  }
}

export const formatTitle = (title: string) => {
  return title.replace(/ /g, '').replace(/[^a-zA-Z0-9]/g, '_')
}
