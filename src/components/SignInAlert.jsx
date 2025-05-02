/* This example requires Tailwind CSS v2.0+ */
import SignIn from "./SignIn";

export default function SignInAlert() {
  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Authentication Required</h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>
            To access this content, please sign in. New users will need an invite code to register.
          </p>
        </div>
        <div className="mt-5">
          <SignIn 
            label="Sign in" 
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          />
        </div>
      </div>
    </div>
  )
}