import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock useToast before importing the component
vi.mock("@/components/ui/Toast", () => ({
  useToast: vi.fn(() => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  })),
}));

// Mock the Convex generated api module
vi.mock("@convex/_generated/api", () => ({
  api: {
    multiChannelGenerate: {
      generateMultiChannelContent: "multiChannelGenerate:generateMultiChannelContent",
    },
  },
}));

import { GenerateContentModal } from "@/components/content/GenerateContentModal";

describe("Content Creation — Critical Path", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders modal when isOpen is true", () => {
    render(<GenerateContentModal {...defaultProps} />);

    expect(screen.getByText("Generar Contenido")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/tendencias de IA/)).toBeInTheDocument();
  });

  it("does NOT render when isOpen is false", () => {
    render(<GenerateContentModal isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByText("Generar Contenido")).not.toBeInTheDocument();
  });

  it("shows generate button disabled when no topic or channels selected", () => {
    render(<GenerateContentModal {...defaultProps} />);

    const generateButton = screen.getByRole("button", { name: /Generar/ });
    expect(generateButton).toBeDisabled();
  });

  it("allows toggling channel selection", async () => {
    const user = userEvent.setup();
    render(<GenerateContentModal {...defaultProps} />);

    const linkedinBtn = screen.getByRole("button", { name: /LinkedIn/ });
    await user.click(linkedinBtn);

    // After selecting LinkedIn + typing topic, the generate button text should
    // include "1 canal"
    const topicInput = screen.getByPlaceholderText(/tendencias de IA/);
    await user.type(topicInput, "Test topic");

    const generateButton = screen.getByRole("button", { name: /1 canal/ });
    expect(generateButton).toBeEnabled();
  });

  it("renders all 7 channel options", () => {
    render(<GenerateContentModal {...defaultProps} />);

    expect(screen.getByRole("button", { name: /LinkedIn/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Twitter/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Instagram/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /TikTok/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Blog/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Newsletter/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /YouTube/ })).toBeInTheDocument();
  });
});
