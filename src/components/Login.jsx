import { useState } from 'react'
import './Login.css'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Пожалуйста, заполните все поля')
      return
    }

    setIsLoading(true)

    try {
      const isValid = await validateCredentials(username, password)
      
      if (isValid) {
        onLogin(username)
      } else {
        setError('Неверное имя пользователя или пароль')
      }
    } catch (err) {
      setError('Ошибка при авторизации: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const validateCredentials = async (user, pass) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const validUsers = {
      'admin': 'admin123',
      'user': 'user123',
      'manager': 'manager123'
    }
    
    return validUsers[user] === pass
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img 
            src="/logo.png" 
            alt="art crm" 
            className="login-logo"
          />
          <p className="login-subtitle">Войдите в систему для продолжения</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Имя пользователя</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите имя пользователя"
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-login"
            disabled={isLoading}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login

