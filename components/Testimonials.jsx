const testimonials = [
  {
    name: 'Amit Sharma',
    role: 'Freelance Designer',
    text: 'ITRGenie made filing my taxes a breeze. The expert explained everything clearly and I saved ₹15,000 in tax!',
    avatar: 'https://i.pravatar.cc/150?img=1',
  },
  {
    name: 'Priya Patel',
    role: 'Software Engineer',
    text: 'I was always confused between old and new regime. The calculator and live session cleared all my doubts.',
    avatar: 'https://i.pravatar.cc/150?img=5',
  },
  {
    name: 'Rahul Verma',
    role: 'Small Business Owner',
    text: 'Fast, secure, and professional. I got my ITR‑V within minutes. Highly recommended!',
    avatar: 'https://i.pravatar.cc/150?img=3',
  },
]

export default function Testimonials() {
  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          What Our Users Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map(({ name, role, text, avatar }) => (
            <div key={name} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="flex items-center gap-4 mb-4">
                <img src={avatar} alt={name} className="w-12 h-12 rounded-full" />
                <div>
                  <h4 className="font-semibold text-gray-800">{name}</h4>
                  <p className="text-sm text-gray-500">{role}</p>
                </div>
              </div>
              <p className="text-gray-600 italic">“{text}”</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
