import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

export type UserRole =
    | 'IT_ADMINISTRATOR'
    | 'WAREHOUSE_OPERATOR'
    | 'WAREHOUSE_MANAGER'
    | 'REGIONAL_OPS_HEAD'
    | 'FINANCE'
    | 'SALES'
    | 'CLIENT_USER'

export interface AuthUser {
    id: string
    name: string
    email: string
    role: UserRole
    avatarUrl?: string
    clientId?: string
}

interface AuthContextType {
    user: AuthUser | null
    token: string | null
    login: (user: AuthUser, token: string) => void
    logout: () => void
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [token, setToken] = useState<string | null>(null)

    useEffect(() => {
        const storedToken = localStorage.getItem('wocs_token')
        const storedUser = localStorage.getItem('wocs_user')
        if (storedToken && storedUser) {
            setToken(storedToken)
            setUser(JSON.parse(storedUser))
        }

        // Handle OAuth redirect callback: ?token=xxx&user=xxx
        const params = new URLSearchParams(window.location.search)
        const urlToken = params.get('token')
        const urlUser = params.get('user')
        if (urlToken && urlUser) {
            const parsedUser = JSON.parse(decodeURIComponent(urlUser))
            setToken(urlToken)
            setUser(parsedUser)
            localStorage.setItem('wocs_token', urlToken)
            localStorage.setItem('wocs_user', JSON.stringify(parsedUser))
            window.history.replaceState({}, '', window.location.pathname)
        }
    }, [])

    const login = (user: AuthUser, token: string) => {
        setUser(user)
        setToken(token)
        localStorage.setItem('wocs_token', token)
        localStorage.setItem('wocs_user', JSON.stringify(user))
    }

    const logout = () => {
        setUser(null)
        setToken(null)
        localStorage.removeItem('wocs_token')
        localStorage.removeItem('wocs_user')
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
    return ctx
}
