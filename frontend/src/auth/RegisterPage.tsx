import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router'
import { z } from 'zod'
import { applyServerErrors } from '../lib/serverErrors'
import { register as registerUser } from './session'

const schema = z
  .object({
    username: z.string().trim().min(3, 'Не короче 3 символов'),
    email: z.string().email('Введите адрес почты'),
    password: z.string().min(8, 'Не короче 8 символов'),
    password2: z.string(),
  })
  .refine((values) => values.password === values.password2, {
    message: 'Пароли не совпадают',
    path: ['password2'],
  })
type RegisterForm = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(schema) })

  async function onSubmit({ username, email, password }: RegisterForm) {
    try {
      await registerUser({ username, email, password })
      const next = searchParams.get('next') ?? '/'
      navigate(next.startsWith('/') ? next : '/', { replace: true })
    } catch (error) {
      applyServerErrors(error, setError, ['username', 'email', 'password'])
    }
  }

  return (
    <form className="details narrow form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <h1>Регистрация</h1>
      <label>
        Имя пользователя
        <input autoComplete="username" {...register('username')} />
      </label>
      {errors.username && <p className="error">{errors.username.message}</p>}
      <label>
        Электронная почта
        <input type="email" autoComplete="email" {...register('email')} />
      </label>
      {errors.email && <p className="error">{errors.email.message}</p>}
      <label>
        Пароль
        <input type="password" autoComplete="new-password" {...register('password')} />
      </label>
      {errors.password && <p className="error">{errors.password.message}</p>}
      <label>
        Пароль ещё раз
        <input type="password" autoComplete="new-password" {...register('password2')} />
      </label>
      {errors.password2 && <p className="error">{errors.password2.message}</p>}
      {errors.root && (
        <p className="error" role="alert">
          {errors.root.message}
        </p>
      )}
      <button type="submit" disabled={isSubmitting}>
        Зарегистрироваться
      </button>
    </form>
  )
}
