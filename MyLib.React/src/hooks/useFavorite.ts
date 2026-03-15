import { useState, useEffect, useCallback } from "react";
import API from "../services/api.ts";
import { useAuth } from "../context/AuthContext.tsx";

interface Book {
  key: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  firstPublishYear?: number;
}

interface Favorite{
    id: number;
    openLibraryKey: string;
    title: string;
    author: string;
    coverUrl: string;
    savedAt: string;
}



export function useFavorite(){
    const [favorites,setFavorites] = useState<Favorite[]>([]);
    const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(new Set());
    const {isAuthenticated} = useAuth();

    const loadFavorites = useCallback(async () => {
        if(!isAuthenticated) return;
        try {
            const response = await API.get('/favorites');
            setFavorites(response.data);
            setFavoriteKeys(new Set(response.data.map((f: Favorite) => f.openLibraryKey)));
        } catch (error) {
            
        }

    },[isAuthenticated]);

    useEffect(() => {
        loadFavorites();
    }, [loadFavorites]);

    const toggleFavorite = async (book: Book) => {
        if(!isAuthenticated) return;

        const isFav = favoriteKeys.has(book.key);

        if(isFav){
            const encodedKey = encodeURIComponent(book.key);
            await API.delete(`/favorites/${encodedKey}`);
            setFavoriteKeys((prev) => {
                const next = new Set(prev);
                next.delete(book.key);
                return next;
            });
            setFavorites((prev) => prev.filter((f) => f.openLibraryKey !== book.key));
        }
        else {
            const response = await API.post('/favorites', {
                openLibraryKey: book.key,
                title: book.title,
                author: book.authors.join(', '),
                coverUrl: book.coverUrl ?? ''
            });
            setFavorites((prev) => [...prev, response.data]);
            setFavoriteKeys((prev) => new Set([...prev, book.key]))
        }
    };

    return { favorites, favoriteKeys, toggleFavorite, loadFavorites}
}