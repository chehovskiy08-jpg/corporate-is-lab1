import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { orderingOptions } from '../lib/catalogParams'

const SEARCH_DELAY = 300

export default function Filters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const searchTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(searchTimer.current), [])

  function update(name: string, value: string) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(name, value)
        else next.delete(name)
        next.delete('page')
        return next
      },
      { replace: name === 'q' },
    )
  }

  function handleSearch(value: string) {
    setQuery(value)
    window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => update('q', value.trim()), SEARCH_DELAY)
  }

  return (
    <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
      <label>
        Поиск
        <input type="search" value={query} onChange={(e) => handleSearch(e.target.value)} />
      </label>
      <label>
        Цена от
        <input
          type="number"
          min={0}
          defaultValue={searchParams.get('price_min') ?? ''}
          onBlur={(e) => update('price_min', e.target.value)}
        />
      </label>
      <label>
        до
        <input
          type="number"
          min={0}
          defaultValue={searchParams.get('price_max') ?? ''}
          onBlur={(e) => update('price_max', e.target.value)}
        />
      </label>
      <label className="inline">
        <input
          type="checkbox"
          checked={searchParams.get('in_stock') === 'true'}
          onChange={(e) => update('in_stock', e.target.checked ? 'true' : '')}
        />
        В наличии
      </label>
      <label className="inline">
        <input
          type="checkbox"
          checked={searchParams.get('on_sale') === 'true'}
          onChange={(e) => update('on_sale', e.target.checked ? 'true' : '')}
        />
        Со скидкой
      </label>
      <label>
        Сортировка
        <select
          value={searchParams.get('ordering') ?? ''}
          onChange={(e) => update('ordering', e.target.value)}
        >
          {orderingOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </form>
  )
}
