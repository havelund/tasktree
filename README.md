# TaskTree

This todo list application offers two features together that I was not able to find in other todo list applications:

1. **Hierarchical Tasks** - Unlimited nesting with parent-child relationships
2. **Smart Filtering** - Ability to mark tasks for today, this week, important, and more, and filter them, allowing to update the filtered tasks, causing the origin tasks to be updated.

![TaskTree Screenshot](tasktree.png)

**Key Elements:**
- **Add Task** - Click the "+" button at the top to create new tasks
- **Filter Buttons** - All, This Week, Today, Important, Upcoming, Completed, Worked On (each shows task count)
- **Color Filters** - Seven color circles to filter tasks by category
- **Task Actions** - Each task has buttons for: comments, add subtask, attachments, edit, This Week flag, due date, focus tracking, important flag, and delete
- **Hierarchical Structure** - Tasks can have unlimited subtasks (expand/collapse with arrow)
- **Quick Color Change** - Click the colored dot next to any task title to change its color

## Features

### 📋 Core Task Management
- **Hierarchical Tasks** - Unlimited nesting with parent-child relationships
- **Drag & Drop** - Drop *onto* a task to nest it as a subtask (blue highlight shows the target), drop on a task's thin top edge to reorder before it, and use the "move to end" zone to send it to the bottom of a list. Collapsed parents **spring-load** open on hover, and the window **auto-scrolls** when you drag near its edges.
- **Complete with Confirmation** - Clicking the checkbox asks "Mark this task as done?" then plays a "poof" animation
- **Quick Actions** - Complete, edit, delete, and add subtasks
- **Auto-Hide Completed** - Keep your lists clean and focused
- **Square Checkboxes** - Familiar checkbox-style task completion

### 🏷️ Task Organization
- **Today Flag** (D) - Mark tasks for immediate focus
- **This Week Flag** (W) - Weekly planning and organization
- **Important Flag** (🔴) - Highlight critical tasks
- **Focus Tracking** (🎯) - Track which tasks you're actively working on
- **7 Color System** (🎨) - Categorize tasks with Gray, Red, Orange, Yellow, Green, Blue, Purple
- **Quick Color Change** - Click the colored dot next to any task title to instantly change its color
- **Due Dates** - Set deadlines and track overdue tasks

### 🔍 Smart Filtering & Search
- **Text Search** - Search tasks by title, description, or comment content, results shown as flat list with parent breadcrumbs
- **All** - View complete hierarchy
- **This Week** - Tasks marked for the week (Monday to Sunday)
- **Today** - Tasks marked for today OR due today/overdue
- **Upcoming** - All tasks with deadlines (overdue, today, and next 7 days)
- **Important** - Critical tasks only
- **Color Filters** - Filter by any of 7 colors
- **Task Count Badges** - Each filter button shows the number of matching tasks at a glance
- **Completed Period** - View tasks completed in date range
- **Parent Breadcrumbs** - See task location in filtered/search views (📁 Parent › Grandparent), click to navigate
- **Expandable in Filters** - View subtasks even in filtered views

### 💬 Comments & Notes
- **Comments** - Add unlimited notes to any task with colored card styling
- **Edit Comments** - Update notes as tasks progress
- **Comment Checklists** - Use markdown checkboxes in comments (`- [ ] item`) for interactive checklists
- **Clickable Checkboxes** - Check/uncheck items directly, checked items show with strikethrough
- **Attachments** - Upload files to tasks and comments (supports PDF, images, Office docs including PowerPoint, archives, and more)
- **Links** - URLs in comments are automatically clickable

### 📊 Reports & Export
- **Markdown Export** - Export all active tasks
- **Completed Report** - Generate reports for completed tasks in date range
- **Worked On Report** - Track focus time across tasks

### 🗺️ Task Graph
- **Visual Graph** - Graphviz-powered visualization of your entire task tree
- **Color-Coded Nodes** - Nodes match task colors, with icons for important (⭐) and today (📅)
- **Clickable Nodes** - Click any node to navigate to that task in the list
- **Zoom Controls** - Zoom in/out with percentage display
- **Layout Toggle** - Switch between horizontal (left-to-right) and vertical (top-down) layouts
- **Dark Mode Support** - Graph adapts to your theme

### ↩️ Undo
- **General Undo** - Revert your last action across the entire app (create, edit, complete, delete, move, flags, colors, comments)
- **Undo Button** - One-click undo in the header, disabled when there's nothing to undo
- **Keyboard Shortcut** - `⌘/Ctrl+Z` (outside text fields) to undo
- **Multi-Step** - Step back through up to 50 recent changes
- **Note** - Deleted file attachments are not restored; undo history resets on server restart

