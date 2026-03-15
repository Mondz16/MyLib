import {useState, useEffect, useContext, createContext, type ReactNode} from 'react';

interface User{
    id: string,
    email: string,
    username: string,
}

interface AuthContextType{
    user: User | null;
    token : string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: ReactNode}){
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const savedToken = localStorage.getItem('mylib_token');
        const savedUser = localStorage.getItem('mylib_user');
        if(savedUser && savedToken){
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('mylib_token', newToken);
        localStorage.setItem('mylib_user', JSON.stringify(newUser));
    }

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('mylib_token');
        localStorage.removeItem('mylib_user');
    }

    return (
        <AuthContext.Provider value={{user, token, login, logout, isAuthenticated: !!token}}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(){
    const context = useContext(AuthContext);
    if(!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
