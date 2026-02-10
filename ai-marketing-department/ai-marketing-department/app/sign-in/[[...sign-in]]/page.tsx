import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
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

        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
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
              card: 'bg-stone-100 border border-stone-200',
              headerTitle: 'text-white',
              headerSubtitle: 'text-stone-400',
              socialButtonsBlockButton: 'bg-stone-200 border-stone-300 text-white hover:bg-stone-100',
              formFieldLabel: 'text-stone-300',
              formFieldInput: 'bg-stone-200 border-stone-300 text-white',
              footerActionLink: 'text-orange-500 hover:text-orange-400',
            },
          }}
        />
      </div>
    </div>
  );
}
