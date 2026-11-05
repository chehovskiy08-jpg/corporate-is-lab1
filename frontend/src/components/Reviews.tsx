import { useQuery } from '@tanstack/react-query'
import { reviewsQuery } from '../api/queries'

const dateFormat = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long' })

export default function Reviews({ slug }: { slug: string }) {
  const { data, isPending, isError } = useQuery(reviewsQuery(slug))

  if (isPending) return <p className="muted">Отзывы загружаются...</p>
  if (isError) return <p className="error">Не удалось загрузить отзывы</p>
  if (data.length === 0) return <p className="muted">Отзывов пока нет.</p>

  return (
    <ul className="reviews">
      {data.map((review) => (
        <li key={review.id}>
          <b>{'★'.repeat(review.rating)}</b> {review.author},{' '}
          {dateFormat.format(new Date(review.created_at))}
          <p>{review.text}</p>
        </li>
      ))}
    </ul>
  )
}
