# useVisualEditor Hook

A React hook that implements the "Click-to-Data" mechanism for the AI Editor. This hook enables users to click on elements in the preview and identify their source code location.

## Features

- ✅ Click event interception inside Shadow Root
- ✅ Automatic detection of `data-source-loc` attributes
- ✅ Visual highlighting of selected elements
- ✅ Source location parsing and extraction
- ✅ Development mode only (disabled in production)

## Usage

```tsx
import { useVisualEditor } from "@algedi/ai-editor";

function MyEditor() {
  const shadowRootRef = useRef<ShadowRoot | null>(null);

  const { selectedElement, selectElement, clearSelection } = useVisualEditor(
    shadowRootRef.current,
    {
      enabled: true,
      onElementSelected: (selected) => {
        if (selected) {
          console.log("Selected:", selected.sourceLocation);
          // selected.sourceLocation.file - "components/HeroSection.tsx"
          // selected.sourceLocation.line - 42
          // selected.sourceLocation.column - 15
        }
      },
    }
  );

  return (
    <div>
      {selectedElement && (
        <div>
          Selected: {selectedElement.sourceLocation?.full}
        </div>
      )}
    </div>
  );
}
```

## API

### Parameters

#### `shadowRoot: ShadowRoot | null`
The ShadowRoot containing the preview elements. Pass `null` to disable the hook.

#### `options: UseVisualEditorOptions`

- `enabled?: boolean` - Whether click-to-select is enabled (default: `process.env.NODE_ENV === "development"`)
- `onElementSelected?: (selected: SelectedElement | null) => void` - Callback when an element is selected
- `highlightStyle?: Partial<CSSStyleDeclaration>` - Custom highlight styles

### Returns

```typescript
{
  selectedElement: SelectedElement | null;
  selectElement: (element: HTMLElement) => void;
  clearSelection: () => void;
  enabled: boolean;
}
```

- `selectedElement` - Currently selected element with source location
- `selectElement` - Programmatically select an element
- `clearSelection` - Clear the current selection
- `enabled` - Whether the editor is enabled

## How It Works

1. **Event Interception**: The hook attaches a click listener to the Shadow Root
2. **Element Traversal**: When clicked, it traverses up the DOM tree to find an element with `data-source-loc`
3. **Source Parsing**: Parses the `data-source-loc` attribute (format: `"file.tsx:line:col"`)
4. **Visual Feedback**: Highlights the selected element with an outline
5. **Callback**: Invokes `onElementSelected` with the element and source location

## Data Source Location Format

The `data-source-loc` attribute should follow this format:

```
"path/to/file.tsx:line:column"
```

Example:
```
"components/HeroSection.tsx:42:15"
```

This is typically injected by the build system (Babel/SWC) in development mode.

## Example: Integration with AIEditor

```tsx
import { AIEditor, useVisualEditor } from "@algedi/ai-editor";

function EditorWithSelection() {
  const shadowRootRef = useRef<ShadowRoot | null>(null);
  
  const { selectedElement } = useVisualEditor(shadowRootRef.current, {
    onElementSelected: (selected) => {
      if (selected?.sourceLocation) {
        // Show edit UI
        showEditPanel(selected.sourceLocation);
      }
    },
  });

  const handleRegenerate = async (instruction: string) => {
    if (!selectedElement?.sourceLocation) return;
    
    // Send to LLM for regeneration
    const response = await fetch("/api/ai/regenerate", {
      method: "POST",
      body: JSON.stringify({
        sourceLocation: selectedElement.sourceLocation,
        instruction,
      }),
    });
    
    // Hot-swap the code
    const newCode = await response.json();
    updateComponent(selectedElement.sourceLocation, newCode);
  };

  return (
    <div>
      <AIEditor shadowRootRef={shadowRootRef} />
      {selectedElement && (
        <EditPanel
          sourceLocation={selectedElement.sourceLocation}
          onRegenerate={handleRegenerate}
        />
      )}
    </div>
  );
}
```

## Notes

- The hook only works in development mode by default
- Elements must have `data-source-loc` attributes to be selectable
- The hook automatically cleans up event listeners and highlights on unmount
- Shadow Root isolation ensures styles don't leak between preview and editor

