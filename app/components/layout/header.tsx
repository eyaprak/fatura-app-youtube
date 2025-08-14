import Link from 'next/link'

export default function Header() {
    return (
        <header className="h-16 bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link
                            href="/"
                            className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 rounded-md px-1"
                        >
                            FY
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex space-x-8">
                        <Link
                            href="/"
                            className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2"
                        >
                            Ana Sayfa
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    )
}
