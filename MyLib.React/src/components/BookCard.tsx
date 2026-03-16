interface Book {
  key: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  firstPublishYear?: number;
}

interface BookCardProps {
  book: Book;
  isFavorited?: boolean;
  onClick: () => void;
  onToggleFavorite?: (book: Book) => void;
}

export default function BookCard({
  book,
  isFavorited = false,
  onClick,
  onToggleFavorite,
}: BookCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow" onClick={onClick}>
      <div className="aspect-[2/3] bg-gray-100 relative">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-4xl">📖</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2 mb-1">
          {book.title}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-1">
          {book.authors.join(", ") || "Unknown Author"}
        </p>
        {book.firstPublishYear && (
          <p className="text-xs text-gray-400 mt-1">{book.firstPublishYear}</p>
        )}
        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(book)}
            className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg border transition-colors"
            style={{
              borderColor: isFavorited ? "#ef4444" : "#d1d5db",
              color: isFavorited ? "#ef4444" : "#6b7280",
              backgroundColor: isFavorited ? "#fef2f2" : "transparent",
            }}
          >
            {isFavorited ? "❤️ Saved" : "🤍 Save"}
          </button>
        )}
      </div>
    </div>
  );
}
