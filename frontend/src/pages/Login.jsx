"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { FiMail, FiLock, FiLogIn, FiAlertCircle } from "react-icons/fi"
import logoIndustrias from '../assets/logo-panaderia.jpg';

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await login(formData)

      if (response.user.rol === "admin") {
        navigate("/admin/dashboard")
      } else if (response.user.rol === "repartidor") {
        navigate("/delivery/dashboard")
      } else {
        navigate("/user/dashboard")
      }
    } catch (err) {
      setError(err.message || "Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Panel izquierdo - Decorativo en desktop */}
      <div className="hidden md:flex md:w-1/2 bg-[#1e1e1e] text-white flex-col justify-center items-center p-8">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/20 overflow-hidden">
            <img 
              src={logoIndustrias} 
              alt="Industrias El Ángel" 
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">Industrias El Angel</h1>
          <p className="text-white/70 text-lg mb-8">Sistema interno de administración y gestión</p>

          {/* Información relevante para empleados */}
          <div className="bg-white/10 p-6 rounded-lg text-left mb-6">
            <h3 className="font-medium text-white mb-3 text-lg">Acceso al sistema</h3>
            <ul className="space-y-3 text-white/80">
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Gestione inventarios y pedidos</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Administre usuarios y permisos</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Consulte reportes y estadísticas</span>
              </li>
            </ul>
          </div>

          <div className="text-white/60 text-sm">
            <p>Si tiene problemas para acceder, contacte al</p>
            <p>
              departamento de sistemas: <span className="text-primary">alejandroosorio022@gmail.com</span>
            </p>
          </div>
        </div>
      </div>

      {/* Panel derecho - Formulario de login */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-8 bg-[#f8fafc]">
        <div className="w-full max-w-md">
          {/* Logo para móvil */}
          <div className="md:hidden flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 overflow-hidden">
              <img 
                src={logoIndustrias} 
                alt="Industrias El Ángel Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-2xl font-display font-bold text-center">Industrias El Ángel</h1>
            <p className="text-muted-foreground text-center mt-2">Sistema interno de administración</p>
          </div>

          {/* Encabezado del formulario */}
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-[#1e1e1e] mb-2">Iniciar Sesión</h2>
            <p className="text-muted-foreground">Ingrese sus credenciales para acceder al sistema</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo de email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <FiMail />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="usuario@elangel.com"
                  className="block w-full pl-10 pr-3 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Campo de contraseña */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Contraseña
                </label>
                <a href="#" className="text-sm text-primary hover:text-primary/80 transition-colors">
                  ¿Olvidó su contraseña?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <FiLock />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-start">
                <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Botón de inicio de sesión */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <FiLogIn className="text-lg" />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()} Industrias El Ángel. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </div>
  )
}

