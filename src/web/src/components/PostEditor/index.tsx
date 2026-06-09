import { FC, useCallback, useMemo } from "react";
import isHotkey from "is-hotkey";
import {
  Editable,
  withReact,
  useSlate,
  Slate,
  RenderElementProps,
  RenderLeafProps,
} from "slate-react";
import {
  Editor,
  Transforms,
  createEditor,
  Descendant,
  Element as SlateElement,
} from "slate";
import { withHistory } from "slate-history";

import { Button, Icon, Toolbar } from "./components/index";
import { Text } from "@/ui";
import {
  BlockElementTypes,
  CustomEditor,
  CustomElement,
  ElementTypes,
} from "./types";

const HOTKEYS: { [name: string]: string } = {
  "mod+b": "bold",
  "mod+i": "italic",
  "mod+u": "underline",
  "mod+`": "code",
};

const LIST_TYPES = [ElementTypes.numbered_list, ElementTypes.bulleted_list];
const TEXT_ALIGN_TYPES = [
  ElementTypes.left,
  ElementTypes.center,
  ElementTypes.right,
  ElementTypes.justify,
];

export interface PostEditorProps {
  value: Descendant[];
  onChange?: (value: Descendant[]) => void;
  readOnly?: boolean;
}

export const PostEditor: FC<PostEditorProps> = ({
  value,
  onChange,
  readOnly = false,
}) => {
  const renderElement = useCallback(
    (props: RenderElementProps) => <Element {...props} />,
    []
  );
  const renderLeaf = useCallback(
    (props: RenderLeafProps) => <Leaf {...props} />,
    []
  );
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  return (
    <Slate
      editor={editor}
      value={value}
      onChange={(value) => {
        const isAstChange = editor.operations.some(
          (op: any) => "set_selection" !== op.type
        );
        if (isAstChange) {
          // Save the value to Local Storage.
          if (onChange) onChange(value);
        }
      }}
    >
      <Toolbar readOnly={readOnly}>
        <MarkButton format="bold" icon="format_bold" />
        <MarkButton format="italic" icon="format_italic" />
        <MarkButton format="underline" icon="format_underlined" />
        <MarkButton format="code" icon="code" />
        <BlockButton format={ElementTypes.heading_one} icon="looks_one" />
        <BlockButton format={ElementTypes.heading_two} icon="looks_two" />
        <BlockButton format={ElementTypes.block_quote} icon="format_quote" />
        <BlockButton
          format={ElementTypes.numbered_list}
          icon="format_list_numbered"
        />
        <BlockButton
          format={ElementTypes.bulleted_list}
          icon="format_list_bulleted"
        />
        <BlockButton format={ElementTypes.left} icon="format_align_left" />
        <BlockButton format={ElementTypes.center} icon="format_align_center" />
        <BlockButton format={ElementTypes.right} icon="format_align_right" />
        <BlockButton
          format={ElementTypes.justify}
          icon="format_align_justify"
        />
      </Toolbar>
      <Editable
        readOnly={readOnly}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        placeholder="Enter some rich text…"
        spellCheck
        autoFocus
        onKeyDown={(event) => {
          for (const hotkey in HOTKEYS) {
            if (isHotkey(hotkey, event as any)) {
              event.preventDefault();
              const mark = HOTKEYS[hotkey];
              toggleMark(editor, mark);
            }
          }
        }}
      />
    </Slate>
  );
};

const toggleBlock = (editor: CustomEditor, format: ElementTypes) => {
  const isActive = isBlockActive(
    editor,
    format,
    TEXT_ALIGN_TYPES.includes(format) ? "align" : "type"
  );
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes(n.type) &&
      !TEXT_ALIGN_TYPES.includes(format),
    split: true,
  });
  let newProperties: Partial<SlateElement>;
  if (TEXT_ALIGN_TYPES.includes(format)) {
    newProperties = {
      align: isActive ? undefined : format,
    };
  } else {
    newProperties = {
      type: isActive ? ElementTypes.paragraph : (format as BlockElementTypes),
    };
  }
  Transforms.setNodes<SlateElement>(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block as CustomElement);
  }
};

const toggleMark = (editor: CustomEditor, format: string) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const isBlockActive = (
  editor: CustomEditor,
  format: ElementTypes,
  blockType = "type"
) => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        (blockType === "type" ? n.type === format : n.align === format),
    })
  );

  return !!match;
};

const isMarkActive = (editor: CustomEditor, format: string) => {
  const marks = Editor.marks(editor);

  switch (format) {
    case "bold":
      return marks?.bold === true;
    case "code":
      return marks?.code === true;
    case "italic":
      return marks?.italic === true;
    case "underline":
      return marks?.underline === true;
    default:
      return false;
  }
};

const Element = ({ attributes, children, element }: RenderElementProps) => {
  const style: { textAlign: any | undefined } = { textAlign: element.align };
  switch (element.type) {
    case ElementTypes.block_quote:
      return (
        <blockquote style={style} {...attributes}>
          {children}
        </blockquote>
      );
    case ElementTypes.bulleted_list:
      return (
        <ul style={style} {...attributes}>
          {children}
        </ul>
      );
    case ElementTypes.heading_one:
      return (
        <h1 style={style} {...attributes}>
          {children}
        </h1>
      );
    case ElementTypes.heading_two:
      return (
        <h2 style={style} {...attributes}>
          {children}
        </h2>
      );
    case ElementTypes.numbered_list:
      return (
        <ol style={style} {...attributes}>
          {children}
        </ol>
      );
    default:
      return (
        <p style={style} {...attributes}>
          {children}
        </p>
      );
  }
};

const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.code) {
    children = <code>{children}</code>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  return (
    <Text component="span" color="secondary" {...attributes}>
      {children}
    </Text>
  );
};

const BlockButton = ({
  format,
  icon,
}: {
  format: ElementTypes;
  icon: string;
}) => {
  const editor = useSlate();
  return (
    <Button
      active={isBlockActive(
        editor,
        format,
        TEXT_ALIGN_TYPES.includes(format) ? "align" : "type"
      )}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleBlock(editor, format);
      }}
    >
      <Icon icon={icon} size={18} />
    </Button>
  );
};

const MarkButton = ({ format, icon }: { format: string; icon: string }) => {
  const editor = useSlate();
  return (
    <Button
      active={isMarkActive(editor, format)}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleMark(editor, format);
      }}
    >
      <Icon icon={icon} size={18} />
    </Button>
  );
};
