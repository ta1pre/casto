"use client"

import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { CircleHelp } from "lucide-react"

import { cn } from "@/shared/lib/utils"

type HelpHintPlacement = "top" | "bottom" | "left" | "right"

type HelpHintProps = {
  title?: ReactNode
  description: ReactNode
  placement?: HelpHintPlacement
  className?: string
  contentClassName?: string
  iconClassName?: string
  triggerLabel?: string
}

const placementStyles: Record<HelpHintPlacement, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 -mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
}

export function HelpHint({
  title,
  description,
  placement = "top",
  className,
  contentClassName,
  iconClassName,
  triggerLabel = "ヘルプを表示",
}: HelpHintProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const descriptionId = useId()

  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("touchstart", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("touchstart", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-flex items-center", className)}
    >
      <button
        type="button"
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-none bg-transparent p-0 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          iconClassName
        )}
        aria-label={triggerLabel}
        aria-expanded={open}
        aria-controls={descriptionId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <CircleHelp className="size-5" aria-hidden="true" />
      </button>

      {open ? (
        <div
          id={descriptionId}
          role="tooltip"
          className={cn(
            "absolute z-50 w-max max-w-[15rem] rounded-lg bg-neutral-900 px-3 py-2 text-sm text-left text-neutral-100 shadow-lg",
            placementStyles[placement],
            contentClassName
          )}
        >
          {title ? (
            <p className="font-semibold text-neutral-50">{title}</p>
          ) : null}
          <div className="leading-snug">{description}</div>
        </div>
      ) : null}
    </div>
  )
}
