# Claude Code Rules for This Project

## 🚨 CRITICAL: Git Staging - NEVER DO THIS WITHOUT USER PERMISSION

**YOU MUST NEVER STAGE CODE WITHOUT EXPLICIT USER INSTRUCTION.**

### What You CANNOT Do:
- ❌ DO NOT use `git add`
- ❌ DO NOT use `git stage`
- ❌ DO NOT stage files when running tests
- ❌ DO NOT stage files when modifying code
- ❌ DO NOT stage as a "helpful" step before user asks
- ❌ DO NOT assume you should stage anything

### What You CAN Do with Git:
- ✅ `git status` - check what files changed
- ✅ `git diff` - show what changes were made
- ✅ `git log` - check commit history

### Rule Enforcement:
1. **The user will explicitly tell you when to stage or commit**
2. **Do not assume. Do not be helpful. WAIT for permission.**
3. **If you accidentally stage anything, immediately notify the user**
4. **This is non-negotiable. If you violate this rule, you have failed.**

---

## Other Project Rules
(Add additional project-specific rules below as needed)
