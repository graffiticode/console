import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";

export default function Home() {
  const { user } = useGraffiticodeAuth();
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] gap-4">
      <h1 className="text-2xl font-medium text-gray-700">Welcome to Graffiticode</h1>
      {!user && (
        <p className="text-sm text-gray-500 text-center">
          New here? Create a free account by signing in with an Ethereum wallet.
          <br />
          No blockchain fees required. No credit card required.
        </p>
      )}
    </div>
  )
}
