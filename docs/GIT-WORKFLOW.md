# Git Workflow & Commands Guide

This guide documents all Git commands used to develop and deploy the RockNDogs application, with practical examples and grep filtering patterns.

---

## Table of Contents

1. [Basic Git Concepts](#basic-git-concepts)
2. [Repository Setup](#repository-setup)
3. [Branch Management](#branch-management)
4. [Making Changes](#making-changes)
5. [Viewing History & Status](#viewing-history--status)
6. [Using Grep with Git](#using-grep-with-git)
7. [Collaboration Workflow](#collaboration-workflow)
8. [Deployment Workflow](#deployment-workflow)
9. [Troubleshooting](#troubleshooting)
10. [Complete Workflow Examples](#complete-workflow-examples)

---

## Basic Git Concepts

### What is Git?

Git is a **version control system** that tracks changes to your code over time. Think of it as:

- A time machine for your code
- A collaboration tool for teams
- A backup system with history

### Key Concepts

**Repository (repo):** A project tracked by Git

```bash
# Check if current directory is a git repo
git status
```

**Commit:** A snapshot of your code at a point in time

- Like saving your game progress
- Has a unique ID (SHA hash)
- Contains a message describing what changed

**Branch:** A parallel version of your code

- `main` (or `master`): The primary/production branch
- Feature branches: Where you develop new features
- Allows working on multiple features without conflicts

**Remote:** A version of your repo hosted elsewhere (GitHub, GitLab)

- `origin`: Default name for your main remote
- Allows collaboration and backups

---

## Repository Setup

### Clone an Existing Repository

```bash
# Clone from GitHub
git clone https://github.com/venkataL1611/RockNDogs.git

# Clone to a specific directory
git clone https://github.com/venkataL1611/RockNDogs.git my-project

# View remote configuration
git remote -v
```

**Output:**

```
origin  https://github.com/venkataL1611/RockNDogs.git (fetch)
origin  https://github.com/venkataL1611/RockNDogs.git (push)
```

### Initialize a New Repository

```bash
# Create a new git repo in current directory
git init

# Add a remote
git remote add origin https://github.com/username/repo.git

# Verify remote was added
git remote -v
```

### View Repository Information

```bash
# Current branch and status
git status

# All branches (local and remote)
git branch -a

# Remote details
git remote show origin
```

---

## Branch Management

### Why Use Branches?

Branches protect your main code while you experiment:

- Work on features without breaking production
- Multiple team members work simultaneously
- Easy to discard failed experiments

### Viewing Branches

```bash
# List local branches (* shows current branch)
git branch

# List all branches (including remote)
git branch -a

# List remote branches only
git branch -r

# Show last commit on each branch
git branch -v
```

**Example output:**

```
* main
  feat/optimize-docker-build-v10
  fix/session-cookies-minikube
```

### Creating Branches

```bash
# Create a new branch (but stay on current branch)
git branch feat/add-payment

# Create and switch to new branch
git checkout -b feat/add-payment

# Naming conventions:
# feat/   - New features
# fix/    - Bug fixes
# docs/   - Documentation changes
# test/   - Test additions
# refactor/ - Code restructuring
```

**Real example from RockNDogs:**

```bash
# Create branch for session cookie fix
git checkout -b fix/session-cookies-minikube
```

### Switching Branches

```bash
# Switch to existing branch
git checkout main

# Switch to another branch
git checkout feat/add-payment

# Switch to previous branch (like "cd -")
git checkout -
```

### Deleting Branches

```bash
# Delete local branch (safe, won't delete if unmerged)
git branch -d feat/add-payment

# Force delete (even if unmerged)
git branch -D feat/add-payment

# Delete remote branch
git push origin --delete feat/add-payment
```

---

## Making Changes

### The Git Workflow

```
Working Directory  →  Staging Area  →  Repository
  (edit files)     →  (git add)     →  (git commit)
```

### Checking Status

```bash
# See what's changed
git status

# Short format (compact view)
git status -s
```

**Output:**

```
M  app.js                    # Modified
A  docs/new-guide.md         # Added (staged)
?? temp.txt                  # Untracked
```

### Staging Changes

```bash
# Stage a specific file
git add app.js

# Stage multiple files
git add app.js routes/index.js

# Stage all changes in current directory
git add .

# Stage all changes in repository
git add -A

# Stage only modified files (not new files)
git add -u

# Interactively stage parts of files
git add -p
```

### Committing Changes

```bash
# Commit with message
git commit -m "feat: add user authentication"

# Commit with longer message (opens editor)
git commit

# Stage and commit in one step (only for modified files)
git commit -am "fix: correct session timeout"

# Amend last commit (fix message or add forgotten files)
git add forgotten-file.js
git commit --amend -m "Updated commit message"
```

**Commit Message Conventions:**

```
feat: add new feature
fix: bug fix
docs: documentation changes
test: add tests
refactor: code restructuring
chore: maintenance tasks
```

**Real examples from RockNDogs:**

```bash
git commit -m "feat: make session cookies configurable for minikube HTTP access"
git commit -m "feat: optimize Docker build with production-only deps and update to v10"
```

### Viewing Changes

```bash
# See unstaged changes
git diff

# See staged changes (ready to commit)
git diff --staged

# Compare specific file
git diff app.js

# Compare branches
git diff main..feat/add-payment

# Show only changed file names
git diff --name-only
```

### Undoing Changes

```bash
# Unstage file (keep changes in working directory)
git reset HEAD app.js

# Discard changes in working directory (DANGEROUS!)
git checkout -- app.js

# Discard all local changes (DANGEROUS!)
git reset --hard HEAD

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1
```

---

## Viewing History & Status

### Viewing Commits

```bash
# View commit history
git log

# Compact one-line view
git log --oneline

# Last 5 commits
git log -5

# With file changes
git log --stat

# With actual code changes
git log -p

# Graph view (shows branches)
git log --oneline --graph --all
```

**Example output:**

```
* b356121 (HEAD -> main) feat: make session cookies configurable
* a7f8c90 feat: add ArgoCD PostSync smoke tests
* 3d21a45 docs: create comprehensive setup guide
```

### Viewing Specific Commits

```bash
# Show details of specific commit
git show b356121

# Show only files changed
git show --name-only b356121

# Show commit that changed specific line
git blame app.js

# Find when a line was added/modified
git log -S "SESSION_SECURE" -- app.js
```

### Searching History

```bash
# Find commits with message containing text
git log --grep="session"

# Find commits by author
git log --author="Ravi"

# Find commits in date range
git log --since="2025-10-01" --until="2025-10-28"

# Find commits that changed specific file
git log -- app.js
```

---

## Using Grep with Git

### Why Use Grep with Git?

`grep` searches text. Combined with Git commands, you can:

- Filter commit messages
- Find specific file changes
- Search code history
- Debug deployment issues

### Basic Grep Patterns

```bash
# Case-insensitive search
git log | grep -i "session"

# Show lines after match (context)
git log | grep -A 3 "session"

# Show lines before match
git log | grep -B 2 "session"

# Show lines before and after
git log | grep -C 2 "session"

# Invert match (show lines NOT containing pattern)
git log | grep -v "test"

# Multiple patterns (OR)
git log | grep -E "session|cookie|auth"

# Count matches
git log | grep -c "feat:"
```

### Practical Git + Grep Examples

#### 1. Find Recent Session-Related Changes

```bash
git log --oneline | grep -i "session"
```

**Output:**

```
b356121 feat: make session cookies configurable
```

#### 2. Check if ConfigMap Has SESSION Variables

```bash
kubectl get configmap rockndogs-config -n rockndogs -o yaml | grep -A 2 SESSION
```

**Output:**

```
  SESSION_SAME_SITE: lax
  SESSION_SECURE: "false"
kind: ConfigMap
```

#### 3. Find All Commits by Author with "feat"

```bash
git log --author="Ravi" --oneline | grep "feat:"
```

#### 4. Check Which Files Changed in Recent Commits

```bash
git log --name-only -5 | grep -v "^$" | grep -v "commit" | grep -v "Author" | grep -v "Date"
```

#### 5. Find Commits That Modified Dockerfile

```bash
git log --oneline -- Dockerfile
```

#### 6. Search for Port-Forward Processes

```bash
ps aux | grep "kubectl port-forward" | grep -v grep
```

**Output:**

```
raviteja  77706  kubectl port-forward -n rockndogs svc/redis 6379:6379
```

#### 7. Check Pod Logs for Errors

```bash
kubectl logs -n rockndogs deploy/rockndogs-app --tail=50 | grep -i "error\|warning"
```

#### 8. View Environment Variables in Pod

```bash
kubectl exec -n rockndogs deploy/rockndogs-app -- env | grep SESSION
```

**Output:**

```
SESSION_SECURE=false
SESSION_SECRET=your-secret
SESSION_SAME_SITE=lax
```

#### 9. Find Modified JavaScript Files in Last Commit

```bash
git show --name-only HEAD | grep "\.js$"
```

#### 10. Search Code for Function Usage

```bash
git grep "SESSION_SECURE" -- "*.js"
```

**Output:**

```
app.js:const sessionSecure = process.env.SESSION_SECURE === 'true'
```

### Advanced Grep Patterns

```bash
# Regular expressions
git log | grep -E "feat|fix:"

# Word boundaries (exact word match)
git log | grep -w "session"

# Line numbers
git grep -n "SESSION_SECURE"

# Only show filenames
git grep -l "SESSION_SECURE"

# Exclude files/directories
git grep "SESSION_SECURE" -- "*.js" ":!node_modules"

# Count occurrences per file
git grep -c "SESSION_SECURE"
```

---

## Collaboration Workflow

### Pushing Changes

```bash
# Push current branch to remote
git push

# Push specific branch
git push origin feat/add-payment

# Push and set upstream (first time)
git push -u origin feat/add-payment

# Push all branches
git push --all

# Force push (DANGEROUS - overwrites remote)
git push --force
```

### Pulling Changes

```bash
# Fetch and merge changes from remote
git pull

# Pull specific branch
git pull origin main

# Fetch without merging
git fetch

# See what would be pulled
git fetch --dry-run
```

### Merging Branches

```bash
# Merge feature into current branch
git merge feat/add-payment

# Merge with commit message
git merge feat/add-payment -m "Merge payment feature"

# Create merge commit even if fast-forward possible
git merge --no-ff feat/add-payment

# Abort merge if conflicts
git merge --abort
```

**Real example from RockNDogs:**

```bash
# Switch to main
git checkout main

# Merge feature branch
git merge feat/optimize-docker-build-v10 --no-ff -m "Merge feat/optimize-docker-build-v10"

# Push to remote
git push
```

### Handling Merge Conflicts

```bash
# See conflicted files
git status

# Open file and manually resolve conflicts
# Look for:
<<<<<<< HEAD
Your changes
=======
Their changes
>>>>>>> feat/add-payment

# After resolving, stage the file
git add app.js

# Complete the merge
git commit
```

---

## Deployment Workflow

### Complete Feature Development Workflow

**Step 1: Create feature branch**

```bash
git checkout -b feat/optimize-docker-build-v10
```

**Step 2: Make changes**

```bash
# Edit files
nano Dockerfile

# Check what changed
git status
git diff
```

**Step 3: Stage and commit**

```bash
git add -A
git commit -m "feat: optimize Docker build with production-only deps and update to v10"
```

**Step 4: Push feature branch**

```bash
git push -u origin feat/optimize-docker-build-v10
```

**Step 5: Merge to main**

```bash
git checkout main
git merge feat/optimize-docker-build-v10 --no-ff
git push
```

**Step 6: Deploy (if using CI/CD)**

```bash
# CI/CD pipeline automatically:
# 1. Runs tests
# 2. Builds Docker image
# 3. Pushes to registry
# 4. Updates Kubernetes deployment
```

### Tagging Releases

```bash
# Create annotated tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Create lightweight tag
git tag v1.0.0

# List tags
git tag

# Push tag to remote
git push origin v1.0.0

# Push all tags
git push --tags

# Checkout specific tag
git checkout v1.0.0
```

### Deployment with Git + Kubernetes

**Pattern 1: Direct Apply**

```bash
# Update deployment.yaml
git add k8s/deployment.yaml
git commit -m "chore: update image to v10"
git push

# Apply manually
kubectl apply -f k8s/deployment.yaml
```

**Pattern 2: GitOps (ArgoCD)**

```bash
# Just push to git
git add k8s/
git commit -m "chore: update to v10"
git push

# ArgoCD automatically syncs within minutes
# Or trigger manually:
argocd app sync rockndogs
```

---

## Troubleshooting

### Issue: Accidentally Committed to Main

```bash
# Undo commit but keep changes
git reset --soft HEAD~1

# Create feature branch with changes
git checkout -b feat/my-feature

# Commit on feature branch
git commit -m "feat: my feature"
```

### Issue: Need to Update Branch with Main Changes

```bash
# On feature branch
git checkout feat/my-feature

# Get latest main
git fetch origin main

# Merge main into feature
git merge origin/main

# Or rebase (cleaner history)
git rebase origin/main
```

### Issue: Pushed Wrong Commit

```bash
# Revert commit (creates new commit that undoes changes)
git revert HEAD

# Push the revert
git push
```

### Issue: Pre-commit Hook Blocks Commit to Main

```bash
# Error: "Direct commits to main branch are not allowed"

# Solution: Use feature branch
git checkout -b feat/my-feature
git add -A
git commit -m "feat: my changes"
```

**This is what happened in RockNDogs:**

```bash
# Tried to commit to main
git commit -m "feat: optimize Docker build"
# 🚫 Error: Direct commits to main not allowed

# Created feature branch
git checkout -b feat/optimize-docker-build-v10
git commit -m "feat: optimize Docker build"
# ✅ Success
```

### Issue: Want to See What Changed in Deployment

```bash
# Compare current deployment with previous version
git diff HEAD~1 k8s/deployment.yaml

# See who changed what
git blame k8s/deployment.yaml
```

### Issue: Lost Track of Changes

```bash
# See uncommitted changes
git status

# See what you changed
git diff

# See all branches
git branch -a

# See recent commits
git log --oneline -10
```

---

## Complete Workflow Examples

### Example 1: Add New Feature (Session Cookie Fix)

```bash
# 1. Create feature branch
git checkout -b fix/session-cookies-minikube

# 2. Make changes
# Edit app.js and k8s/configmap.yaml

# 3. Check what changed
git status
git diff

# 4. Stage changes
git add app.js k8s/configmap.yaml

# 5. Commit with descriptive message
git commit -m "feat: make session cookies configurable for minikube HTTP access"

# 6. Push to remote
git push -u origin fix/session-cookies-minikube

# 7. Merge to main
git checkout main
git merge fix/session-cookies-minikube --no-ff
git push

# 8. Deploy
kubectl apply -f k8s/configmap.yaml
kubectl rollout restart deployment/rockndogs-app -n rockndogs
```

### Example 2: Optimize Docker Build

```bash
# 1. Create feature branch
git checkout -b feat/optimize-docker-build-v10

# 2. Edit Dockerfile
nano Dockerfile
# Changed: npm ci --only=production --ignore-scripts

# 3. Update deployment to v10
nano k8s/deployment.yaml
# Changed: image: rockndogs:v10

# 4. Check changes
git diff

# 5. Stage and commit
git add Dockerfile k8s/deployment.yaml
git commit -m "feat: optimize Docker build with production-only deps and update to v10"

# 6. Run pre-commit hooks (automatic)
# Hooks run: lint, test:unit
# ✅ All pass

# 7. Push
git push -u origin feat/optimize-docker-build-v10

# 8. Build new image
eval $(minikube docker-env)
docker build -t rockndogs:v10 .

# 9. Deploy
kubectl apply -f k8s/deployment.yaml
kubectl rollout status deployment/rockndogs-app -n rockndogs

# 10. Verify
kubectl exec -n rockndogs deploy/rockndogs-app -- env | grep SESSION
```

### Example 3: Quick Bug Fix

```bash
# 1. Create fix branch
git checkout -b fix/port-binding

# 2. Fix the issue
nano bin/www

# 3. Quick commit
git commit -am "fix: correct port binding"

# 4. Push
git push -u origin fix/port-binding

# 5. Merge to main
git checkout main
git merge fix/port-binding
git push
```

### Example 4: View Deployment History

```bash
# See what changed in k8s config over time
git log --oneline -- k8s/

# See actual changes
git log -p -- k8s/deployment.yaml

# Compare current with 3 commits ago
git diff HEAD~3 -- k8s/deployment.yaml

# Find when SESSION_SECURE was added
git log -S "SESSION_SECURE" -- k8s/configmap.yaml
```

### Example 5: Rollback Deployment

```bash
# See recent deployment changes
git log --oneline -- k8s/deployment.yaml

# Output:
# f49345b Update to v10
# b356121 Add session config
# a7f8c90 Initial deployment

# Rollback to previous version
git checkout b356121 -- k8s/deployment.yaml

# Apply rollback
kubectl apply -f k8s/deployment.yaml

# Or use kubectl rollback
kubectl rollout undo deployment/rockndogs-app -n rockndogs
```

---

## Summary Cheat Sheet

### Essential Commands

```bash
# Status & Info
git status                    # Current status
git log --oneline            # Commit history
git branch                   # List branches

# Branching
git checkout -b feat/name    # Create & switch to branch
git checkout main            # Switch to branch
git branch -d feat/name      # Delete branch

# Changes
git add .                    # Stage all changes
git commit -m "message"      # Commit changes
git diff                     # View changes

# Sync with Remote
git pull                     # Get latest changes
git push                     # Send commits to remote
git push -u origin branch    # First push of new branch

# Merge
git merge feat/name          # Merge branch
git merge --abort            # Cancel merge

# Grep Filters
| grep -i "text"             # Case-insensitive search
| grep -v "text"             # Exclude pattern
| grep -E "a|b"              # Multiple patterns
| grep -A 3 "text"           # Show 3 lines after
```

### Common Workflows

**Feature Development:**

```bash
git checkout -b feat/name → edit → git add -A → git commit -m "..." → git push -u origin feat/name
```

**Deploy to Kubernetes:**

```bash
git add k8s/ → git commit -m "..." → git push → kubectl apply -f k8s/ → kubectl rollout status deploy/app
```

**Check Deployment:**

```bash
kubectl get pods | grep app → kubectl logs deploy/app → kubectl exec deploy/app -- env | grep VAR
```

This workflow combines Git version control with Kubernetes deployment, using grep to filter and find information quickly!
