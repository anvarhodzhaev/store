import { useEffect, useState } from 'react'

function Toast({ message, type = 'info' }) {
  const [isHiding, setIsHiding] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHiding(true)
    }, 2400)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`toast toast-${type} ${isHiding ? 'toast-hide' : ''}`}>
      {message}
    </div>
  )
}

export default Toast