### 🌙 User Experience
- **Dark Mode** - Easy on the eyes (default theme)
- **Responsive Design** - Works on all screen sizes
- **Keyboard Friendly** - Efficient workflows
- **Tooltips** - Helpful hints on every button

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

Check with `python3 --version` (Windows: `python --version`) and `node -v`. Older Linux distributions (e.g. RHEL 8/9) ship older versions by default and need upgrading.

### Installation

1. **Clone the repository:**
```bash
git clone https://github.jpl.nasa.gov/khavelun/tasktree.git
```

2. **Navigate to the project directory:**
```bash
cd tasktree
```

3. **Install dependencies (only once):**
```bash
pip install -r requirements.txt
npm install
```

### Running the Application

```bash
./start.sh
```

This starts the backend and frontend servers and asks whether to open TaskTree in your browser. Press Enter (or wait 15 seconds) and it opens automatically in your default browser — on macOS, in a fresh window. If the browser does not open, go to http://localhost:5173 manually.

Works on macOS, Linux, and Windows. **Windows:** run `./start.sh` and `./stop.sh` from **Git Bash** (installed with [Git for Windows](https://gitforwindows.org)) or WSL — they will not run in Command Prompt or PowerShell.

### Stopping the Application

Press `Ctrl+C` in the terminal running `start.sh`, or run:

```bash
./stop.sh
```

## Database Management

### Backup Database
Create a timestamped backup:
```bash
./backup_db.sh
```
Backups are saved to `backups/todos_backup_YYYYMMDD_HHMMSS.db`

### Reset Database
Reset to empty database (automatically creates backup first):
```bash
./reset_db.sh
```

## Project Structure

```
todo/
├── app.py                 # Flask backend API
├── todos.db              # SQLite database
├── requirements.txt      # Python dependencies
├── package.json          # Node.js dependencies
├── start.sh             # Start both servers
├── stop.sh              # Stop both servers
├── backup_db.sh         # Backup database
├── reset_db.sh          # Reset database
├── backups/             # Database backups
├── uploads/             # File attachments
└── src/
    ├── App.jsx          # Main React application
    ├── TaskGraph.jsx     # Graphviz task visualization
    ├── DatePicker.jsx    # Date picker component
    └── main.jsx         # React entry point
```

## Technology Stack

### Backend
- **Python 3 / Flask** - REST API
- **Flask-CORS** - Cross-origin resource sharing
- **SQLAlchemy** ORM over **SQLite** (`todos.db`)
- **Werkzeug** - File upload handling (attachments, 16MB limit)

### Frontend
- **React 18** + **Vite 5** - SPA framework and dev/build tooling
- **Tailwind CSS 3** (PostCSS, Autoprefixer) - styling
- **lucide-react** - Icon library
- **date-fns** - Date manipulation
- **react-datepicker** - Date picker
- **@viz-js/viz** - Graphviz rendering for the Task Graph

### Tooling & Ops
- **Bash scripts** - `start.sh`, `stop.sh`, `backup_db.sh`, `reset_db.sh`
- **Python migration scripts** - `migrate_*.py`

### Architecture
- React SPA ↔ Flask REST API (`http://localhost:5000/api`) over JSON; SQLite database; local `uploads/` folder for attachments.

## API Endpoints

- `GET /api/todos` - Get all todos with hierarchy
- `POST /api/todos` - Create new todo
- `PATCH /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo (cascading)
- `POST /api/todos/:id/upload` - Upload attachment
- `POST /api/todos/:id/comments` - Add comment
- `PATCH /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment
- `POST /api/undo` - Undo the last mutating action
- `GET /api/undo/count` - Number of undo steps available

## Tips & Best Practices

1. **Use Today for immediate focus** - Mark 3-5 tasks you'll work on today
2. **Use This Week for planning** - Mark tasks for the week ahead
3. **Color code consistently** - Define your own system (e.g., Red = urgent, Blue = work)
4. **Break down complex tasks** - Use subtasks for step-by-step progress
5. **Use Focus tracking** - Click 🎯 when you start working on a task
6. **Regular backups** - Run `./backup_db.sh` before major changes
7. **Use filters effectively** - Switch between views to stay focused

## Keyboard Shortcuts

- `⌘/Ctrl+Z` - Undo last action (when not typing in a text field)
- Click task title to expand/collapse
- Drop a task onto another to nest it; drop on a task's top edge to reorder before it
- Click icons for quick actions

## Contributing

**Author:** Klaus Havelund (klaus.havelund@jpl.nasa.gov)

This project is **100% vibe coded** — it was built entirely through AI-assisted development, with the author guiding the design and features conversationally rather than writing the code by hand.

This is a personal project.

## License

MIT License - Feel free to use and modify for your own needs.

