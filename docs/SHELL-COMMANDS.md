# Shell Commands Reference: sed, awk, and More

This guide documents powerful shell commands used in the RockNDogs project, with practical examples for text processing, data extraction, and automation.

---

## Table of Contents

1. [Introduction to Shell Text Processing](#introduction-to-shell-text-processing)
2. [grep - Search and Filter](#grep---search-and-filter)
3. [sed - Stream Editor](#sed---stream-editor)
4. [awk - Pattern Scanning and Processing](#awk---pattern-scanning-and-processing)
5. [cut - Extract Columns](#cut---extract-columns)
6. [sort, uniq, wc - Data Analysis](#sort-uniq-wc---data-analysis)
7. [xargs - Build Commands from Input](#xargs---build-commands-from-input)
8. [Pipes and Redirection](#pipes-and-redirection)
9. [Real-World Examples](#real-world-examples)
10. [Command Combinations](#command-combinations)

---

## Introduction to Shell Text Processing

### Why Learn These Commands?

These tools form the "Swiss Army knife" of command-line text processing:

- **grep**: Find lines matching patterns
- **sed**: Edit text streams (find/replace)
- **awk**: Process structured text (columns, calculations)
- **cut**: Extract specific fields
- **sort/uniq/wc**: Analyze and count data

### The Unix Philosophy

Each tool does one thing well. Combine them with pipes (`|`) for powerful workflows.

```bash
# Example: Find all JavaScript files, count lines, sort by size
find . -name "*.js" | xargs wc -l | sort -n
```

---

## grep - Search and Filter

### Basic Usage

```bash
# Search for text in file
grep "pattern" file.txt

# Search in multiple files
grep "pattern" *.js

# Recursive search in directory
grep -r "pattern" /path/to/dir

# Case-insensitive search
grep -i "session" app.js
```

### Common Options

| Option | Description            | Example                      |
| ------ | ---------------------- | ---------------------------- |
| `-i`   | Ignore case            | `grep -i "error" logs.txt`   |
| `-v`   | Invert match (exclude) | `grep -v "test" file.txt`    |
| `-n`   | Show line numbers      | `grep -n "TODO" app.js`      |
| `-c`   | Count matches          | `grep -c "error" logs.txt`   |
| `-l`   | Show only filenames    | `grep -l "SESSION" *.js`     |
| `-r`   | Recursive search       | `grep -r "API_KEY" .`        |
| `-w`   | Match whole words      | `grep -w "port" config.js`   |
| `-A 3` | Show 3 lines after     | `grep -A 3 "error" logs.txt` |
| `-B 2` | Show 2 lines before    | `grep -B 2 "fatal" logs.txt` |
| `-C 2` | Show 2 lines context   | `grep -C 2 "crash" logs.txt` |

### Extended Regex with -E

```bash
# Multiple patterns (OR)
grep -E "error|warning|fatal" logs.txt

# Match specific pattern
grep -E "^(feat|fix):" commits.txt

# Number ranges
grep -E "port [0-9]{4,5}" config.js
```

### Practical Examples

**1. Find running port-forwards:**

```bash
ps aux | grep "kubectl port-forward" | grep -v grep
```

**2. Check environment variables in pod:**

```bash
kubectl exec deploy/app -- env | grep SESSION
```

**Output:**

```
SESSION_SECURE=false
SESSION_SAME_SITE=lax
```

**3. Find JavaScript files with TODO comments:**

```bash
grep -r -n "// TODO" --include="*.js" .
```

**4. Count errors in logs:**

```bash
kubectl logs deploy/app | grep -c "ERROR"
```

**5. Find files importing specific module:**

```bash
grep -r "require.*express" --include="*.js" .
```

---

## sed - Stream Editor

### What is sed?

`sed` is a stream editor for transforming text:

- Find and replace
- Delete lines
- Insert text
- Edit files in-place

### Basic Syntax

```bash
sed 's/pattern/replacement/' file.txt
```

### Common Operations

#### 1. Find and Replace

```bash
# Replace first occurrence on each line
sed 's/old/new/' file.txt

# Replace all occurrences (global)
sed 's/old/new/g' file.txt

# Replace only on line 3
sed '3s/old/new/' file.txt

# Replace in range of lines (5-10)
sed '5,10s/old/new/g' file.txt
```

#### 2. In-Place Editing

```bash
# Edit file in-place (with backup)
sed -i.bak 's/old/new/g' file.txt

# Edit in-place (no backup) - macOS
sed -i '' 's/old/new/g' file.txt

# Edit in-place (no backup) - Linux
sed -i 's/old/new/g' file.txt
```

#### 3. Delete Lines

```bash
# Delete line 5
sed '5d' file.txt

# Delete lines 3-7
sed '3,7d' file.txt

# Delete lines matching pattern
sed '/pattern/d' file.txt

# Delete blank lines
sed '/^$/d' file.txt

# Delete lines NOT matching pattern
sed '/pattern/!d' file.txt
```

#### 4. Insert and Append

```bash
# Insert text before line 3
sed '3i\New line text' file.txt

# Append text after line 5
sed '5a\New line text' file.txt

# Insert before pattern
sed '/pattern/i\New text' file.txt
```

#### 5. Multiple Operations

```bash
# Multiple replacements
sed -e 's/old1/new1/g' -e 's/old2/new2/g' file.txt

# From script file
sed -f script.sed file.txt
```

### Practical Examples

**1. Update Docker image version:**

```bash
sed -i '' 's/image: rockndogs:v9/image: rockndogs:v10/' k8s/deployment.yaml
```

**2. Change environment variable:**

```bash
sed -i '' 's/NODE_ENV: "development"/NODE_ENV: "production"/' k8s/configmap.yaml
```

**3. Remove comments from config:**

```bash
sed '/^#/d' config.yml
```

**4. Extract specific lines:**

```bash
# Get lines 10-20
sed -n '10,20p' file.txt
```

**5. Replace with regex:**

```bash
# Replace all port numbers
sed -E 's/PORT=[0-9]+/PORT=3000/' .env
```

**6. Add prefix to lines:**

```bash
# Add "TODO: " to all lines
sed 's/^/TODO: /' file.txt
```

**7. Convert line endings (DOS to Unix):**

```bash
sed 's/\r$//' file.txt
```

---

## awk - Pattern Scanning and Processing

### What is awk?

`awk` is a programming language for processing structured text:

- Process columns/fields
- Perform calculations
- Generate reports

### Basic Syntax

```bash
awk 'pattern { action }' file.txt
```

### Field Processing

```bash
# Print first column
awk '{ print $1 }' file.txt

# Print multiple columns
awk '{ print $1, $3 }' file.txt

# Print with custom separator
awk '{ print $1 ":" $2 }' file.txt

# Change field separator (default is whitespace)
awk -F: '{ print $1 }' /etc/passwd

# Print last column
awk '{ print $NF }' file.txt

# Print second-to-last column
awk '{ print $(NF-1) }' file.txt
```

### Pattern Matching

```bash
# Print lines matching pattern
awk '/pattern/ { print }' file.txt

# Print lines where column 3 > 100
awk '$3 > 100 { print }' file.txt

# Print if column 1 equals "error"
awk '$1 == "error" { print }' file.txt

# Multiple conditions
awk '$1 == "GET" && $3 == 200 { print }' access.log
```

### Built-in Variables

| Variable      | Description            | Example                    |
| ------------- | ---------------------- | -------------------------- |
| `$0`          | Entire line            | `awk '{ print $0 }'`       |
| `$1, $2, ...` | Columns 1, 2, ...      | `awk '{ print $1 }'`       |
| `NF`          | Number of fields       | `awk '{ print NF }'`       |
| `NR`          | Line number            | `awk '{ print NR, $0 }'`   |
| `FS`          | Field separator        | `awk 'BEGIN { FS=":" }'`   |
| `OFS`         | Output field separator | `awk 'BEGIN { OFS="\t" }'` |

### Calculations

```bash
# Sum column 3
awk '{ sum += $3 } END { print sum }' file.txt

# Average of column 2
awk '{ sum += $2; count++ } END { print sum/count }' file.txt

# Count lines
awk 'END { print NR }' file.txt

# Min/max
awk 'BEGIN { min=999999 } $1 < min { min=$1 } END { print min }' file.txt
```

### Practical Examples

**1. Extract pod names and status:**

```bash
kubectl get pods | awk 'NR>1 { print $1, $3 }'
```

**Output:**

```
rockndogs-app-769997f55-ds77p Running
mongodb-7d9f8b4c5-abc12 Running
```

**2. Get total memory usage:**

```bash
kubectl top pods | awk 'NR>1 { sum += $3 } END { print sum "Mi" }'
```

**3. Find large files:**

```bash
ls -lh | awk '$5 ~ /M|G/ { print $5, $9 }'
```

**4. Process CSV file:**

```bash
awk -F, '{ print $1, $3 }' data.csv
```

**5. Format kubectl output:**

```bash
kubectl get pods -o wide | awk '{ printf "%-40s %s\n", $1, $3 }'
```

**6. Extract IPs from log:**

```bash
awk '/error/ { print $1 }' access.log | sort | uniq
```

**7. Calculate pod restart counts:**

```bash
kubectl get pods | awk 'NR>1 { print $4 }' | awk '{ sum += $1 } END { print sum }'
```

**8. Filter by column value:**

```bash
# Get pods not running
kubectl get pods | awk '$3 != "Running" { print $0 }'
```

---

## cut - Extract Columns

### Basic Usage

```bash
# Extract characters 1-10
cut -c1-10 file.txt

# Extract fields with delimiter
cut -d: -f1 /etc/passwd

# Extract multiple fields
cut -d, -f1,3,5 data.csv

# Extract from field 3 onwards
cut -d: -f3- file.txt
```

### Practical Examples

**1. Get usernames from passwd:**

```bash
cut -d: -f1 /etc/passwd
```

**2. Extract IP addresses:**

```bash
kubectl get pods -o wide | cut -d' ' -f6
```

**3. Get container names from docker:**

```bash
docker ps | cut -c1-12
```

**4. Process CSV:**

```bash
cut -d, -f2,4 data.csv
```

---

## sort, uniq, wc - Data Analysis

### sort - Sort Lines

```bash
# Sort alphabetically
sort file.txt

# Sort numerically
sort -n numbers.txt

# Reverse sort
sort -r file.txt

# Sort by column 3 (numeric)
sort -k3 -n file.txt

# Sort unique (remove duplicates)
sort -u file.txt

# Case-insensitive sort
sort -f file.txt
```

### uniq - Remove Duplicates

```bash
# Remove adjacent duplicates (must sort first!)
sort file.txt | uniq

# Count occurrences
sort file.txt | uniq -c

# Show only duplicates
sort file.txt | uniq -d

# Show only unique (non-duplicated) lines
sort file.txt | uniq -u
```

### wc - Word Count

```bash
# Count lines
wc -l file.txt

# Count words
wc -w file.txt

# Count characters
wc -c file.txt

# Count all
wc file.txt
```

### Practical Examples

**1. Count unique IPs in logs:**

```bash
awk '{ print $1 }' access.log | sort | uniq -c | sort -rn
```

**2. Top 10 memory-using pods:**

```bash
kubectl top pods | tail -n +2 | sort -k2 -rn | head -10
```

**3. Count files by extension:**

```bash
find . -type f | sed 's/.*\.//' | sort | uniq -c
```

**4. Find most common errors:**

```bash
grep "ERROR" logs.txt | sort | uniq -c | sort -rn | head -5
```

---

## xargs - Build Commands from Input

### What is xargs?

`xargs` takes input and converts it to command arguments.

### Basic Usage

```bash
# Delete all .log files
find . -name "*.log" | xargs rm

# Count lines in all JS files
find . -name "*.js" | xargs wc -l

# Run command for each line
echo "file1 file2 file3" | xargs -n1 echo "Processing:"
```

### Common Options

| Option  | Description              | Example                     |
| ------- | ------------------------ | --------------------------- |
| `-n1`   | One argument per command | `xargs -n1 echo`            |
| `-I {}` | Replace string           | `xargs -I {} mv {} backup/` |
| `-P 4`  | Run 4 parallel processes | `xargs -P 4 command`        |
| `-t`    | Print commands           | `xargs -t rm`               |
| `-p`    | Prompt before running    | `xargs -p rm`               |

### Practical Examples

**1. Delete old log files:**

```bash
find /var/log -name "*.log" -mtime +30 | xargs rm
```

**2. Search in multiple files:**

```bash
find . -name "*.js" | xargs grep "TODO"
```

**3. Copy files:**

```bash
find . -name "*.bak" | xargs -I {} cp {} /backup/
```

**4. Parallel processing:**

```bash
cat urls.txt | xargs -n1 -P 4 curl -O
```

**5. Kill processes:**

```bash
ps aux | grep "node" | awk '{ print $2 }' | xargs kill
```

---

## Pipes and Redirection

### Pipes (|)

Connect output of one command to input of another:

```bash
# Command1 output → Command2 input
command1 | command2

# Multiple pipes
cat file.txt | grep "error" | sort | uniq -c
```

### Redirection

#### Output Redirection

```bash
# Write to file (overwrite)
echo "Hello" > file.txt

# Append to file
echo "World" >> file.txt

# Redirect stderr
command 2> errors.txt

# Redirect both stdout and stderr
command > output.txt 2>&1

# Redirect to /dev/null (discard)
command > /dev/null 2>&1
```

#### Input Redirection

```bash
# Read from file
sort < input.txt

# Here document
cat << EOF
Line 1
Line 2
EOF
```

### Practical Examples

**1. Save kubectl output:**

```bash
kubectl get pods > pods.txt
```

**2. Append logs:**

```bash
kubectl logs deploy/app >> app.log
```

**3. Ignore errors:**

```bash
rm file.txt 2>/dev/null
```

**4. Capture both output and errors:**

```bash
./script.sh > output.log 2>&1
```

**5. Create multi-line file:**

```bash
cat > config.yml << EOF
port: 3000
host: localhost
EOF
```

---

## Real-World Examples

### Example 1: Monitor Kubernetes Pods

```bash
# Get pod names with errors
kubectl get pods | grep -v "Running\|Completed" | awk 'NR>1 { print $1 }'

# Count restart events
kubectl get events | grep "restart" | wc -l

# Find pods using most memory
kubectl top pods | tail -n +2 | sort -k3 -rn | head -5
```

### Example 2: Analyze Application Logs

```bash
# Count error types
kubectl logs deploy/app | grep "ERROR" | awk '{ print $5 }' | sort | uniq -c

# Find slow requests (>1s)
kubectl logs deploy/app | grep "GET" | awk '$NF > 1000 { print $0 }'

# Top 10 requested URLs
kubectl logs deploy/app | awk '{ print $7 }' | sort | uniq -c | sort -rn | head -10
```

### Example 3: File Management

```bash
# Find large files
find . -type f -size +10M | xargs ls -lh | sort -k5 -rh

# Count code lines by language
find . -name "*.js" | xargs wc -l | tail -1

# Remove old backups
find /backup -name "*.tar.gz" -mtime +30 | xargs rm -f
```

### Example 4: Data Processing

```bash
# Extract unique emails from file
grep -Eo "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" file.txt | sort -u

# Count HTTP status codes
awk '{ print $9 }' access.log | sort | uniq -c | sort -rn

# Calculate average response time
awk '{ sum += $NF; count++ } END { print sum/count "ms" }' access.log
```

### Example 5: Git Operations with Filtering

```bash
# Find recent commits by author
git log --author="Ravi" --oneline | head -10

# Count commits per day
git log --format="%ad" --date=short | sort | uniq -c

# Find files changed most often
git log --name-only --format="" | sort | uniq -c | sort -rn | head -10

# Search commit messages
git log --grep="fix" --oneline | wc -l
```

---

## Command Combinations

### Pattern 1: Find, Filter, Count

```bash
# Find error lines, count by type
grep "ERROR" logs.txt | awk '{ print $3 }' | sort | uniq -c | sort -rn
```

### Pattern 2: Extract, Process, Output

```bash
# Get pod IPs, sort, save
kubectl get pods -o wide | awk 'NR>1 { print $6 }' | sort > pod-ips.txt
```

### Pattern 3: Search, Replace, Verify

```bash
# Update config, verify change
sed -i '' 's/PORT=3000/PORT=8080/' .env && grep "PORT" .env
```

### Pattern 4: Monitor, Filter, Alert

```bash
# Watch pods, alert on failures
watch -n 5 'kubectl get pods | grep -v "Running" | tail -n +2'
```

### Pattern 5: Parallel Processing

```bash
# Process multiple files in parallel
find . -name "*.log" | xargs -n1 -P4 -I {} sh -c 'gzip {} && echo "Compressed {}"'
```

---

## Quick Reference Card

### grep

```bash
grep -i "text" file              # Case-insensitive
grep -v "exclude" file           # Invert match
grep -E "a|b" file               # Extended regex
grep -r "text" dir/              # Recursive
grep -A 3 "text" file            # Show 3 lines after
```

### sed

```bash
sed 's/old/new/g' file           # Replace all
sed -i '' 's/old/new/g' file     # In-place edit (macOS)
sed '/pattern/d' file            # Delete matching lines
sed -n '10,20p' file             # Print lines 10-20
```

### awk

```bash
awk '{ print $1 }' file          # Print column 1
awk -F: '{ print $1 }' file      # Custom separator
awk '$3 > 100' file              # Filter by column value
awk '{ sum += $2 } END { print sum }'  # Sum column
```

### Other

```bash
cut -d: -f1 file                 # Extract field
sort -n file                     # Numeric sort
uniq -c file                     # Count occurrences
wc -l file                       # Count lines
xargs -n1 command                # One arg per command
```

### Pipes & Redirection

```bash
cmd1 | cmd2                      # Pipe output
cmd > file                       # Redirect output
cmd >> file                      # Append output
cmd 2>/dev/null                  # Discard errors
```

---

## Practice Exercises

### Exercise 1: Pod Analysis

```bash
# Get pod names that are not running
kubectl get pods | awk '$3 != "Running" { print $1 }'
```

### Exercise 2: Log Analysis

```bash
# Find top 5 most common errors
grep "ERROR" app.log | sed 's/.*ERROR: //' | sort | uniq -c | sort -rn | head -5
```

### Exercise 3: File Processing

```bash
# Count lines in all JavaScript files
find . -name "*.js" | xargs wc -l | tail -1
```

### Exercise 4: Configuration Update

```bash
# Change all occurrences of port 3000 to 8080
find . -name "*.yaml" | xargs sed -i '' 's/port: 3000/port: 8080/g'
```

### Exercise 5: Data Extraction

```bash
# Get unique IP addresses from logs
awk '{ print $1 }' access.log | sort -u | wc -l
```

---

## Summary

These shell commands are essential tools for:

- **grep**: Search and filter text
- **sed**: Edit text streams
- **awk**: Process structured data
- **cut**: Extract columns
- **sort/uniq/wc**: Analyze data
- **xargs**: Build commands
- **Pipes**: Chain commands together

**Master these patterns:**

1. Find → Filter → Count
2. Extract → Transform → Output
3. Search → Replace → Verify
4. Monitor → Alert → Act

**Remember:** Combine simple tools for powerful workflows. Start simple, add complexity as needed!
