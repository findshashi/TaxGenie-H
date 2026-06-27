import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="text-lg font-bold">ITRGenie</div>
        <div className="flex flex-wrap gap-6 text-sm text-gray-400">
          <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
          <Link href="/contact" className="hover:text-white transition">Contact Us</Link>
        </div>
        <div className="text-sm text-gray-500 mt-4 md:mt-0">
          &copy; {new Date().getFullYear()} ITRGenie. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
