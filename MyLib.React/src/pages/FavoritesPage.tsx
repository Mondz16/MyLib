import BookCard from "../components/BookCard";
import { useFavorite } from "../hooks/useFavorite";

export default function FavoritesPage(){
    const {favorites, favoriteKeys, toggleFavorite} = useFavorite();

    const booksFromFavorites = favorites.map(f => ({
        key: f.openLibraryKey,
        title: f.title,
        authors: [f.author],
        coverUrl: f.coverUrl ?? undefined
    }));

    return (
        <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Favorites</h1>

      {favorites.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🤍</p>
          <p className="text-gray-500 text-lg">You haven't saved any books yet</p>
          <p className="text-gray-400 text-sm mt-2">
            Search for books and click the heart icon to save them here
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {favorites.length} saved {favorites.length === 1 ? 'book' : 'books'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {booksFromFavorites.map((book) => (
              <BookCard
                key={book.key}
                book={book}
                isFavorited={favoriteKeys.has(book.key)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </>
      )}
    </div>
    )
}