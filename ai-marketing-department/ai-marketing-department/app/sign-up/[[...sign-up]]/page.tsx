import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            AI Marketing Department
          </h1>
          <p className="text-stone-400">
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
              colorPrimary: '#ea580c',
              colorBackground: '#000000',
              colorText: '#ffffff',
              colorInputBackground: '#111111',
              colorInputText: '#ffffff',
            },
            elements: {
              formButtonPrimary: 'bg-orange-600 hover:bg-orange-700 text-white',
              card: 'bg-stone-900 border border-stone-700',
              headerTitle: 'text-white',
              headerSubtitle: 'text-stone-400',
              socialButtonsBlockButton: 'bg-stone-800 border-stone-600 text-stone-200 hover:bg-stone-700',
              formFieldLabel: 'text-stone-300',
              formFieldInput: 'bg-stone-800 border-stone-600 text-white',
              footerActionLink: 'text-orange-500 hover:text-orange-400',
            },
          }}
        />
      </div>
    </div>
  );
}
