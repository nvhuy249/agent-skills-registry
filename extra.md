---
name: api-response-summariser
description: Summarise API responses into concise, human-readable explanations.
allowed-tools: Read
---

# API Response Summariser

This skill helps convert **raw API responses** (JSON or text) into **clear, concise summaries** that are easy to understand by humans.

It should be used when debugging APIs, reviewing logs, or explaining responses to non-technical stakeholders.

## Instructions

1. Read the API response carefully.
2. Identify the main purpose of the response.
3. Highlight key fields, values, and errors.
4. Summarise the response in plain language.

## Constraints

- Do NOT alter the original response data.
- Do NOT infer missing fields.
- Do NOT fabricate values or explanations.

## Example Use Cases

- Debugging failed API requests
- Explaining API responses to product managers
- Reviewing large JSON payloads quickly
