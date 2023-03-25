export default interface DisplayElement {
  value: string
  prompt: string
  component: (props: any) => JSX.Element
}