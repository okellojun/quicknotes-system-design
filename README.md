# QuickNotes

QuickNotes is a lightweight note-taking web application built as part of an engineering initiative to transition a standalone browser app into a enterprise-grade distributed platform supporting 1 million users.

---

## Technical Stack
* **Frontend**: HTML5, CSS3, Modern JavaScript (ES6+, Async/Await, Fetch API)
* **Mock Backend Integration**: JSONPlaceholder REST API (`/posts`)
* **Documentation Standards**: Markdown, SQL DDL (PostgreSQL), RESTful API Standards

---

## Project Structure

```text
quicknotes/
├── index.html           # Main HTML structure with form and notes list
├── api.js               # Async API client with GET, POST, and DELETE logic
├── style.css            # Responsive CSS with distinct status indicators
├── README.md            # Project overview and documentation links
└── docs/
    ├── api-design.md    # Production REST API specification
    ├── data-model.md    # Relational PostgreSQL schema & SQL queries
    └── architecture.md # High-availability system architecture & load calculations
```

## Running the API client locally

Because this project is built using native web technologies, no build step or node module installations are required.

1. Clone the repository and navigate to project folder
```bash 
git clone https://github.com/okellojun/quicknotes-system-design.git

cd quicknotes-system-design
```

2. Open In browser
```text
Open index.html directly in any web browser.

Alternative (Recommended): Serve using VS Code Live Server
```

## Documentation Links

API Design Document : https://github.com/okellojun/quicknotes-system-design/blob/edb518e44d15b71921f3f359d4eedcae54fc1136/docs/api-design.md

Data Model Document:https://github.com/okellojun/quicknotes-system-design/blob/edb518e44d15b71921f3f359d4eedcae54fc1136/docs/data-model.md

Architecture Document : https://github.com/okellojun/quicknotes-system-design/blob/edb518e44d15b71921f3f359d4eedcae54fc1136/docs/architecture.md


## What I have Learned

(i) Gained hands-on experience using textContent instead of innerHTML when taking user input to eliminate XSS vulnerabilities when rendering unsanitized user content.

(ii) I have gained knowledge on how to calculate database storage so as to plan and design a system that can accommodate the estimated number of users reducing bottlenecks

(iii) Building reusable HTTP async operations using try/catch/finally blocks and async/await to handle state changes, errors and validations