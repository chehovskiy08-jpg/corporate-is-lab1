import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router'
import { categoriesQuery } from '../api/queries'
import { buildCategoryTree, type CategoryNode } from '../lib/categoryTree'

function CategoryItem({ node, active }: { node: CategoryNode; active: string | null }) {
  return (
    <li>
      <Link
        to={`/?category=${encodeURIComponent(node.slug)}`}
        className={node.slug === active ? 'active' : undefined}
        aria-current={node.slug === active ? 'page' : undefined}
      >
        {node.name}
      </Link>
      {node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <CategoryItem key={child.id} node={child} active={active} />
          ))}
        </ul>
      )}
    </li>
  )
}

export default function CategoryNav() {
  const { data, isPending, isError } = useQuery(categoriesQuery())
  const [searchParams] = useSearchParams()
  const active = searchParams.get('category')

  if (isPending) return <p className="muted">Категории...</p>
  if (isError) return <p className="error">Не удалось загрузить категории</p>

  return (
    <nav aria-label="Категории">
      <ul className="categories">
        <li>
          <Link to="/" className={active ? undefined : 'active'}>
            Все товары
          </Link>
        </li>
        {buildCategoryTree(data).map((node) => (
          <CategoryItem key={node.id} node={node} active={active} />
        ))}
      </ul>
    </nav>
  )
}
