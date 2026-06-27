import { useState } from 'react'

const faqs = [
  {
    question: 'Who can file using ITRGenie?',
    answer: 'Any individual with income from salary, business, capital gains, or other sources can file. Our experts cover all ITR forms (ITR-1 to ITR-7).',
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use 256‑bit encryption and comply with all data protection regulations. Your financial data is never stored without your explicit consent.',
  },
  {
    question: 'What if I make a mistake?',
    answer: 'You can make corrections via a revised return. Our experts will guide you through the process free of charge if you filed with us.',
  },
  {
    question: 'Which ITR form should I use?',
    answer: 'Our system automatically recommends the correct form based on your income sources. You’ll also get expert confirmation during the session.',
  },
  {
    question: 'What is the difference between Old and New Tax Regime?',
    answer: 'The Old Regime allows many deductions (like 80C, 80D) but has higher tax rates. The New Regime has lower rates but fewer deductions. Our calculator helps you pick the best one.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggle(index)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition"
              >
                <span className="font-medium text-gray-800">{faq.question}</span>
                <i className={`fas ${openIndex === index ? 'fa-chevron-up' : 'fa-chevron-down'} text-gray-500`}></i>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 text-gray-600">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
