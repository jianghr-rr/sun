'use client'

import { useMemo } from 'react'
import type { ReactNode, HTMLAttributes } from 'react'
import type { MdxContentComponent } from '../types/narrative'

interface MdxRendererProps {
  Content: MdxContentComponent
  highlightedPlaceId?: string | null
  onPlaceClick?: (placeId: string) => void
  onPlaceHover?: (placeId: string | null) => void
}

interface PlaceProps {
  id: string
  label?: string
  children?: ReactNode
}

export function MdxRenderer({
  Content,
  highlightedPlaceId,
  onPlaceClick,
  onPlaceHover,
}: MdxRendererProps) {
  const components = useMemo(() => {
    const Place = ({ id, label, children }: PlaceProps) => {
      const display = children ?? label ?? id
      const isActive = highlightedPlaceId === id
      return (
        <button
          onClick={() => onPlaceClick?.(id)}
          onMouseEnter={() => onPlaceHover?.(id)}
          onMouseLeave={() => onPlaceHover?.(null)}
          className={`place-tag ${isActive ? 'place-tag-active' : ''}`}
          title={`点击查看 ${label || id} 在地图上的位置`}
        >
          {display}
        </button>
      )
    }

    return {
      p: (props: HTMLAttributes<HTMLParagraphElement>) => (
        <p className="reading-paragraph" {...props} />
      ),
      Place,
    }
  }, [highlightedPlaceId, onPlaceClick, onPlaceHover])

  return <Content components={components} />
}

