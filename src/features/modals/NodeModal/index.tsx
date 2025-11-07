import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, Textarea, ScrollArea, Flex, Group, Button, CloseButton } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import type { NodeData } from "../../../types/graph";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../store/useFile";

// return object from json removing array and object fields
const normalizeNodeData = (nodeRows: NodeData["text"]) => {
  if (!nodeRows || nodeRows.length === 0) return "{}";
  if (nodeRows.length === 1 && !nodeRows[0].key) return `${nodeRows[0].value}`;

  const obj = {};
  nodeRows?.forEach(row => {
    if (row.type !== "array" && row.type !== "object") {
      if (row.key) obj[row.key] = row.value;
    }
  });
  return JSON.stringify(obj, null, 2);
};

// return json path in the format $["customer"]
const jsonPathToString = (path?: NodeData["path"]) => {
  if (!path || path.length === 0) return "$";
  const segments = path.map(seg => (typeof seg === "number" ? seg : `"${seg}"`));
  return `$[${segments.join("][")}]`;
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const { selectedNode: nodeData } = useGraph();
  const { contents, setContents } = useFile();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [[replaceNode, replaceText], setReplace] = useState<[NodeData | null, string]>([null, ""]);
  const code = replaceNode == nodeData ? replaceText : normalizeNodeData(nodeData?.text ?? []);

  const edit = () => {
    setEditing(true);
    setDraft(code);
  };

  const cancel = () => {
    setEditing(false);
  };

  const save = () => {
    setEditing(false);
    try {
      const data = JSON.parse(contents);
      let object = data;
      for (const segment of nodeData!.path!.slice(0, nodeData!.path!.length - 1)) object = object[segment];
      object[nodeData!.path![nodeData!.path!.length - 1]] = JSON.parse(draft);
      setContents({ contents: JSON.stringify(data, null, 2) });
      setReplace([nodeData, draft]);
    } catch (e) {}
  };

  return (
    <Modal size="auto" opened={opened} onClose={onClose} centered withCloseButton={false}>
      <Stack pb="sm" gap="sm">
        <Stack gap="xs">
          <Flex justify="space-between" align="center">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            <Group gap="xs">
              {editing ? (
                <>
                  <Button color="green" onClick={save}>
                    Save
                  </Button>
                  <Button color="red" onClick={cancel}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={edit}>
                  Edit
                </Button>
              )}
              <CloseButton onClick={onClose} />
            </Group>
          </Flex>
          {editing ? (
            <Textarea
              value={draft}
              onChange={ev => setDraft(ev.currentTarget.value)}
              miw={350}
              maw={600}
              autosize
              styles={{ input: { fontFamily: "monospace" } }}
            />
          ) : (
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight
                code={code}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            </ScrollArea.Autosize>
          )}
        </Stack>
        <Text fz="xs" fw={500}>
          JSON Path
        </Text>
        <ScrollArea.Autosize maw={600}>
          <CodeHighlight
            code={jsonPathToString(nodeData?.path)}
            miw={350}
            mah={250}
            language="json"
            copyLabel="Copy to clipboard"
            copiedLabel="Copied to clipboard"
            withCopyButton
          />
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
};
