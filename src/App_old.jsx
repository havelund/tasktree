import { useState, useEffect, useRef } from 'react'
import { Plus, Calendar, CheckCircle2, Circle, Star, Trash2, Edit2, Save, X, Paperclip, Download, FileText } from 'lucide-react'
import { format, parseISO, isThisWeek, startOfWeek, endOfWeek } from 'date-fns'

const API_URL = 'http://localhost:5000/api'

function App() {
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState({ title: '', description: '', due_date: '' })
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', due_date: '' })

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    try {
      const response = await fetch(`${API_URL}/todos`)
      const data = await response.json()
      setTodos(data)
    } catch (error) {
      console.error('Error fetching todos:', error)
    }
  }

  const addTodo = async (e) => {
    e.preventDefault()
    if (!newTodo.title.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTodo)
      })
      const data = await response.json()
      setTodos([...todos, data])
      setNewTodo({ title: '', description: '', due_date: '' })
    } catch (error) {
      console.error('Error adding todo:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateTodo = async (id, updates) => {
    try {
      const response = await fetch(`${API_URL}/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      const data = await response.json()
      setTodos(todos.map(todo => todo.id === id ? data : todo))
    } catch (error) {
      console.error('Error updating todo:', error)
    }
  }

  const deleteTodo = async (id) => {
    try {
      await fetch(`${API_URL}/todos/${id}`, { method: 'DELETE' })
      setTodos(todos.filter(todo => todo.id !== id))
    } catch (error) {
      console.error('Error deleting todo:', error)
    }
  }

  const toggleForWeek = (todo) => {
    updateTodo(todo.id, { is_for_week: !todo.is_for_week })
  }

  const toggleCompleted = (todo) => {
    updateTodo(todo.id, { completed: !todo.completed })
  }

  const startEditing = (todo) => {
    setEditingId(todo.id)
    setEditForm({
      title: todo.title,
      description: todo.description || '',
      due_date: todo.due_date ? todo.due_date.split('T')[0] : ''
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditForm({ title: '', description: '', due_date: '' })
  }

  const saveEdit = async (id) => {
    if (!editForm.title.trim()) return
    await updateTodo(id, editForm)
    setEditingId(null)
    setEditForm({ title: '', description: '', due_date: '' })
  }

  const uploadFile = async (todoId, file) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_URL}/todos/${todoId}/upload`, {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      setTodos(todos.map(todo => todo.id === todoId ? data : todo))
    } catch (error) {
      console.error('Error uploading file:', error)
    }
  }

  const deleteAttachment = async (todoId, filename) => {
    try {
      const response = await fetch(`${API_URL}/todos/${todoId}/attachments/${filename}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      setTodos(todos.map(todo => todo.id === todoId ? data : todo))
    } catch (error) {
      console.error('Error deleting attachment:', error)
    }
  }

  const getOriginalFilename = (filename) => {
    const parts = filename.split('_')
    return parts.slice(2).join('_')
  }

  const filteredTodos = todos.filter(todo => {
    if (filter === 'week') return todo.is_for_week
    if (filter === 'completed') return todo.completed
    if (filter === 'active') return !todo.completed
    return true
  })

  const weekStart = format(startOfWeek(new Date()), 'MMM d')
  const weekEnd = format(endOfWeek(new Date()), 'MMM d, yyyy')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Todo List</h1>
          <p className="text-gray-600">Current week: {weekStart} - {weekEnd}</p>
        </div>

        <form onSubmit={addTodo} className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="What needs to be done?"
              value={newTodo.title}
              onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newTodo.description}
              onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <div className="flex gap-4">
              <input
                type="date"
                value={newTodo.due_date}
                onChange={(e) => setNewTodo({ ...newTodo, due_date: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Plus size={20} />
                Add Todo
              </button>
            </div>
          </div>
        </form>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({todos.length})
            </button>
            <button
              onClick={() => setFilter('week')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Week ({todos.filter(t => t.is_for_week).length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active ({todos.filter(t => !t.completed).length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed ({todos.filter(t => t.completed).length})
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredTodos.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              No todos to display
            </div>
          ) : (
            filteredTodos.map(todo => (
              <div
                key={todo.id}
                className={`bg-white rounded-lg shadow-md p-4 transition-all hover:shadow-lg ${
                  todo.completed ? 'opacity-60' : ''
                }`}
              >
                {editingId === todo.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Title"
                    />
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                      placeholder="Description"
                      rows="3"
                    />
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={editForm.due_date}
                        onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                      <button
                        onClick={() => saveEdit(todo.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <Save size={18} />
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                      >
                        <X size={18} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleCompleted(todo)}
                      className="mt-1 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      {todo.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                    </button>
                    
                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {todo.title}
                      </h3>
                      {todo.description && (
                        <p className="text-gray-600 text-sm mt-1">{todo.description}</p>
                      )}
                      {todo.due_date && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                          <Calendar size={16} />
                          {format(parseISO(todo.due_date), 'MMM d, yyyy')}
                        </div>
                      )}
                      {todo.attachments && todo.attachments.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {todo.attachments.map((attachment, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm bg-gray-50 rounded px-2 py-1">
                              <FileText size={14} className="text-gray-500" />
                              <a
                                href={`http://localhost:5000/uploads/${attachment}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 text-blue-600 hover:underline truncate"
                              >
                                {getOriginalFilename(attachment)}
                              </a>
                              <button
                                onClick={() => deleteAttachment(todo.id, attachment)}
                                className="text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete attachment"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer" title="Attach file">
                        <Paperclip size={20} />
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              uploadFile(todo.id, e.target.files[0])
                              e.target.value = ''
                            }
                          }}
                        />
                      </label>
                      <button
                        onClick={() => startEditing(todo)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit task"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button
                        onClick={() => toggleForWeek(todo)}
                        className={`p-2 rounded-lg transition-colors ${
                          todo.is_for_week
                            ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={todo.is_for_week ? 'Remove from this week' : 'Add to this week'}
                      >
                        <Star size={20} fill={todo.is_for_week ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default App
