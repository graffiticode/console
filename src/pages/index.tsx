import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";

export default function Home() {
  const { user } = useGraffiticodeAuth();
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] gap-4">
      <h1 className="text-2xl font-medium text-gray-700">Welcome to Graffiticode</h1>
      <p className="text-sm text-gray-500 text-justify w-1/2">
        Graffiticode is a platform for deploying smart tools for agents and humans.
        Visit our community <a href="https://forum.graffiticode.org" className="text-blue-600 hover:underline">Forum</a> to learn more.
        If you are feeling adventurous go straight to <a href="/tools" className="text-blue-600 hover:underline">Tools</a> to see what you can make with Graffiticode.
        {!user && (
          <>
            <br /><br />
            New here? Create a free account by signing in with an Ethereum wallet. No blockchain fees required. No credit card required.
          </>
        )}
      </p>
    </div>
  )
}
