import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
}

export function TableScroll({ children, className = '' }: Props) {
  return <div className={`overflow-x-auto ${className}`.trim()}>{children}</div>
}
