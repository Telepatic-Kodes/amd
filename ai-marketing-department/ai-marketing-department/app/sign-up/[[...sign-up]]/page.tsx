import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            AI Marketing Department
          </h1>
          <p className="text-zinc-400">
            Departamento de marketing automatizado con 37 agentes de IA
          </p>
        </div>

        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          redirectUrl="/onboarding"
          appearance={{
            variables: {
              colorPrimary: '#3b82f6',
              colorBackground: '#000000',
              colorText: '#ffffff',
              colorInputBackground: '#111111',
              colorInputText: '#ffffff',
            },
            elements: {
              formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
              card: 'bg-zinc-900 border border-zinc-800',
              headerTitle: 'text-white',
              headerSubtitle: 'text-zinc-400',
              socialButtonsBlockButton: 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700',
              formFieldLabel: 'text-zinc-300',
              formFieldInput: 'bg-zinc-800 border-zinc-700 text-white',
              footerActionLink: 'text-blue-500 hover:text-blue-400',
            },
          }}
        />
      </div>
    </div>
  );
}
