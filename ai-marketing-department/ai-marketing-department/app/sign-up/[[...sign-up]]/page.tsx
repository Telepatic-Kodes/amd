import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            AI Marketing Department
          </h1>
          <p className="text-[var(--text-tertiary)]">
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
              formButtonPrimary: 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white',
              card: 'bg-[var(--surface-3)] border border-[var(--border)]',
              headerTitle: 'text-white',
              headerSubtitle: 'text-[var(--text-tertiary)]',
              socialButtonsBlockButton: 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-2)]',
              formFieldLabel: 'text-[var(--text-tertiary)]',
              formFieldInput: 'bg-[var(--surface-2)] border-[var(--border)] text-white',
              footerActionLink: 'text-orange-500 hover:text-[var(--accent)]',
            },
          }}
        />
      </div>
    </div>
  );
}
