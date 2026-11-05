export default function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid" aria-busy="true" aria-label="Загрузка товаров">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="card skeleton" />
      ))}
    </div>
  )
}
