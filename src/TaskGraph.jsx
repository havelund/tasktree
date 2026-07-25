import { useState, useEffect, useRef } from 'react'
import { instance } from '@viz-js/viz'
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

const COLORS_MAP = {
  gray: '#9CA3AF',
  red: '#EF4444',
  orange: '#F97316',
  yellow: '#EAB308',
  green: '#22C55E',
  blue: '#3B82F6',
  purple: '#A855F7',
}

function TaskGraph({ todos, darkMode, onClose, onNavigateToTask }) {
  const containerRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  const [layout, setLayout] = useState('LR')

  useEffect(() => {
    const generateGraph = async () => {
      const viz = await instance()
      const dot = generateDot(todos)
      const svg = viz.renderSVGElement(dot)
      
      // Keep native SVG size for scrolling
      svg.style.minWidth = svg.getAttribute('width')
      svg.style.minHeight = svg.getAttribute('height')

      // Make nodes clickable with direct DOM event handlers
      const nodes = svg.querySelectorAll('.node')
      nodes.forEach(node => {
        node.style.cursor = 'pointer'
        node.addEventListener('click', (e) => {
          e.stopPropagation()
          const titleEl = node.querySelector('title')
          if (titleEl) {
            const todoId = parseInt(titleEl.textContent)
            if (!isNaN(todoId)) {
              onNavigateToTask(todoId)
            }
          }
        })
      })

      if (containerRef.current) {
        containerRef.current.innerHTML = ''
        containerRef.current.appendChild(svg)
      }
    }

    generateGraph()
  }, [todos, layout])

  const generateDot = (todoList) => {
    const bgColor = darkMode ? '#1F2937' : '#FFFFFF'
    const fontColor = darkMode ? '#F3F4F6' : '#1F2937'
    const edgeColor = darkMode ? '#6B7280' : '#9CA3AF'

    let dot = `digraph TaskTree {\n`
    dot += `  bgcolor="${bgColor}";\n`
    dot += `  rankdir=${layout};\n`
    dot += `  nodesep=0.4;\n`
    dot += `  ranksep=0.6;\n`
    dot += `  node [shape=box, style="rounded,filled", fontname="Arial", fontsize=13, fontcolor="${fontColor}", margin="0.3,0.15"];\n`
    dot += `  edge [color="${edgeColor}", arrowsize=0.7];\n`
    dot += `\n`

    const addNodes = (tasks, parentId = null) => {
      tasks.forEach(todo => {
        if (todo.completed) return

        const color = COLORS_MAP[todo.color || 'gray'] || COLORS_MAP.gray
        const lightColor = color + '30'
        const label = todo.title.length > 35 
          ? todo.title.substring(0, 32) + '...' 
          : todo.title
        const escapedLabel = label.replace(/"/g, '\\"').replace(/\n/g, ' ')

        let extras = ''
        if (todo.important) extras += ' ⭐'
        if (todo.is_for_today) extras += ' 📅'

        dot += `  ${todo.id} [label="${escapedLabel}${extras}", fillcolor="${lightColor}", color="${color}"];\n`

        if (parentId !== null) {
          dot += `  ${parentId} -> ${todo.id};\n`
        }

        if (todo.children && todo.children.length > 0) {
          addNodes(todo.children, todo.id)
        }
      })
    }

    addNodes(todoList)
    dot += `}\n`
    return dot
  }

  const handleZoom = (delta) => {
    setZoom(z => Math.max(0.2, Math.min(3, z + delta)))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div 
        className={`relative w-[95vw] h-[90vh] rounded-xl shadow-2xl flex flex-col ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            Task Graph
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLayout(l => l === 'LR' ? 'TB' : 'LR')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Toggle layout direction"
            >
              {layout === 'LR' ? '→ Horizontal' : '↓ Vertical'}
            </button>
            <button
              onClick={() => handleZoom(-0.2)}
              className={`p-1.5 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Zoom out"
            >
              <ZoomOut size={18} />
            </button>
            <span className={`text-sm min-w-[3rem] text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => handleZoom(0.2)}
              className={`p-1.5 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Zoom in"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={() => setZoom(1)}
              className={`p-1.5 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Reset zoom"
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Close graph"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div 
            ref={containerRef} 
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', transition: 'transform 0.2s' }}
          />
        </div>
      </div>
    </div>
  )
}

export default TaskGraph
