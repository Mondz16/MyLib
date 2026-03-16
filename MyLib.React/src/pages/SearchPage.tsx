import { useState, useEffect, useCallback } from "react";
import API from "../services/api.ts";
import BookCard from "../components/BookCard";
import {useFavorite} from "../hooks/useFavorite.ts";
import { useAuth } from "../context/AuthContext.tsx";
import { useNavigate } from "react-router-dom";
import BookModal from "../components/BookModal.tsx";

interface Book {
  key: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  firstPublishYear?: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalResults, setTotalResults] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const {favoriteKeys, toggleFavorite } = useFavorite();
  const [page,setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const {isAuthenticated} = useAuth();
  const navigate = useNavigate();

  const searchBooks = useCallback(async (searchQuery: string, pageNum: number) => {
    if (!searchQuery.trim()) {
      setBooks([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError("");
    setHasSearched(true);
    try {
      const response = await API.get("/books/search", {
        params: { q: searchQuery, page: pageNum},
      });
      if(page == 1){
        setBooks(response.data.books);
      }
      else {
        setBooks((prev) => [...prev, response.data.books]);
      }
      setHasMore(response.data.books.length === 20);
      setTotalResults(response.data.totalResult);
      console.log(books);
    } catch (error) {
      setError("Failed to fetch books! Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFavoriteAttempt = (book : Book) => {
    if(!isAuthenticated){
      navigate('/login');
      return;
    }

    toggleFavorite(book);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      searchBooks(query, page);
    }, 500);

    return () => clearTimeout(timer);
  }, [query, searchBooks]);

  return (
    <div>
      <div className="max-w-2xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">
          Find Your Next Book
        </h1>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or author..."
          className="w-full border border-gray-300 rounded-xl px-5 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-500">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p>Searching books...</p>
        </div>
      )}

      {error && <div className="text-center py-8 text-red-500">{error}</div>}

      {!loading && hasSearched && books.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-500">No books found for "{query}"</p>
          <p className="text-gray-400 text-sm mt-1">
            Try a different search term
          </p>
        </div>
      )}

      {!hasSearched && (
        <div className="text-center py-12">
          <p className="text-5xl mb-4">📚</p>
          <p className="text-gray-400">
            Start typing to search millions of books
          </p>
        </div>
      )}

      {books.length > 0 && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Found {totalResults.toLocaleString()} results
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {books.map((book) => (
              <BookCard key={book.key} book={book} isFavorited={favoriteKeys.has(book.key)} onClick={() => setSelectedBook(book)} onToggleFavorite={handleFavoriteAttempt} />
            ))}
          </div>
        </>
      )}

      {selectedBook && (
            <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}

      {hasMore && !loading && (
        <div className="text-center mt-8">
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
