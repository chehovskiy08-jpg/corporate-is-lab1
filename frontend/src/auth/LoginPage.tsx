import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { z } from 'zod'
import { applyServerErrors } from '../lib/serverErrors'
import { login } from './session'

const schema = z.object({
  username: z.string().trim().min(1, 'Введите имя пользователя'),
  password: z.string().min(1, 'Введите пароль'),
})
type LoginForm = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next') ?? '/'
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(schema) })

  async function onSubmit(values: LoginForm) {
    try {
      await login(values.username, values.password)
      navigate(next.startsWith('/') ? next : '/', { replace: true })
    } catch (error) {
      applyServerErrors(error, setError, ['username', 'password'])
    }
  }

  return (
    <form className="details narrow form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <h1>Вход</h1>
      <label>
        Имя пользователя
        <input autoComplete="username" aria-invalid={!!errors.username} {...register('username')} />
      </label>
      {errors.username && <p className="error">{errors.username.message}</p>}
      <label>
        Пароль
        <input
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
      </label>
      {errors.password && <p className="error">{errors.password.message}</p>}
      {errors.root && (
        <p className="error" role="alert">
          {errors.root.message}
        </p>
      )}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Входим...' : 'Войти'}
      </button>
      <p>
        Нет учётной записи?{' '}
        <Link to={`/register?next=${encodeURIComponent(next)}`}>Регистрация</Link>
      </p>
    </form>
  )
}
