import { CastoLogo } from "./CastoLogo"

export function SimpleHeader() {
  return (
    <header className="bg-background border-b border-border">
      <div className="px-4 py-4 flex items-center justify-center">
        <CastoLogo />
      </div>
    </header>
  )
}
