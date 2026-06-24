import { Link, useLocation } from 'react-router-dom'
import { useUserData } from '../context/UserDataContext'
import FlameIcon from './FlameIcon'

export default function TopBar() {
  const { profile } = useUserData()
  const location = useLocation()
  const onProfile = location.pathname === '/profile'

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-sm text-[#f4efe4]">
            ✦
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">Brilliant</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-sm font-semibold text-streak">
            <FlameIcon className="h-3.5 w-3.5" />
            <span>{profile?.streak.current ?? 0}</span>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-sm font-semibold text-gold">
            <span>★</span>
            <span>{profile?.xp ?? 0}</span>
          </div>
          {!onProfile && (
            <Link
              to="/profile"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm font-bold text-[#f4efe4]"
            >
              {(profile?.displayName ?? 'L').charAt(0).toUpperCase()}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
