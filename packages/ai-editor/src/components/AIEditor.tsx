import React, { useRef, useEffect, useState } from "react";
import { useVisualEditor } from "../hooks/useVisualEditor";

export interface AIEditorProps {
  /**
   * API endpoint for AI operations
   */
  apiEndpoint?: string;
  /**
   * Tenant ID for multi-tenant support
   */
  tenantId: string;
  /**
   * Callback when code is generated
   */
  onCodeGenerated?: (code: string) => void;
}

/**
 * AIEditor - A stateless React library for AI-powered page generation.
 * Takes JSON/Images -> Returns React Code.
 *
 * NEVER imports from CMS or Commerce Backend.
 */
export const AIEditor: React.FC<AIEditorProps> = ({
  apiEndpoint = "/api/ai",
  tenantId,
  onCodeGenerated,
}) => {
  const shadowRootRef = useRef<HTMLDivElement>(null);
  const shadowRootInstanceRef = useRef<ShadowRoot | null>(null);
  const [isDevMode, setIsDevMode] = useState(
    process.env.NODE_ENV === "development"
  );

  useEffect(() => {
    if (!shadowRootRef.current) return;

    // Create shadow DOM for style isolation
    const shadowRoot = shadowRootRef.current.attachShadow({ mode: "open" });
    shadowRootInstanceRef.current = shadowRoot;

    // Inject styles into shadow DOM
    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
    `;
    shadowRoot.appendChild(style);

    // Cleanup
    return () => {
      shadowRoot.innerHTML = "";
      shadowRootInstanceRef.current = null;
    };
  }, []);

  // Use the visual editor hook for click-to-data functionality
  const { selectedElement, clearSelection } = useVisualEditor(
    shadowRootInstanceRef.current,
    {
      enabled: isDevMode,
      onElementSelected: (selected) => {
        if (selected) {
          console.log("Element selected:", selected.sourceLocation);
          // TODO: Show UI for editing the selected component
        }
      },
    }
  );

  const handleImageUpload = async (file: File) => {
    // TODO: Upload to S3 and get URL
    // TODO: Call POST /api/ai/describe with URL
    // TODO: Poll for completion
    console.log("Image upload:", file.name);
  };

  const handleGenerate = async (prompt: string) => {
    // TODO: Send prompt to LLM
    // TODO: Return React component code
    console.log("Generate:", prompt);
  };

  return (
    <div className="ai-editor" data-tenant-id={tenantId}>
      <div ref={shadowRootRef} id="preview-container" />
      <div className="editor-controls">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
          }}
        />
      </div>
    </div>
  );
};

