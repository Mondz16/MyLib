import { useEffect, useState } from "react";
import API from "../services/api";

interface BookModalProp {
  book: {
    key: string;
    title: string;
    authors: string[];
    coverUrl?: string;
  } | null;
  onClose: () => void;
}

interface BookDetail {
  description: string;
}

export default function BookModal({ book, onClose }: BookModalProp) {
  const [detail, setDetail] = useState<BookDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!book) {
      setDetail(null);
      return;
    }

    const olid = book.key.replace("/works/", "");
    setLoadingDetail(true);
    API.get(`/books/${olid}`)
      .then((res) => setDetail(res.data))
      .catch(() => setDetail({ description: "No description available." }))
      .finally(() => setLoadingDetail(false));
  }, [book]);

  if (!book) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-800">{book.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-32 rounded-lg mb-4"
          />
        ) : (
          <div className="w-24 h-36 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-3xl">📖</span>
          </div>
        )}
        <p className="text-gray-500 text-sm">{book.authors.join(", ")}</p>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Description
        </h3>
        {loadingDetail ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            Loading details...
          </div>
        ) : (
          <p className="text-gray-600 text-sm leading-relaxed">
            {detail?.description || "No description available."}
          </p>
        )}
      </div>
      </div>
    </div>
  );
}
