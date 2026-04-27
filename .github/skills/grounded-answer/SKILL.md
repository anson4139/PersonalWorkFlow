---
name: grounded-answer
description: |
  Use this skill to format your final response with strict citations.
  Trigger this skill when the user asks for a technical explanation or solution.
  Enforces a "Citation First" policy.
---

# Skill Instructions

## When to use
- When providing code explanations, architectural advice, or debugging help.

## Steps
1.  **Check Context:** Ensure you have read the relevant source files (do not hallucinate).
2.  **Format Response:**
    *   **Answer:** The direct answer to the user's question.
    *   **Evidence:** "Based on [Filename](path) L10-20..."
    *   **Confidence:** (High/Medium/Low) based on evidence strength.
3.  **Constraints:**
    *   Do not invent file paths.
    *   If evidence is missing, state "I cannot find a specific reference for X" instead of guessing.
