import { Link, useSearchParams } from 'react-router'

const PAGE_SIZE = 20

export default function Pagination({ count }: { count: number }) {
  const [searchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')
  const pages = Math.ceil(count / PAGE_SIZE)
  if (pages <= 1) return null

  function hrefFor(target: number) {
    const next = new URLSearchParams(searchParams)
    if (target === 1) next.delete('page')
    else next.set('page', String(target))
    const search = next.toString()
    return search ? `/?${search}` : '/'
  }

  return (
    <nav className="pagination" aria-label="Страницы">
      {Array.from({ length: pages }, (_, index) => index + 1).map((target) => (
        <Link
          key={target}
          to={hrefFor(target)}
          className={target === page ? 'active' : undefined}
          aria-current={target === page ? 'page' : undefined}
        >
          {target}
        </Link>
      ))}
    </nav>
  )
}
