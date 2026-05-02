---
name: slang_manager
description: Manages the custom slang vocabulary dictionary for Aegis.
tools:
  - name: lookup_slang
    description: Retrieves all known slang translations to evaluate messages.
    command: node scripts/lookup.js
  - name: learn_slang
    description: Saves a new slang term and its meaning. Use this when instructed to learn.
    parameters:
      - name: term
        type: string
      - name: meaning
        type: string
    command: node scripts/learn.js "{{term}}" "{{meaning}}"
---
# Instructions
Use `lookup_slang` to understand context before making an Aegis decision. 
Use `learn_slang` if the user explicitly tells you what a word means.