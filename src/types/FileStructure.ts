export default interface FileStructure {
  [key: string]: {
    children: FileStructure
    folder: boolean
    description: string
    url?: string
  }
}