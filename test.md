---
name: safe-file-reader
description: Read files without making changes. Use when you need read-only file access.
allowed-tools: Read, Grep, Glob
---

# Safe File Reader

This skill provides **read-only file access** and should be used whenever a task requires inspecting files without modifying them.

## Instructions

1. Use **Read** to view file contents.
2. Use **Grep** to search within files.
3. Use **Glob** to find files by pattern.

## Constraints

- Do NOT modify files.
- Do NOT write new files.
- Do NOT delete files.

## Example Use Cases

- Inspecting configuration files
- Searching logs for specific errors
- Reviewing documentation files

