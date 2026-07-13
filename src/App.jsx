import { useState, useEffect } from 'react'
import { Plus, Calendar, CheckCircle2, Circle, Star, Trash2, Edit2, Save, X, Paperclip, FileText, ChevronDown, ChevronRight, MessageSquare, AlertCircle, Focus, Download, BarChart3, HelpCircle, Moon, Sun, CalendarDays, Database, Search } from 'lucide-react'
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns'
import DatePicker from './DatePicker'

const API_URL = 'http://localhost:5000/api'

// Utility function to convert URLs in text to clickable links
const linkifyText = (text) => {
  if (!text) return null
  
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      )
    }
    return part
  })
}

const COLORS = [
  { name: 'gray', label: 'Gray', bg: 'bg-gray-200', border: 'border-gray-400', text: 'text-gray-700', solid: 'bg-gray-400' },
  { name: 'red', label: 'Red', bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-700', solid: 'bg-red-500' },
  { name: 'orange', label: 'Orange', bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-700', solid: 'bg-orange-500' },
  { name: 'yellow', label: 'Yellow', bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-700', solid: 'bg-yellow-400' },
  { name: 'green', label: 'Green', bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-700', solid: 'bg-green-500' },
  { name: 'blue', label: 'Blue', bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-700', solid: 'bg-blue-500' },
  { name: 'purple', label: 'Purple', bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-700', solid: 'bg-purple-500' },
]

function TodoItem({ todo, level = 0, onUpdate, onDelete, onAddChild, onMove, onRefresh, focusedTodoId, onFocus, darkMode, collapseAll, hideChildren = false, onNavigateToParent, expandedTaskId, expandedTaskIds = [] }) {
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', due_date: '', color: 'gray' })
  // Initialize collapsed based on whether this task should be expanded
  const shouldBeExpanded = expandedTaskId === todo.id || expandedTaskIds.includes(todo.id)
  const [collapsed, setCollapsed] = useState(!shouldBeExpanded)
  
  
  useEffect(() => {
    if (collapseAll !== null) {
      setCollapsed(collapseAll)
    }
  }, [collapseAll])
  const [expanded, setExpanded] = useState(false)
  
  useEffect(() => {
    const shouldExpand = expandedTaskId === todo.id || expandedTaskIds.includes(todo.id)
    if (shouldExpand) {
      setExpanded(true)
      setCollapsed(false)  // Also uncollapse to show children
    }
  }, [expandedTaskId, expandedTaskIds, todo.id])
  
  // Also update collapsed when expandedTaskIds changes
  useEffect(() => {
    if (expandedTaskIds.includes(todo.id)) {
      setCollapsed(false)
    }
  }, [expandedTaskIds, todo.id, todo.title])
  const [showAddChild, setShowAddChild] = useState(false)
  const [newChildForm, setNewChildForm] = useState({ title: '', description: '', due_date: '', color: 'gray' })
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editCommentText, setEditCommentText] = useState('')
  const [showColorPicker, setShowColorPicker] = useState(false)

  // Clear editing state when comment section opens
  useEffect(() => {
    if (showComments) {
      setEditingCommentId(null)
      setEditCommentText('')
    }
  }, [showComments])

  const startEditing = () => {
    setEditingId(todo.id)
    setEditForm({
      title: todo.title,
      description: todo.description || '',
      due_date: todo.due_date ? todo.due_date.split('T')[0] : '',
      color: todo.color || 'gray'
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditForm({ title: '', description: '', due_date: '', color: 'gray' })
  }

  const saveEdit = async () => {
    if (!editForm.title.trim()) return
    await onUpdate(todo.id, editForm)
    setEditingId(null)
    setEditForm({ title: '', description: '', due_date: '', color: 'gray' })
  }

  const toggleCompleted = () => {
    onUpdate(todo.id, { completed: !todo.completed })
  }

  const toggleForWeek = () => {
    onUpdate(todo.id, { is_for_week: !todo.is_for_week })
  }

  const updateColor = async (newColor) => {
    await onUpdate(todo.id, { color: newColor })
    await onRefresh()
    setShowColorPicker(false)
  }
  
  const toggleForToday = () => {
    onUpdate(todo.id, { is_for_today: !todo.is_for_today })
  }

  const uploadFile = async (file) => {
    console.log('Uploading file:', file.name, 'to todo:', todo.id)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_URL}/todos/${todo.id}/upload`, {
        method: 'POST',
        body: formData
      })
      console.log('Upload response status:', response.status)
      const data = await response.json()
      console.log('Upload response data:', data)
      if (!response.ok) {
        console.error('Upload failed:', data)
        alert(`Upload failed: ${data.error || 'Unknown error'}`)
        return
      }
      await onRefresh()
    } catch (error) {
      console.error('Error uploading file:', error)
      alert(`Error uploading file: ${error.message}`)
    }
  }

  const deleteAttachment = async (filename) => {
    try {
      await fetch(`${API_URL}/todos/${todo.id}/attachments/${filename}`, {
        method: 'DELETE'
      })
      window.location.reload()
    } catch (error) {
      console.error('Error deleting attachment:', error)
    }
  }

  const getOriginalFilename = (filename) => {
    const parts = filename.split('_')
    return parts.slice(2).join('_')
  }

  const handleDragStart = (e) => {
    // Prevent drag if user is selecting text
    const selection = window.getSelection()
    if (selection && selection.toString().length > 0) {
      e.preventDefault()
      return
    }
    e.stopPropagation()
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', todo.id.toString())
    document.body.classList.add('dragging')
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    document.body.classList.remove('dragging')
    const draggedId = parseInt(e.dataTransfer.getData('text/plain'))
    if (draggedId !== todo.id) {
      await onMove(draggedId, todo.id, false)
    }
  }

  const handleDropAfter = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    document.body.classList.remove('dragging')
    const draggedId = parseInt(e.dataTransfer.getData('text/plain'))
    if (draggedId !== todo.id) {
      await onMove(draggedId, todo.id, true)
    }
  }

  const addComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      await fetch(`${API_URL}/todos/${todo.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newComment })
      })
      setNewComment('')
      setShowComments(false)
      await onRefresh()
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const deleteComment = async (commentId) => {
    try {
      await fetch(`${API_URL}/todos/${todo.id}/comments/${commentId}`, {
        method: 'DELETE'
      })
      await onRefresh()
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const updateComment = async (commentId) => {
    if (!editCommentText.trim()) return

    try {
      await fetch(`${API_URL}/todos/${todo.id}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editCommentText })
      })
      setEditingCommentId(null)
      setEditCommentText('')
      await onRefresh()
    } catch (error) {
      console.error('Error updating comment:', error)
    }
  }

  const uploadCommentAttachment = async (todoId, commentId, file) => {
    console.log('uploadCommentAttachment called with:', todoId, commentId, file.name)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch(`${API_URL}/todos/${todoId}/comments/${commentId}/attachments`, {
        method: 'POST',
        body: formData
      })
      console.log('Upload response status:', response.status)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Upload failed:', errorText)
      }
      await onRefresh()
    } catch (error) {
      console.error('Error uploading comment attachment:', error)
    }
  }

  const deleteCommentAttachment = async (todoId, commentId, filename) => {
    try {
      await fetch(`${API_URL}/todos/${todoId}/comments/${commentId}/attachments/${filename}`, {
        method: 'DELETE'
      })
      await onRefresh()
    } catch (error) {
      console.error('Error deleting comment attachment:', error)
    }
  }

  const handleAddChild = async (e) => {
    e.preventDefault()
    if (!newChildForm.title.trim()) return
    
    await onAddChild(todo.id, newChildForm)
    setNewChildForm({ title: '', description: '', due_date: '', color: 'gray' })
    setShowAddChild(false)
  }

  const hasChildren = todo.children && todo.children.length > 0

  return (
    <div className={`${level > 0 ? 'ml-8 mt-2' : ''}`}>
      {todo.parentPath && (
        <div className={`text-xs mb-1 flex items-center gap-1 flex-wrap ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <span>📁</span>
          {todo.parentPath.map((parent, idx) => (
            <span key={parent.id} className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (onNavigateToParent) {
                    onNavigateToParent(parent.id)
                  }
                }}
                className="hover:text-blue-600 hover:underline cursor-pointer"
              >
                {parent.title}
              </button>
              {idx < todo.parentPath.length - 1 && <span className="mx-1">›</span>}
            </span>
          ))}
        </div>
      )}
      <div
        id={`todo-${todo.id}`}
        className={`rounded-lg shadow-sm p-3 transition-all hover:shadow-md cursor-move border-l-4 ${
          todo.completed ? 'opacity-60' : ''
        } ${
          focusedTodoId === todo.id || todo.focused
            ? (darkMode ? 'bg-green-900 border-2 border-green-500' : 'bg-green-50 border-2 border-green-500')
            : (darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white')
        } ${
          COLORS.find(c => c.name === (todo.color || 'gray'))?.border || 'border-gray-400'
        }`}
        draggable={editingId !== todo.id && !expanded}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Description"
              rows="6"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(color => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setEditForm({ ...editForm, color: color.name })}
                    className={`w-8 h-8 rounded-full transition-all ${color.solid} ${
                      editForm.color === color.name
                        ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                        : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    title={color.label}
                  >
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <DatePicker
                value={editForm.due_date}
                onChange={(date) => setEditForm({ ...editForm, due_date: date })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Due date"
              />
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                title="Save changes"
              >
                <Save size={18} />
                Save
              </button>
              <button
                onClick={cancelEditing}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                title="Cancel editing"
              >
                <X size={18} />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {hasChildren && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                title={collapsed ? 'Expand subtasks' : 'Collapse subtasks'}
              >
                {collapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
              </button>
            )}
            
            <button
              onClick={toggleCompleted}
              className={`transition-colors flex-shrink-0 ${
                todo.completed 
                  ? 'text-green-500 hover:text-gray-400 hover:bg-gray-100 rounded-full p-0.5' 
                  : 'text-gray-400 hover:text-blue-600'
              }`}
              title={todo.completed ? 'Click to mark as incomplete (restore task)' : 'Mark as complete'}
            >
              {todo.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
            </button>
            
            <div 
              className="flex-1 cursor-pointer min-w-0"
              onClick={() => {
                // Don't toggle if user has selected text
                const selection = window.getSelection()
                if (selection && selection.toString().length > 0) {
                  return
                }
                setExpanded(!expanded)
              }}
            >
              <div className="flex items-center gap-2 flex-nowrap">
                <div 
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowColorPicker(!showColorPicker)
                  }}
                  className={`w-3 h-3 rounded-full flex-shrink-0 cursor-pointer hover:scale-125 transition-transform ${COLORS.find(c => c.name === (todo.color || 'gray'))?.solid || 'bg-gray-400'}`}
                  title="Click to change color"
                ></div>
                <h3 className={`text-base font-medium truncate min-w-0 ${todo.completed ? 'line-through text-gray-500' : (darkMode ? 'text-gray-100' : 'text-gray-800')}`}>
                  {todo.title}
                </h3>
                {(todo.due_date || todo.attachments?.length > 0 || todo.comments?.length > 0) && !expanded && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                    {todo.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {format(parseISO(todo.due_date), 'MMM d')}
                      </span>
                    )}
                    {todo.attachments?.length > 0 && (() => {
                      const firstImage = todo.attachments.find(att => /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(att))
                      return firstImage ? (
                        <img
                          src={`http://localhost:5000/uploads/${firstImage}`}
                          alt="preview"
                          className="h-8 w-8 object-cover rounded border border-gray-300"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="flex items-center gap-1">
                          <Paperclip size={12} />
                          {todo.attachments.length}
                        </span>
                      )
                    })()}
                    {todo.comments?.length > 0 && (
                      <span 
                        className="flex items-center gap-1 cursor-pointer hover:text-indigo-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpanded(true)
                        }}
                      >
                        <MessageSquare size={12} />
                        {todo.comments.length}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {showColorPicker && (
                <div className="mt-2 flex gap-2 items-center">
                  <span className="text-xs text-gray-500">Choose color:</span>
                  {COLORS.map((color) => (
                    <button
                      key={color.name}
                      onClick={(e) => {
                        e.stopPropagation()
                        updateColor(color.name)
                      }}
                      className={`w-6 h-6 rounded-full ${color.solid} hover:scale-110 transition-transform ${
                        todo.color === color.name ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                      title={color.label}
                    />
                  ))}
                </div>
              )}
              
              {expanded && (
                <div className="mt-2 space-y-2">
                  {todo.description && (
                    <p 
                      className="text-gray-600 text-sm" 
                      style={{whiteSpace: 'pre-wrap', userSelect: 'text'}}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      {linkifyText(todo.description)}
                    </p>
                  )}
                  {todo.due_date && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar size={16} />
                      {format(parseISO(todo.due_date), 'MMM d, yyyy')}
                    </div>
                  )}
                  {todo.attachments && todo.attachments.length > 0 && (
                    <div className="space-y-2">
                      {todo.attachments.map((attachment, idx) => {
                        const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(attachment)
                        return isImage ? (
                          <div key={idx} className="relative group">
                            <img
                              src={`http://localhost:5000/uploads/${attachment}`}
                              alt={getOriginalFilename(attachment)}
                              className="max-w-full h-auto rounded-lg border border-gray-200"
                              style={{maxHeight: '400px', objectFit: 'contain'}}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteAttachment(attachment)
                              }}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete image"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div key={idx} className="flex items-center gap-2 text-sm bg-gray-50 rounded px-2 py-1">
                            <FileText size={14} className="text-gray-500" />
                            <a
                              href={`http://localhost:5000/uploads/${attachment}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 text-blue-600 hover:underline truncate"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {getOriginalFilename(attachment)}
                            </a>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteAttachment(attachment)
                              }}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete attachment"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {todo.comments && todo.comments.length > 0 && (
                    <div className="mt-3">
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {todo.comments.length} {todo.comments.length === 1 ? 'comment' : 'comments'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {todo.comments.map((comment) => (
                          <div key={comment.id} className="bg-gray-50 rounded p-2 text-sm">
                            {editingCommentId === comment.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editCommentText}
                                  onChange={(e) => setEditCommentText(e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                  rows={15}
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      updateComment(comment.id)
                                    }}
                                    className="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 transition-colors"
                                    title="Save comment changes"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setEditingCommentId(null)
                                      setEditCommentText('')
                                    }}
                                    className="px-3 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500 transition-colors"
                                    title="Cancel editing comment"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-between items-start gap-2">
                                  <p 
                                    className="text-gray-700 flex-1" 
                                    style={{whiteSpace: 'pre-wrap', userSelect: 'text'}}
                                    onMouseDown={(e) => e.stopPropagation()}
                                  >
                                    {linkifyText(comment.text)}
                                  </p>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setEditingCommentId(comment.id)
                                        setEditCommentText(comment.text)
                                      }}
                                      className="text-gray-400 hover:text-blue-600 transition-colors"
                                      title="Edit comment"
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        deleteComment(comment.id)
                                      }}
                                      className="text-gray-400 hover:text-red-600 transition-colors"
                                      title="Delete comment"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                </div>
                                {comment.attachments && comment.attachments.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {comment.attachments.map((attachment, idx) => (
                                      <div key={idx} className="flex items-center gap-2 text-xs">
                                        <a
                                          href={`http://localhost:5000/uploads/${attachment}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline flex items-center gap-1"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Paperclip size={10} />
                                          {attachment.substring(16)}
                                        </a>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            deleteCommentAttachment(todo.id, comment.id, attachment)
                                          }}
                                          className="text-gray-400 hover:text-red-600 transition-colors"
                                          title="Delete attachment"
                                        >
                                          <X size={10} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <div className="flex items-center justify-between mt-1">
                                  <p className="text-xs text-gray-400">
                                    {format(parseISO(comment.created_at), 'MMM d, yyyy h:mm a')}
                                  </p>
                                  <label 
                                    className="cursor-pointer text-gray-400 hover:text-blue-600 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <input
                                      key={`comment-file-${comment.id}`}
                                      type="file"
                                      className="hidden"
                                      onChange={(e) => {
                                        console.log('File input onChange fired!', e.target.files)
                                        if (e.target.files && e.target.files[0]) {
                                          console.log('File selected:', e.target.files[0].name)
                                          uploadCommentAttachment(todo.id, comment.id, e.target.files[0])
                                          e.target.value = ''
                                        }
                                      }}
                                    />
                                    <Paperclip size={12} title="Add attachment to comment" />
                                  </label>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowComments(!showComments)
                  setEditingCommentId(null)
                  setEditCommentText('')
                }}
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                title="Add comment"
              >
                <MessageSquare size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowAddChild(!showAddChild)
                }}
                className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                title="Add subtask"
              >
                <Plus size={16} />
              </button>
              <label 
                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors cursor-pointer" 
                title="Attach file"
                onClick={(e) => e.stopPropagation()}
              >
                <Paperclip size={16} />
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      uploadFile(e.target.files[0])
                      e.target.value = ''
                    }
                  }}
                />
              </label>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  startEditing()
                }}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Edit task"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleForWeek()
                }}
                className={`px-2 py-1 rounded transition-colors font-semibold text-sm ${
                  todo.is_for_week
                    ? 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                    : 'text-gray-400 hover:bg-gray-100'
                }`}
                title={todo.is_for_week ? 'Remove from this week' : 'Add to this week'}
              >
                W
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleForToday()
                }}
                className={`p-1.5 rounded transition-colors ${
                  todo.is_for_today
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    : 'text-gray-400 hover:bg-gray-100'
                }`}
                title={todo.is_for_today ? 'Remove from today' : 'Mark for today'}
              >
                <Calendar size={16} fill={todo.is_for_today ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onUpdate(todo.id, { important: !todo.important })
                }}
                className={`p-1.5 rounded transition-colors ${
                  todo.important
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'text-gray-400 hover:bg-gray-100'
                }`}
                title={todo.important ? 'Remove important' : 'Mark as important'}
              >
                <AlertCircle size={16} fill={todo.important ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onFocus(todo.id, todo.focused)
                }}
                className={`p-1.5 rounded transition-colors ${
                  focusedTodoId === todo.id || todo.focused
                    ? 'bg-green-100 text-green-600 hover:bg-green-200'
                    : 'text-gray-400 hover:bg-gray-100'
                }`}
                title={focusedTodoId === todo.id ? 'Currently focused' : (todo.focused ? 'Click to unfocus' : 'Focus on this task')}
              >
                <Focus size={16} fill={focusedTodoId === todo.id || todo.focused ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(todo.id)
                }}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div 
        className="h-2 -mt-1 -mb-1"
        onDragOver={handleDragOver}
        onDrop={handleDropAfter}
      />

      {showComments && (
        <form onSubmit={addComment} className="mt-2 bg-indigo-50 rounded-lg p-3 flex gap-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            rows="15"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            title="Add comment"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setShowComments(false)
              setNewComment('')
            }}
            className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
            title="Cancel adding comment"
          >
            Cancel
          </button>
        </form>
      )}

      {showAddChild && (
        <form onSubmit={handleAddChild} className="ml-8 mt-2 bg-gray-50 rounded-lg p-4 space-y-3">
          <input
            type="text"
            value={newChildForm.title}
            onChange={(e) => setNewChildForm({ ...newChildForm, title: e.target.value })}
            placeholder="Subtask title..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            autoFocus
          />
          <textarea
            value={newChildForm.description}
            onChange={(e) => setNewChildForm({ ...newChildForm, description: e.target.value })}
            placeholder="Description (optional)..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            rows="6"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(color => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => setNewChildForm({ ...newChildForm, color: color.name })}
                  className={`w-8 h-8 rounded-full transition-all ${color.solid} ${
                    newChildForm.color === color.name
                      ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  title={color.label}
                >
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <DatePicker
              value={newChildForm.due_date}
              onChange={(date) => setNewChildForm({ ...newChildForm, due_date: date })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder="Due date"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              title="Add subtask"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddChild(false)
                setNewChildForm({ title: '', description: '', due_date: '', color: 'gray' })
              }}
              className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
              title="Cancel adding subtask"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {hasChildren && !collapsed && !hideChildren && (
        <div className="mt-2">
          {todo.children.map((child, index) => (
            <TodoItem
              key={child.id}
              todo={child}
              level={level + 1}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onMove={onMove}
              onRefresh={onRefresh}
              focusedTodoId={focusedTodoId}
              onFocus={onFocus}
              darkMode={darkMode}
              collapseAll={collapseAll}
              onNavigateToParent={onNavigateToParent}
              expandedTaskId={expandedTaskId}
              expandedTaskIds={expandedTaskIds}
            />
          ))}
          <div 
            className="ml-8 h-0 opacity-0 transition-all drop-zone"
            style={{ height: '0px', overflow: 'hidden' }}
            onDragOver={handleDragOver}
            onDrop={async (e) => {
              e.preventDefault()
              e.stopPropagation()
              document.body.classList.remove('dragging')
              const draggedId = parseInt(e.dataTransfer.getData('text/plain'))
              const lastChild = todo.children[todo.children.length - 1]
              if (lastChild && draggedId !== lastChild.id) {
                await onMove(draggedId, lastChild.id, true)
              }
            }}
          >
            <div className="h-8 bg-blue-50 border-2 border-dashed border-blue-300 rounded flex items-center justify-center text-blue-500 text-xs">
              Drop here to move to end
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState({ title: '', description: '', due_date: '', color: 'gray' })
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [focusedTodoId, setFocusedTodoId] = useState(null)
  const [collapseAll, setCollapseAll] = useState(null)
  const [expandedTaskId, setExpandedTaskId] = useState(null)
  const [expandedTaskIds, setExpandedTaskIds] = useState([])
  const [showAllForNavigation, setShowAllForNavigation] = useState(false)
  const [showReports, setShowReports] = useState(false)
  const [reportStartDate, setReportStartDate] = useState('')
  const [reportEndDate, setReportEndDate] = useState('')
  const [showCompletedPeriod, setShowCompletedPeriod] = useState(false)
  const [completedStartDate, setCompletedStartDate] = useState('')
  const [completedEndDate, setCompletedEndDate] = useState('')
  const [showWorkedPeriod, setShowWorkedPeriod] = useState(false)
  const [workedStartDate, setWorkedStartDate] = useState('')
  const [workedEndDate, setWorkedEndDate] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [searchText, setSearchText] = useState('')

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

  // Helper function to count all tasks including subtasks recursively
  const countAllTasks = (tasks) => {
    let count = 0
    tasks.forEach(task => {
      count++ // Count the task itself
      if (task.children && task.children.length > 0) {
        count += countAllTasks(task.children) // Recursively count children
      }
    })
    return count
  }

  // Helper function to count tasks matching a filter (not including subtasks)
  const countTasksByFilter = (tasks, filterFn) => {
    let count = 0
    tasks.forEach(task => {
      if (filterFn(task)) {
        count++
      }
      if (task.children && task.children.length > 0) {
        count += countTasksByFilter(task.children, filterFn)
      }
    })
    return count
  }

  // Calculate counts for each filter
  const getFilterCounts = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekStart = startOfWeek(today, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 })

    return {
      all: countAllTasks(todos),
      active: countTasksByFilter(todos, t => !t.completed),
      completed: countTasksByFilter(todos, t => t.completed),
      week: countTasksByFilter(todos, t => !t.completed && t.is_for_week),
      today: countTasksByFilter(todos, t => {
        if (t.completed) return false
        if (t.is_for_today) return true
        if (t.due_date) {
          const dueDate = new Date(t.due_date)
          dueDate.setHours(0, 0, 0, 0)
          return dueDate <= today
        }
        return false
      }),
      upcoming: countTasksByFilter(todos, t => {
        if (t.completed || !t.due_date) return false
        const dueDate = new Date(t.due_date)
        dueDate.setHours(0, 0, 0, 0)
        const nextWeek = new Date(today)
        nextWeek.setDate(nextWeek.getDate() + 7)
        return dueDate <= nextWeek
      }),
      important: countTasksByFilter(todos, t => !t.completed && t.important),
      worked: countTasksByFilter(todos, t => t.worked_today),
      colors: COLORS.reduce((acc, color) => {
        acc[color.name] = countTasksByFilter(todos, t => (t.color || 'gray') === color.name)
        return acc
      }, {})
    }
  }

  const filterCounts = getFilterCounts()

  // Search function: finds tasks matching title or comments, flattened with parent breadcrumbs
  const searchTodos = (todoList, query) => {
    if (!query.trim()) return todoList
    const lowerQuery = query.toLowerCase()
    
    const matchesTodo = (todo) => {
      if (todo.title && todo.title.toLowerCase().includes(lowerQuery)) return true
      if (todo.comments && todo.comments.some(c => c.text && c.text.toLowerCase().includes(lowerQuery))) return true
      return false
    }
    
    const collectMatching = (todos, parentPath = []) => {
      const result = []
      todos.forEach(todo => {
        if (matchesTodo(todo)) {
          result.push({
            ...todo,
            children: todo.children || [],
            parentPath: parentPath.length > 0 ? [...parentPath] : null
          })
        }
        if (todo.children && todo.children.length > 0) {
          result.push(...collectMatching(todo.children, [...parentPath, todo.title]))
        }
      })
      return result
    }
    
    return collectMatching(todoList)
  }

  const addTodo = async (e) => {
    e.preventDefault()
    console.log('addTodo called with:', newTodo)
    
    if (!newTodo.title.trim()) {
      console.log('Empty title, returning')
      return
    }
    
    if (loading) {
      console.log('Already submitting, ignoring')
      return
    }

    setLoading(true)
    console.log('Sending request to server...')
    try {
      const response = await fetch(`${API_URL}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTodo)
      })
      
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Server error:', errorData)
        alert(`Error adding task: ${errorData.error || 'Unknown error'}`)
        setLoading(false)
        return
      }
      
      const result = await response.json()
      console.log('Task created:', result)
      await fetchTodos()
      console.log('Todos refreshed')
      setNewTodo({ title: '', description: '', due_date: '', color: 'gray' })
      setShowAddForm(false)
      // Switch to 'all' filter to show the newly added task
      setFilter('all')
      setCompletedStartDate('')
      setCompletedEndDate('')
    } catch (error) {
      console.error('Error adding todo:', error)
      alert(`Error adding task: ${error.message}`)
    } finally {
      setLoading(false)
      console.log('Loading set to false')
    }
  }

  const addChildTodo = async (parentId, childData) => {
    try {
      const response = await fetch(`${API_URL}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...childData, parent_id: parentId })
      })
      await response.json()
      await fetchTodos()
    } catch (error) {
      console.error('Error adding child todo:', error)
    }
  }

  const updateTodo = async (id, updates) => {
    try {
      const response = await fetch(`${API_URL}/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      await response.json()
      await fetchTodos()
    } catch (error) {
      console.error('Error updating todo:', error)
    }
  }

  const deleteTodo = async (id) => {
    try {
      await fetch(`${API_URL}/todos/${id}`, { method: 'DELETE' })
      await fetchTodos()
    } catch (error) {
      console.error('Error deleting todo:', error)
    }
  }

  const moveTodo = async (draggedId, targetId, after = false) => {
    try {
      await fetch(`${API_URL}/todos/${draggedId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: targetId, after })
      })
      await fetchTodos()
    } catch (error) {
      console.error('Error moving todo:', error)
    }
  }

  const handleFocus = async (todoId, alreadyWorkedToday) => {
    try {
      if (alreadyWorkedToday) {
        // Unfocus - remove work session
        await fetch(`${API_URL}/todos/${todoId}/focus`, {
          method: 'DELETE'
        })
        if (focusedTodoId === todoId) {
          setFocusedTodoId(null)
        }
      } else {
        // Focus - add work session
        await fetch(`${API_URL}/todos/${todoId}/focus`, {
          method: 'POST'
        })
        setFocusedTodoId(todoId)
      }
      await fetchTodos()
    } catch (error) {
      console.error('Error focusing/unfocusing todo:', error)
    }
  }

  const countTodos = (todoList) => {
    let count = 0
    todoList.forEach(todo => {
      count++
      if (todo.children) {
        count += countTodos(todo.children)
      }
    })
    return count
  }

  const filterTodos = (todoList, filterType) => {
    const isSpecificFilter = filterType === 'today' || filterType === 'week' || filterType === 'upcoming' || filterType === 'important' || filterType === 'completed' || filterType === 'worked_today' || filterType === 'worked_week' || filterType === 'worked_range' || COLORS.find(c => c.name === filterType)
    
    // Helper function to check if a todo matches the filter
    const todoMatches = (todo) => {
      if (filterType === 'today') {
        if (todo.completed) return false
        // Show if marked for today OR if due today/overdue
        if (todo.is_for_today) return true
        if (!todo.due_date) return false
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const dueDate = new Date(todo.due_date)
        dueDate.setHours(0, 0, 0, 0)
        return dueDate <= today
      }
      if (filterType === 'upcoming') {
        if (todo.completed) return false
        if (!todo.due_date) return false
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const weekFromNow = new Date(today)
        weekFromNow.setDate(weekFromNow.getDate() + 7)
        const dueDate = new Date(todo.due_date)
        dueDate.setHours(0, 0, 0, 0)
        // Show if overdue, due today, or due within next 7 days
        return dueDate <= weekFromNow
      }
      if (filterType === 'week') return todo.is_for_week && !todo.completed
      if (filterType === 'worked_today') return todo.worked_today
      if (filterType === 'worked_week') {
        // Check if task has any work sessions this week (including today)
        // Include if worked on today
        if (todo.worked_today) return true
        // Or if has work sessions this week
        if (!todo.work_sessions || todo.work_sessions.length === 0) return false
        const today = new Date()
        const weekStart = startOfWeek(today, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
        return todo.work_sessions.some(session => {
          // Parse date as local time, not UTC
          const [year, month, day] = session.work_date.split('-').map(Number)
          const sessionDate = new Date(year, month - 1, day)
          return sessionDate >= weekStart && sessionDate <= weekEnd
        })
      }
      if (filterType === 'worked_range') {
        // Check if task has any work sessions in custom date range
        if (!todo.work_sessions || todo.work_sessions.length === 0) return false
        const start = new Date(workedStartDate)
        const end = new Date(workedEndDate)
        end.setHours(23, 59, 59, 999)
        return todo.work_sessions.some(session => {
          const sessionDate = new Date(session.work_date)
          return sessionDate >= start && sessionDate <= end
        })
      }
      if (filterType === 'important') return todo.important && !todo.completed
      if (filterType === 'completed') {
        // TEMPORARY: Just show all completed tasks to test
        return todo.completed
      }
      if (filterType === 'active') return !todo.completed
      if (COLORS.find(c => c.name === filterType)) return (todo.color === filterType) && !todo.completed
      return !todo.completed // 'all' shows only incomplete tasks
    }
    
    // Helper function to collect all matching todos from a tree (flattened) with parent path
    const collectMatching = (todoList, parentPath = []) => {
      const result = []
      todoList.forEach(todo => {
        if (todoMatches(todo)) {
          // Add matching todo with parent path stored and keep all children (for expanding)
          result.push({ 
            ...todo, 
            children: todo.children || [],
            parentPath: parentPath.length > 0 ? [...parentPath] : null
          })
        }
        if (todo.children && todo.children.length > 0) {
          // Build parent path for children
          const newPath = [...parentPath, { id: todo.id, title: todo.title }]
          result.push(...collectMatching(todo.children, newPath))
        }
      })
      return result
    }
    
    // For specific filters, return flat list of matching tasks
    if (isSpecificFilter) {
      const collected = collectMatching(todoList)
      
      // Sort by due date for upcoming filter
      if (filterType === 'upcoming') {
        return collected.sort((a, b) => {
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return new Date(a.due_date) - new Date(b.due_date)
        })
      }
      
      return collected
    }
    
    // For general filters (all, active), keep hierarchy
    return todoList.filter(todo => {
      if (todo.children && todo.children.length > 0) {
        todo.children = filterTodos(todo.children, filterType)
      }
      
      const matches = todoMatches(todo)
      if (matches) return true
      if (todo.children && todo.children.length > 0) return true
      
      return false
    })
  }

  const getCompletedInPeriod = () => {
    if (!completedStartDate || !completedEndDate) return []
    
    const filterCompleted = (todoList) => {
      let tasks = []
      todoList.forEach(todo => {
        if (todo.completed && todo.completed_at) {
          const completedDate = new Date(todo.completed_at)
          // Parse dates as local time, not UTC
          const [startYear, startMonth, startDay] = completedStartDate.split('-').map(Number)
          const [endYear, endMonth, endDay] = completedEndDate.split('-').map(Number)
          const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0)
          const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999)
          
          if (completedDate >= start && completedDate <= end) {
            tasks.push(todo)
          }
        }
        if (todo.children) {
          tasks = tasks.concat(filterCompleted(todo.children))
        }
      })
      return tasks
    }
    
    return filterCompleted(todos)
  }

  const preSearchTodos = showAllForNavigation 
    ? todos 
    : (filter === 'completed' && completedStartDate && completedEndDate 
      ? getCompletedInPeriod() 
      : filterTodos(JSON.parse(JSON.stringify(todos)), filter))

  const filteredTodos = searchTodos(preSearchTodos, searchText)

  const isSpecificFilter = filter === 'today' || filter === 'week' || filter === 'upcoming' || filter === 'important' || filter === 'completed' || filter === 'worked_today' || filter === 'worked_week' || filter === 'worked_range' || COLORS.find(c => c.name === filter)

  const generateReport = async (type) => {
    if (!reportStartDate || !reportEndDate) {
      alert('Please select both start and end dates')
      return
    }

    let markdown = `# ${type === 'completed' ? 'Completed Tasks' : 'Worked On Tasks'} Report\n\n`
    markdown += `Period: ${format(parseISO(reportStartDate), 'MMM d, yyyy')} - ${format(parseISO(reportEndDate), 'MMM d, yyyy')}\n\n`

    if (type === 'completed') {
      const filterCompleted = (todoList) => {
        let tasks = []
        todoList.forEach(todo => {
          if (todo.completed && todo.created_at) {
            const completedDate = new Date(todo.created_at)
            const start = new Date(reportStartDate)
            const end = new Date(reportEndDate)
            end.setHours(23, 59, 59, 999)
            
            if (completedDate >= start && completedDate <= end) {
              tasks.push(todo)
            }
          }
          if (todo.children) {
            tasks = tasks.concat(filterCompleted(todo.children))
          }
        })
        return tasks
      }

      const completedTasks = filterCompleted(todos)
      completedTasks.forEach(todo => {
        markdown += `- [x] **${todo.title}**\n`
        if (todo.description) {
          markdown += `  > ${todo.description}\n`
        }
        markdown += `\n`
      })

      markdown += `\n**Total: ${completedTasks.length} tasks completed**\n`
    } else {
      try {
        const response = await fetch(`${API_URL}/reports/work-sessions?start_date=${reportStartDate}&end_date=${reportEndDate}`)
        const data = await response.json()

        data.forEach(item => {
          const todo = item.todo
          markdown += `- [ ] **${todo.title}**`
          if (todo.is_for_week) markdown += ' ⭐'
          if (todo.important) markdown += ' 🔴'
          markdown += `\n`
          if (todo.description) {
            markdown += `  > ${todo.description}\n`
          }
          markdown += `  🎯 Worked on: ${item.work_dates.map(d => format(parseISO(d), 'MMM d')).join(', ')}\n`
          markdown += `\n`
        })

        markdown += `\n**Total: ${data.length} tasks worked on**\n`
      } catch (error) {
        console.error('Error fetching work sessions:', error)
        alert('Error generating report')
        return
      }
    }

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}-report-${reportStartDate}-to-${reportEndDate}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setShowReports(false)
  }

  const exportToMarkdown = () => {
    const generateMarkdown = (todoList, level = 0) => {
      let markdown = ''
      const indent = '  '.repeat(level)
      
      todoList.forEach(todo => {
        // Skip completed tasks
        if (todo.completed) return
        
        // Task line with checkbox
        const checkbox = '[ ]'
        const badges = []
        if (todo.is_for_week) badges.push('⭐')
        if (todo.important) badges.push('🔴')
        if (todo.worked_today) badges.push('🎯')
        const badgeStr = badges.length > 0 ? ' ' + badges.join(' ') : ''
        
        markdown += `${indent}- ${checkbox} **${todo.title}**${badgeStr}\n`
        
        // Description
        if (todo.description) {
          markdown += `${indent}  > ${todo.description}\n`
        }
        
        // Due date
        if (todo.due_date) {
          markdown += `${indent}  📅 ${format(parseISO(todo.due_date), 'MMM d, yyyy')}\n`
        }
        
        // Comments
        if (todo.comments && todo.comments.length > 0) {
          markdown += `${indent}  💬 Comments:\n`
          todo.comments.forEach(comment => {
            markdown += `${indent}    - ${comment.text}\n`
          })
        }
        
        // Attachments
        if (todo.attachments && todo.attachments.length > 0) {
          markdown += `${indent}  📎 Attachments: ${todo.attachments.join(', ')}\n`
        }
        
        // Children
        if (todo.children && todo.children.length > 0) {
          markdown += generateMarkdown(todo.children, level + 1)
        }
        
        markdown += '\n'
      })
      
      return markdown
    }
    
    const markdown = `# Todo List\n\nExported: ${format(new Date(), 'MMM d, yyyy h:mm a')}\n\n${generateMarkdown(todos)}`
    
    // Create download
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `todos-${format(new Date(), 'yyyy-MM-dd')}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const weekStart = format(startOfWeek(new Date()), 'MMM d')
  const weekEnd = format(endOfWeek(new Date()), 'MMM d, yyyy')

  return (
    <div className={`min-h-screen transition-colors ${darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <CheckCircle2 size={36} className="text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <h1 className={`text-4xl font-bold mb-1 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>TaskTree</h1>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Current week: {weekStart} - {weekEnd}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCollapseAll(prev => prev === true ? false : true)}
              className={`px-4 py-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              title={collapseAll ? 'Expand All Tasks' : 'Collapse All Tasks'}
            >
              {collapseAll ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setShowHelp(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              title="View User Manual"
            >
              <HelpCircle size={20} />
              Help
            </button>
            <button
              onClick={() => setShowReports(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              title="Generate Reports"
            >
              <BarChart3 size={20} />
              Reports
            </button>
            <button
              onClick={exportToMarkdown}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              title="Export to Markdown"
            >
              <Download size={20} />
              Export
            </button>
            <button
              onClick={async () => {
                try {
                  const response = await fetch(`${API_URL}/backup`, { method: 'POST' })
                  const data = await response.json()
                  if (data.success) {
                    alert(`✅ Database backed up successfully!\n\nFile: ${data.backup_file}`)
                  } else {
                    alert('❌ Backup failed: ' + (data.error || 'Unknown error'))
                  }
                } catch (error) {
                  alert('❌ Backup failed: ' + error.message)
                }
              }}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
              title="Create database backup"
            >
              <Database size={20} />
              Backup
            </button>
          </div>
        </div>

        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className={`w-full rounded-lg shadow-md p-4 mb-6 text-left transition-colors flex items-center gap-3 ${
              darkMode 
                ? 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-blue-400 hover:bg-gray-750' 
                : 'bg-white text-gray-400 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title="Add a new task"
          >
            <Plus size={24} />
            <span className="text-lg">Add new task...</span>
          </button>
        ) : (
          <form onSubmit={addTodo} className={`rounded-lg shadow-md p-6 mb-6 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="What needs to be done?"
                value={newTodo.title}
                onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                autoFocus
              />
              <textarea
                placeholder="Description (optional)"
                value={newTodo.description}
                onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                rows="6"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(color => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setNewTodo({ ...newTodo, color: color.name })}
                      className={`w-8 h-8 rounded-full transition-all ${color.solid} ${
                        newTodo.color === color.name
                          ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                          : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      title={color.label}
                    >
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-4">
                <DatePicker
                  value={newTodo.due_date}
                  onChange={(date) => setNewTodo({ ...newTodo, due_date: date })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Due date"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  title="Add new task"
                >
                  <Plus size={20} />
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setNewTodo({ title: '', description: '', due_date: '', color: 'gray' })
                  }}
                  className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
                  title="Cancel adding task"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        <div className={`rounded-lg shadow-md p-3 mb-6 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search tasks and comments..."
              className={`w-full pl-10 pr-10 py-2 rounded-lg border outline-none transition-colors ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500'
                  : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:bg-white'
              }`}
            />
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className={`rounded-lg shadow-md p-4 mb-6 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
          <div className="flex gap-2 items-center flex-wrap">
            <button
              onClick={() => {
                setFilter('all')
                setCompletedStartDate('')
                setCompletedEndDate('')
              }}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Show all incomplete tasks"
            >
              All
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                filter === 'all' ? 'bg-blue-500' : 'bg-gray-300'
              }`}>
                {filterCounts.all}
              </span>
            </button>
            <button
              onClick={() => {
                setFilter('week')
                setCompletedStartDate('')
                setCompletedEndDate('')
              }}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                filter === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Show incomplete tasks marked for this week"
            >
              This Week
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                filter === 'week' ? 'bg-blue-500' : 'bg-gray-300'
              }`}>
                {filterCounts.week}
              </span>
            </button>
            <button
              onClick={() => {
                setFilter('today')
                setCompletedStartDate('')
                setCompletedEndDate('')
              }}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                filter === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Show incomplete tasks due today or overdue"
            >
              Today
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                filter === 'today' ? 'bg-blue-500' : 'bg-gray-300'
              }`}>
                {filterCounts.today}
              </span>
            </button>
            <button
              onClick={() => {
                setFilter('important')
                setCompletedStartDate('')
                setCompletedEndDate('')
              }}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                filter === 'important' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Show incomplete important tasks"
            >
              <AlertCircle size={16} />
              Important
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                filter === 'important' ? 'bg-red-500' : 'bg-gray-300'
              }`}>
                {filterCounts.important}
              </span>
            </button>
            <button
              onClick={() => {
                setFilter('upcoming')
                setCompletedStartDate('')
                setCompletedEndDate('')
              }}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                filter === 'upcoming' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Show all tasks with deadlines (overdue, today, and next 7 days)"
            >
              Upcoming
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                filter === 'upcoming' ? 'bg-blue-500' : 'bg-gray-300'
              }`}>
                {filterCounts.upcoming}
              </span>
            </button>
            <button
              onClick={() => {
                setCompletedStartDate('')
                setCompletedEndDate('')
                setShowCompletedPeriod(true)
              }}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                filter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="View completed tasks"
            >
              <CheckCircle2 size={16} />
              Completed
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                filter === 'completed' ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {filterCounts.completed}
              </span>
            </button>
            <button
              onClick={() => setShowWorkedPeriod(true)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                filter === 'worked_today' || filter === 'worked_week' || filter === 'worked_range' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="View tasks worked on"
            >
              <Focus size={16} />
              Worked On
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                filter === 'worked_today' || filter === 'worked_week' || filter === 'worked_range' ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {filterCounts.worked}
              </span>
            </button>
            <div className="w-full border-t border-gray-300 my-2"></div>
            <div className="flex gap-2 items-center flex-wrap">
              <span className="text-sm text-gray-600 mr-2">Colors:</span>
              {COLORS.map(color => (
                <div key={color.name} className="relative">
                  <button
                    onClick={() => {
                      setFilter(color.name)
                      setCompletedStartDate('')
                      setCompletedEndDate('')
                    }}
                    className={`w-8 h-8 rounded-full transition-all ${color.solid} ${
                      filter === color.name
                        ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                        : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    title={`Show ${color.label} tasks (${filterCounts.colors[color.name]})`}
                  >
                  </button>
                  {filterCounts.colors[color.name] > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gray-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                      {filterCounts.colors[color.name]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {filteredTodos.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              No todos to display
            </div>
          ) : (
            <>
              {filteredTodos.map((todo, index) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  level={0}
                  onUpdate={updateTodo}
                  onDelete={deleteTodo}
                  onAddChild={addChildTodo}
                  onMove={moveTodo}
                  onRefresh={fetchTodos}
                  focusedTodoId={focusedTodoId}
                  onFocus={handleFocus}
                  darkMode={darkMode}
                  collapseAll={collapseAll}
                  hideChildren={isSpecificFilter && !showAllForNavigation}
                  onNavigateToParent={(parentId) => {
                    // Find the parent in todos
                    const findTodo = (list, id) => {
                      for (const t of list) {
                        if (t.id === id) return t
                        if (t.children) {
                          const found = findTodo(t.children, id)
                          if (found) return found
                        }
                      }
                      return null
                    }
                    const parentTodo = findTodo(todos, parentId)
                    
                    // Collect all ancestor IDs that need to be expanded
                    const ancestorIds = []
                    if (todo.parentPath && todo.parentPath.length > 0) {
                      ancestorIds.push(...todo.parentPath.map(p => p.id))
                    }
                    ancestorIds.push(parentId)
                    
                    // Temporarily show all todos to ensure parent is visible
                    setShowAllForNavigation(true)
                    setExpandedTaskIds(ancestorIds)
                    
                    // Poll for the element to appear with multiple retries
                    let attempts = 0
                    const maxAttempts = 20
                    const pollInterval = 100
                    
                    const pollForElement = () => {
                      attempts++
                      const parentElement = document.getElementById(`todo-${parentId}`)
                      
                      if (parentElement) {
                        parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        parentElement.classList.add('ring-2', 'ring-blue-500')
                        // Switch to 'all' filter immediately to keep parent visible
                        setFilter('all')
                        setShowAllForNavigation(false)
                        // Keep expandedTaskIds so tasks stay expanded
                        // Remove highlight after 2 seconds
                        setTimeout(() => {
                          parentElement.classList.remove('ring-2', 'ring-blue-500')
                        }, 2000)
                      } else if (attempts < maxAttempts) {
                        setTimeout(pollForElement, pollInterval)
                      } else {
                        setExpandedTaskIds([])
                        setShowAllForNavigation(false)
                      }
                    }
                    
                    // Start polling after a short delay
                    setTimeout(pollForElement, 100)
                  }}
                  expandedTaskId={expandedTaskId}
                  expandedTaskIds={expandedTaskIds}
                />
              ))}
              <div 
                className="h-0 opacity-0 transition-all drop-zone"
                style={{ height: '0px', overflow: 'hidden' }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                }}
                onDrop={async (e) => {
                  e.preventDefault()
                  document.body.classList.remove('dragging')
                  const draggedId = parseInt(e.dataTransfer.getData('text/plain'))
                  const lastTodo = filteredTodos[filteredTodos.length - 1]
                  if (lastTodo && draggedId !== lastTodo.id) {
                    await moveTodo(draggedId, lastTodo.id, true)
                  }
                }}
              >
                <div className="h-12 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center text-blue-500 text-sm">
                  Drop here to move to end
                </div>
              </div>
            </>
          )}
        </div>

        {showHelp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowHelp(false)}>
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-800">User Manual</h2>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Close manual"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6 text-gray-700">
                <section>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">📋 Basic Task Management</h3>
                  <ul className="space-y-2 ml-4">
                    <li><strong>Add Task:</strong> Click "Add new task..." button, fill in title, description (optional), due date (optional), and color</li>
                    <li><strong>Complete Task:</strong> Click the circle icon to mark as complete (✓)</li>
                    <li><strong>Uncomplete Task:</strong> Click the green checkmark (✓) on completed tasks to restore them to active</li>
                    <li><strong>Edit Task:</strong> Click the pencil icon (✏️) to edit title, description, due date, and color</li>
                    <li><strong>Delete Task:</strong> Click the trash icon (🗑️) to delete (also deletes all subtasks)</li>
                    <li><strong>Expand/Collapse:</strong> Click task title or arrow (▼/▶) to show/hide details and subtasks</li>
                    <li><strong>Collapse All:</strong> Click the collapse/expand button (top-right) to collapse or expand all tasks at once</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">🌳 Hierarchical Tasks</h3>
                  <ul className="space-y-2 ml-4">
                    <li><strong>Add Subtask:</strong> Click the plus icon (➕) on any task to add a subtask underneath</li>
                    <li><strong>Unlimited Nesting:</strong> Subtasks can have their own subtasks, creating deep hierarchies</li>
                    <li><strong>Drag & Drop:</strong> Click and drag tasks to reorder them or move between parents</li>
                    <li><strong>Drop Zones:</strong> Appear when dragging - drop above, below, or at end of lists</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">� Color Coding</h3>
                  <ul className="space-y-2 ml-4">
                    <li><strong>7 Colors Available:</strong> Gray, Red, Orange, Yellow, Green, Blue, Purple</li>
                    <li><strong>Flexible Use:</strong> Use colors however you want - priorities, categories, projects, contexts, etc.</li>
                    <li><strong>Visual Indicators:</strong> Each task shows a colored left border AND a small colored dot next to the title</li>
                    <li><strong>Quick Color Change:</strong> Click the colored dot next to any task title to instantly change its color</li>
                    <li><strong>Color Picker:</strong> Colored circles when creating or editing tasks - click to select</li>
                    <li><strong>Color Filters:</strong> Click color circles below main filters to show only tasks of that color</li>
                    <li><strong>Filter Count Badges:</strong> Each filter button shows the number of matching tasks</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">🏷️ Task Properties</h3>
                  <ul className="space-y-2 ml-4">
                    <li><strong>W This Week:</strong> Mark tasks for this week (purple "W" button)</li>
                    <li><strong>📅 Today:</strong> Mark tasks for today (blue calendar icon)</li>
                    <li><strong>� Focus:</strong> Click to mark you're working on it today (green target icon, stays green)</li>
                    <li><strong>🔴 Important:</strong> Flag critical tasks (red alert icon)</li>
                    <li><strong>� Color:</strong> Assign colors to categorize tasks (colored dot next to title)</li>
                    <li><strong>📎 Attachments:</strong> Click paperclip to attach files to tasks</li>
                    <li><strong>📅 Due Date:</strong> Set deadlines when creating or editing tasks</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">💬 Comments & Notes</h3>
                  <ul className="space-y-2 ml-4">
                    <li><strong>Add Comment:</strong> Click message icon (💬) to add a comment/note</li>
                    <li><strong>Multiple Comments:</strong> Each task can have unlimited separate comments</li>
                    <li><strong>Edit Comment:</strong> Click pencil icon on any comment to edit it</li>
                    <li><strong>Delete Comment:</strong> Click X icon to remove a comment</li>
                    <li><strong>Comment Attachments:</strong> Click paperclip icon (📎) on any comment to attach files</li>
                    <li><strong>View Comments:</strong> Click comment count when task is collapsed to expand and view</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">🔍 Filters & Views</h3>
                  <ul className="space-y-2 ml-4">
                    <li><strong>All:</strong> Shows all incomplete tasks with full hierarchy</li>
                    <li><strong>This Week:</strong> Shows tasks marked for this week (flat list with parent breadcrumbs)</li>
                    <li><strong>Today:</strong> Shows tasks marked for today OR tasks due today/overdue (flat list)</li>
                    <li><strong>Upcoming:</strong> Shows all tasks with deadlines - overdue, today, and next 7 days, sorted by date (flat list)</li>
                    <li><strong>Important:</strong> Shows important tasks (flat list)</li>
                    <li><strong>Completed:</strong> Opens dialog with options:
                      <ul className="ml-4 mt-1 space-y-1">
                        <li>• Today - Tasks completed today</li>
                        <li>• This Week - Tasks completed this week</li>
                        <li>• Custom Range - Select specific date range</li>
                      </ul>
                    </li>
                    <li><strong>Worked On:</strong> Opens dialog to view tasks you focused on (🎯 button):
                      <ul className="ml-4 mt-1 space-y-1">
                        <li>• Today - Tasks worked on today</li>
                        <li>• This Week - Tasks worked on this week (includes today)</li>
                        <li>• Custom Range - Select specific date range</li>
                      </ul>
                    </li>
                    <li><strong>Color Filters:</strong> Click colored circles to filter by specific color (flat list)</li>
                    <li><strong>Parent Breadcrumbs:</strong> In filtered views, see task location (📁 Parent › Grandparent)</li>
                    <li><strong>Expand in Filters:</strong> Click arrow to see subtasks even in filtered views</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">📊 Reports & Export</h3>
                  <ul className="space-y-2 ml-4">
                    <li><strong>Export:</strong> Download all active tasks as markdown file (excludes completed)</li>
                    <li><strong>Completed Report:</strong> Generate markdown report of tasks completed in date range</li>
                    <li><strong>Worked On Report:</strong> Generate report of tasks you focused on in date range</li>
                    <li><strong>Reports Button:</strong> Opens dialog to select date range and report type</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">🌙 Appearance</h3>
                  <ul className="space-y-2 ml-4">
                    <li><strong>Dark Mode:</strong> Click moon/sun icon in top-right to toggle dark mode</li>
                    <li><strong>Smooth Transitions:</strong> All theme changes animate smoothly</li>
                    <li><strong>Persistent:</strong> Your theme preference is saved</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">💡 Tips & Tricks</h3>
                  <ul className="space-y-2 ml-4">
                    <li>Hover over any button to see what it does</li>
                    <li>Use Focus (🎯) to track tasks you work on - click again to undo, then view with "Worked On" filter</li>
                    <li>Mark tasks for "Today" (📅) for immediate focus, "This Week" (W) for weekly planning</li>
                    <li>Use colors consistently for better organization (e.g., Red = urgent, Blue = work)</li>
                    <li>The colored dot next to task titles makes it easy to see categories at a glance</li>
                    <li>Use subtasks to break down complex tasks into manageable steps</li>
                    <li>In filtered views, expand tasks to see their subtasks even if they don't match the filter</li>
                    <li>Comments are great for tracking progress notes and updates - you can attach files to comments too!</li>
                    <li>Drag & drop works for reordering at any level of the hierarchy</li>
                    <li>Try dark mode for reduced eye strain in low-light environments</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">⌨️ Quick Reference</h3>
                  <div className="grid grid-cols-2 gap-4 ml-4">
                    <div>
                      <p className="font-semibold mb-2">Icons:</p>
                      <ul className="space-y-1 text-sm">
                        <li>○/✓ - Complete/Incomplete</li>
                        <li>✏️ - Edit</li>
                        <li>W - This Week (Purple)</li>
                        <li>📅 - Today (Blue)</li>
                        <li>🎯 - Focus (Green)</li>
                        <li>🔴 - Important (Red)</li>
                        <li>🎨 - Color Dot</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">More Icons:</p>
                      <ul className="space-y-1 text-sm">
                        <li>💬 - Comments</li>
                        <li>➕ - Add Subtask</li>
                        <li>📎 - Attachments</li>
                        <li>🗑️ - Delete</li>
                        <li>▼/▶ - Expand/Collapse</li>
                        <li>🌙/☀️ - Dark/Light Mode</li>
                      </ul>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        {showCompletedPeriod && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowCompletedPeriod(false)}>
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Completed Tasks Period</h2>
                <button
                  onClick={() => setShowCompletedPeriod(false)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Close dialog"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const today = new Date()
                      const localDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
                      const dateStr = localDate.toISOString().split('T')[0]
                      // Set dates first, then filter in next render cycle
                      setCompletedStartDate(dateStr)
                      setCompletedEndDate(dateStr)
                      setShowCompletedPeriod(false)
                      // Use setTimeout to ensure state updates before setting filter
                      setTimeout(() => setFilter('completed'), 10)
                    }}
                    className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                    title="View tasks completed today"
                  >
                    Today
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const today = new Date()
                      const weekStart = startOfWeek(today, { weekStartsOn: 1 })
                      const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
                      setCompletedStartDate(weekStart.toISOString().split('T')[0])
                      setCompletedEndDate(weekEnd.toISOString().split('T')[0])
                      setShowCompletedPeriod(false)
                      setTimeout(() => setFilter('completed'), 10)
                    }}
                    className="flex-1 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium"
                    title="View tasks completed this week"
                  >
                    This Week
                  </button>
                </div>

                <div className="text-center text-sm text-gray-500 font-medium">
                  Or select custom range:
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <DatePicker
                    value={completedStartDate}
                    onChange={setCompletedStartDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Start date"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <DatePicker
                    value={completedEndDate}
                    onChange={setCompletedEndDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="End date"
                  />
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => {
                      if (completedStartDate && completedEndDate) {
                        setFilter('completed')
                        setShowCompletedPeriod(false)
                      } else {
                        alert('Please select both start and end dates')
                      }
                    }}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    title="View completed tasks in this period"
                  >
                    <CheckCircle2 size={20} />
                    View Completed Tasks
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showWorkedPeriod && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowWorkedPeriod(false)}>
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Tasks Worked On</h2>
                <button
                  onClick={() => setShowWorkedPeriod(false)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Close dialog"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setFilter('worked_today')
                      setCompletedStartDate('')
                      setCompletedEndDate('')
                      setShowWorkedPeriod(false)
                    }}
                    className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
                    title="View tasks worked on today"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      setFilter('worked_week')
                      setCompletedStartDate('')
                      setCompletedEndDate('')
                      setShowWorkedPeriod(false)
                    }}
                    className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
                    title="View tasks worked on this week"
                  >
                    This Week
                  </button>
                </div>

                <div className="text-center text-sm text-gray-500 font-medium">
                  Or select custom range:
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <DatePicker
                    value={workedStartDate}
                    onChange={setWorkedStartDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Start date"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <DatePicker
                    value={workedEndDate}
                    onChange={setWorkedEndDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="End date"
                  />
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => {
                      if (workedStartDate && workedEndDate) {
                        setFilter('worked_range')
                        setShowWorkedPeriod(false)
                      } else {
                        alert('Please select both start and end dates')
                      }
                    }}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    title="View tasks worked on in this period"
                  >
                    <Focus size={20} />
                    View Worked Tasks
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showReports && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowReports(false)}>
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Generate Report</h2>
                <button
                  onClick={() => setShowReports(false)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Close reports dialog"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <DatePicker
                    value={reportStartDate}
                    onChange={setReportStartDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Start date"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <DatePicker
                    value={reportEndDate}
                    onChange={setReportEndDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="End date"
                  />
                </div>

                <div className="pt-4 space-y-2">
                  <button
                    onClick={() => generateReport('completed')}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    title="Generate report of tasks completed in date range"
                  >
                    <CheckCircle2 size={20} />
                    Completed Tasks Report
                  </button>
                  <button
                    onClick={() => generateReport('worked')}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    title="Generate report of tasks worked on in date range"
                  >
                    <Focus size={20} />
                    Worked On Tasks Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
