export const formatTitle = (title: string) => {
  return title.replace(/[^a-zA-Z0-9]/g, '_')
}
