import Link from 'next/link'

export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-blue-50 to-white py-20 px-4 text-center">
      <div className="max-w-4xl mx-auto">
        <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-4 py-1 rounded-full mb-4">
          #1 ITR Filing Platform
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
          File Your Income Tax Return <br />
          <span className="text-blue-600">in Minutes, Not Hours.</span>
        </h1>
        <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
          Expert-assisted ITR filing with maximum refund guarantee. Start with our free tax calculator.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Link href="#calculator">
            <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition duration-200">
              Calculate Your Tax
            </button>
          </Link>
          <Link href="#filing">
            <button className="px-8 py-3 bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold rounded-lg transition duration-200">
              File with Expert
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}
