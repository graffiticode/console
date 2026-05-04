# Graffiticode Capability + Policy Execution Model (Revised Informal Spec)

## 0. Goals

- Safely execute AST-based programs across:
  - content languages (e.g., 0166)
  - service languages (e.g., 0158)
- Keep:
  - console/frontend responsible for parsing
  - API service thin
  - compilers focused on language semantics
  - policy centralized but modular
- Guarantee:
  - no unauthorized effects
  - no authority escalation by compilers

---

## 1. System Components

### 1.1 Console / Frontend / MCP

- parse source → AST
- authenticate user/agent (via Auth)
- hold user credentials + service API keys
- initiate execution requests

### 1.2 API Service (thin)

- store tasks
- route AST to language servers
- orchestrate calls between services

### 1.3 Auth Service

- resolves identity (user, tenant, roles)
- issues identity tokens

### 1.4 Grant Service

- resolve policies based on execution context
- compute execution grants
- optionally mint scoped tokens

Grant = mergePolicies(context) ∩ requiredEffects

### 1.5 Policy Store

Policies are stored as a collection of scoped rule fragments.

### 1.6 Language Servers (Compilers)

- receives AST
- performs:
  - capability scan
  - checker
  - transformer

---

## 2. Execution Flow

Console → API Service → Language Server → (optional Grant Service) → checker → transformer

---

## 3. Compiler Pipeline

### 3.1 Input

AST (already parsed upstream)

### 3.2 Capability / Effect Scan

- single traversal
- no type checking
- conservative

### 3.3 Grant Request

if requiredExternalEffects == [] skip

### 3.4 Grant Resolution

- select policies
- merge rules
- apply precedence
- intersect with effects

### 3.5 Checker

- type checking
- semantic validation
- capability resolution
- grant verification

### 3.6 Transformer

- execute AST
- call backend services

---

## 4. Transformer Safety Rules

- no new effects
- enforce grant
- runtime assertions
- no implicit side effects

---

## 5. Language Classes

### Content Languages

- no external effects
- no grant required

### Service Languages

- external effects
- strict enforcement

---

## 6. Policy Model

Policies = collection of scoped fragments

Resolution:
context → select → merge → effective policy

---

## 7. Core Invariants

- Compiler discovers needs
- Grant service provides authority
- No escalation
- Effects ⊆ granted
- No trust in client

---

## 8. Optimization Rules

- skip grant for pure programs
- single grant request
- scan is advisory

---

## 9. Mental Model

Capability scan = what might happen  
Grant service = is it allowed  
Checker = prove it  
Transformer = execute

---

## Summary

Programs are parsed in the frontend, analyzed for effects, authorized via grant service, verified in checker, and executed safely.
