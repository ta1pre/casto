/**
 * クイックアクション共通コンポーネント
 * [SF][CA][RP] シンプル、クリーンアーキテクチャ、可読性優先
 */

interface QuickActionProps {
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  href?: string
  disabled?: boolean
  variant?: 'default' | 'primary' | 'secondary'
}

export function QuickAction({
  label,
  icon,
  onClick,
  href,
  disabled = false,
  variant = 'default',
}: QuickActionProps) {
  const baseClasses = `
    flex items-center justify-center gap-2 p-4 rounded-lg
    transition-all duration-200
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
  `

  const variantClasses = {
    default: 'border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600',
    primary: 'bg-blue-500 hover:bg-blue-600 text-white border-2 border-blue-500',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-2 border-gray-200',
  }

  const className = `${baseClasses} ${variantClasses[variant]}`

  const content = (
    <>
      {icon && <span className="text-current">{icon}</span>}
      <span className="text-sm font-medium">{label}</span>
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        className={className}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault()
            return
          }
          onClick?.()
        }}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      {content}
    </button>
  )
}
