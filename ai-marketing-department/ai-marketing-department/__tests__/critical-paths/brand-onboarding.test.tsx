import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrandOnboardingChoice } from "@/components/brand/BrandOnboardingChoice";

describe("Brand Onboarding — Critical Path", () => {
  it("renders both onboarding options", () => {
    render(
      <BrandOnboardingChoice onUpload={vi.fn()} onManual={vi.fn()} />
    );

    expect(screen.getByText("Importar desde assets")).toBeInTheDocument();
    expect(screen.getByText("Completar manualmente")).toBeInTheDocument();
    expect(screen.getByText("Configura tu marca")).toBeInTheDocument();
  });

  it("calls onUpload when 'Import from assets' is clicked", async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn();
    render(<BrandOnboardingChoice onUpload={onUpload} onManual={vi.fn()} />);

    await user.click(screen.getByText("Importar con IA"));
    expect(onUpload).toHaveBeenCalledOnce();
  });

  it("calls onManual when 'Fill manually' is clicked", async () => {
    const user = userEvent.setup();
    const onManual = vi.fn();
    render(<BrandOnboardingChoice onUpload={vi.fn()} onManual={onManual} />);

    await user.click(screen.getByText("Comenzar wizard"));
    expect(onManual).toHaveBeenCalledOnce();
  });

  it("displays description text for both paths", () => {
    render(
      <BrandOnboardingChoice onUpload={vi.fn()} onManual={vi.fn()} />
    );

    expect(
      screen.getByText(/Sube tu web, documentos o logo/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Llena paso a paso la información/)
    ).toBeInTheDocument();
  });
});
