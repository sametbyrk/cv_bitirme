
import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
            <h2 className="text-4xl font-extrabold text-blue-600 mb-4">404</h2>
            <p className="text-xl text-gray-900 font-bold mb-2">Page Not Found</p>
            <p className="text-gray-500 mb-8 max-w-md">
                The page you are looking for doesn't exist or has been moved.
            </p>
            <Link
                href="/"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
                Return Home
            </Link>
        </div>
    )
}
