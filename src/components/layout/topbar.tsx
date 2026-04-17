import { SearchCommand } from './search-command'

export function Topbar({ title }: { title: string }) {
  return (
    <header className="h-14 border-b border-white/10 bg-[#142a50] flex items-center px-4 md:px-6 gap-3 shrink-0">
      <h1 className="text-base md:text-lg font-semibold text-white truncate shrink-0">{title}</h1>
      <div className="flex-1 flex justify-center">
        <SearchCommand />
      </div>
    </header>
  )
}
