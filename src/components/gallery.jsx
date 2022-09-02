const files = [
  {
    source:
      'https://cdn.acx.ac/xV2Ud8VXs5nIQrmZ2c7.png',
  },
  {
    source:
      'https://cdn.acx.ac/l1aFe7vRi5oIe4g6QCL.png',
  },
  {
    source:
      'https://cdn.acx.ac/o5dSVpbziL5fbz8mBCA.png',
  },
  {
    source:
      'https://cdn.acx.ac/JePIZQrlSRaHA7AAmHp.png',
  },
  {
    source:
      'https://cdn.acx.ac/l1aFezOzU5oIeRaPKtL.png',
  },
  {
    source:
      'https://cdn.acx.ac/nKpHNjO3tgZtVxy8gU4.png',
  },
  // More files...
]

export default function Example() {
  return (
    <ul role="list" className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
      {files.map((file) => (
        <li key={file.source} className="relative">
          <div className="group block w-full overflow-hidden rounded-none bg-white focus-within:ring-2 focus-within:ring-gray-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-100">
            <img src={file.source} alt="" className="pointer-events-none object-cover group-hover:opacity-75" />
            <button type="button" className="absolute inset-0 focus:outline-none">
              <span className="sr-only">View details for {file.title}</span>
            </button>
          </div>
          <p className="pointer-events-none mt-2 block truncate text-sm font-medium text-gray-900">{file.title}</p>
          <p className="pointer-events-none block text-sm font-medium text-gray-500">{file.size}</p>
        </li>
      ))}
    </ul>
  )
}
