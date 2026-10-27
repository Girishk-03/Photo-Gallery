import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';

import useFetchPhotos from '../hooks/useFetchPhotos';

const initialFavourites = [];

function favouritesReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_FAVOURITE': {
      const exists = state.includes(action.id);

      if (exists) {
        return state.filter((id) => id !== action.id);
      }

      return [...state, action.id];
    }

    case 'LOAD_FAVOURITES':
      return action.payload;

    default:
      return state;
  }
}

function HeartIcon({ active }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"
      />
    </svg>
  );
}

export default function Gallery() {
  const { photos, loading, error } = useFetchPhotos();

  const [search, setSearch] = useState('');

  const [favourites, dispatch] = useReducer(
    favouritesReducer,
    initialFavourites
  );

  // Load saved favourites when the component mounts.
  useEffect(() => {
    try {
      const saved = localStorage.getItem('photo-gallery-favourites');

      if (saved) {
        const parsed = JSON.parse(saved);

        if (
          Array.isArray(parsed) &&
          parsed.every(
            (id) => typeof id === 'string' || typeof id === 'number'
          )
        ) {
          dispatch({
            type: 'LOAD_FAVOURITES',
            payload: parsed,
          });
        }
      }
    } catch {
      // Ignore invalid localStorage data.
    }
  }, []);

  // Save favourites whenever the list changes.
  useEffect(() => {
    localStorage.setItem(
      'photo-gallery-favourites',
      JSON.stringify(favourites)
    );
  }, [favourites]);

  // Handle search input changes.
  const handleSearch = useCallback((event) => {
    setSearch(event.target.value);
  }, []);

  // Calculate the filtered list.
  const filteredPhotos = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return photos.filter((photo) =>
      photo.author.toLowerCase().includes(keyword)
    );
  }, [photos, search]);

  // Toggle a photo's favourite status.
  const toggleFavourite = (id) => {
    dispatch({
      type: 'TOGGLE_FAVOURITE',
      id,
    });
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div
            className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"
            role="status"
            aria-label="Loading photos"
          />

          <p className="mt-4 text-gray-600">
            Loading photos...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <p className="text-center text-red-600" role="alert">
          Unable to load photos: {error}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Photo Gallery
          </h1>

          <p className="mt-2 text-gray-600">
            Explore photos and save your favourites.
          </p>
        </header>

        <div className="mb-8">
          <label
            htmlFor="photo-search"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Search by author
          </label>

          <input
            id="photo-search"
            type="text"
            placeholder="Enter an author's name..."
            value={search}
            onChange={handleSearch}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            All Photos
          </h2>

          <p className="text-sm text-gray-500">
            {filteredPhotos.length} photos
          </p>
        </div>

        {filteredPhotos.length === 0 ? (
          <p className="rounded-xl bg-white p-8 text-center text-gray-600">
            No photos found for "{search}".
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredPhotos.map((photo) => {
              const isFavourite = favourites.includes(photo.id);

              return (
                <article
                  key={photo.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-lg"
                >
                  <img
                    src={`https://picsum.photos/id/${photo.id}/600/400`}
                    alt={`Photo by ${photo.author}`}
                    loading="lazy"
                    className="h-52 w-full object-cover"
                  />

                  <div className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-800">
                        {photo.author}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Photo ID: {photo.id}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleFavourite(photo.id)}
                      aria-label={
                        isFavourite
                          ? `Remove ${photo.author} from favourites`
                          : `Add ${photo.author} to favourites`
                      }
                      aria-pressed={isFavourite}
                      className={`shrink-0 rounded-full p-2 transition hover:bg-gray-100 ${
                        isFavourite
                          ? 'text-red-500'
                          : 'text-gray-400'
                      }`}
                    >
                      <HeartIcon active={isFavourite} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}