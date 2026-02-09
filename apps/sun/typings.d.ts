declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>
  export default content
}

declare module '*.mdx' {
  const MDXComponent: (props: {
    components?: Record<string, React.ComponentType<any>>
  }) => JSX.Element
  export const meta: Record<string, unknown>
  export default MDXComponent
}

declare module '*.md' {
  const MDComponent: (props: {
    components?: Record<string, React.ComponentType<any>>
  }) => JSX.Element
  export const meta: Record<string, unknown>
  export default MDComponent
}

