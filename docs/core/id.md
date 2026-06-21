# ID Module

## Purpose

The ID module provides utilities for generating unique identifiers.

## Why?

Many accessible components require IDs to connect related elements.

Examples:

• label ↔ input
• error message ↔ input
• dialog ↔ heading
• description ↔ control

Generating IDs manually is error-prone.

The ID module provides simple and predictable ID generation.

## API

## createId

Creates a unique ID.

createId();
createId("dialog");

Examples:

af-1
af-2
dialog-3

## Principles

• Simple
• Predictable
• Framework independent
• No dependencies