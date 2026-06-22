from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime, date
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'doc', 'docx', 'xls', 'xlsx', 'zip'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

engine = create_engine('sqlite:///todos.db', echo=True)
Base = declarative_base()
Session = sessionmaker(bind=engine)

class Todo(Base):
    __tablename__ = 'todos'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    description = Column(String(500))
    due_date = Column(DateTime)
    is_for_week = Column(Boolean, default=False)
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    attachments = Column(String(1000))
    parent_id = Column(Integer, nullable=True)
    sort_order = Column(Integer, default=0)
    important = Column(Boolean, default=False)
    color = Column(String(20), default='gray')
    is_for_today = Column(Boolean, default=False)
    focused = Column(Boolean, default=False)

    def to_dict(self, include_children=False, session=None):
        attachments = []
        if self.attachments:
            attachments = self.attachments.split('|') if self.attachments else []
        
        result = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'is_for_week': self.is_for_week,
            'completed': self.completed,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat(),
            'attachments': attachments,
            'parent_id': self.parent_id,
            'sort_order': self.sort_order or 0,
            'important': self.important or False,
            'color': self.color or 'gray',
            'is_for_today': self.is_for_today or False,
            'focused': self.focused or False
        }
        
        if include_children and session:
            children = session.query(Todo).filter(Todo.parent_id == self.id).order_by(Todo.sort_order.asc(), Todo.created_at.asc()).all()
            result['children'] = [child.to_dict(include_children=True, session=session) for child in children]
        
        if session:
            comments = session.query(Comment).filter(Comment.todo_id == self.id).order_by(Comment.created_at.asc()).all()
            result['comments'] = [comment.to_dict() for comment in comments]
            
            # Get work sessions
            work_sessions = session.query(WorkSession).filter(WorkSession.todo_id == self.id).order_by(WorkSession.work_date.desc()).all()
            result['work_sessions'] = [{'work_date': ws.work_date.isoformat()} for ws in work_sessions]
            
            # Check if worked on today
            today = date.today()
            worked_today = any(ws.work_date == today for ws in work_sessions)
            result['worked_today'] = worked_today
        else:
            result['comments'] = []
            result['work_sessions'] = []
            result['worked_today'] = False
        
        return result

class Comment(Base):
    __tablename__ = 'comments'
    
    id = Column(Integer, primary_key=True)
    todo_id = Column(Integer, nullable=False)
    text = Column(String(1000), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    attachments = Column(String(1000))
    
    def to_dict(self):
        attachments = []
        if self.attachments:
            attachments = self.attachments.split('|') if self.attachments else []
        
        return {
            'id': self.id,
            'todo_id': self.todo_id,
            'text': self.text,
            'created_at': self.created_at.isoformat(),
            'attachments': attachments
        }

class WorkSession(Base):
    __tablename__ = 'work_sessions'
    
    id = Column(Integer, primary_key=True)
    todo_id = Column(Integer, nullable=False)
    work_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'todo_id': self.todo_id,
            'work_date': self.work_date.isoformat(),
            'created_at': self.created_at.isoformat()
        }

Base.metadata.create_all(engine)

@app.route('/api/todos', methods=['GET'])
def get_todos():
    session = Session()
    try:
        root_todos = session.query(Todo).filter(Todo.parent_id == None).order_by(Todo.sort_order.asc(), Todo.created_at.desc()).all()
        return jsonify([todo.to_dict(include_children=True, session=session) for todo in root_todos])
    finally:
        session.close()

@app.route('/api/todos', methods=['POST'])
def create_todo():
    session = Session()
    try:
        data = request.json
        due_date = None
        if data.get('due_date'):
            due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
        
        parent_id = data.get('parent_id')
        
        max_sort_order = session.query(Todo).filter(Todo.parent_id == parent_id).count()
        
        todo = Todo(
            title=data['title'],
            description=data.get('description', ''),
            due_date=due_date,
            is_for_week=data.get('is_for_week', False),
            parent_id=parent_id,
            sort_order=max_sort_order,
            color=data.get('color', 'gray')
        )
        session.add(todo)
        session.commit()
        return jsonify(todo.to_dict(include_children=True, session=session)), 201
    finally:
        session.close()

@app.route('/api/todos/<int:todo_id>', methods=['PUT'])
def update_todo(todo_id):
    session = Session()
    try:
        todo = session.query(Todo).get(todo_id)
        if not todo:
            return jsonify({'error': 'Todo not found'}), 404
        
        data = request.json
        if 'title' in data:
            todo.title = data['title']
        if 'description' in data:
            todo.description = data['description']
        if 'due_date' in data:
            if data['due_date']:
                todo.due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
            else:
                todo.due_date = None
        if 'is_for_week' in data:
            todo.is_for_week = data['is_for_week']
        if 'completed' in data:
            was_completed = todo.completed
            todo.completed = data['completed']
            # Set completed_at when marking as completed, clear when uncompleting
            if data['completed'] and not was_completed:
                todo.completed_at = datetime.now()
            elif not data['completed'] and was_completed:
                todo.completed_at = None
        if 'parent_id' in data:
            todo.parent_id = data['parent_id']
        if 'important' in data:
            todo.important = data['important']
        if 'color' in data:
            todo.color = data['color']
        if 'is_for_today' in data:
            todo.is_for_today = data['is_for_today']
        
        session.commit()
        return jsonify(todo.to_dict(include_children=True, session=session))
    finally:
        session.close()

def delete_todo_recursive(session, todo_id):
    children = session.query(Todo).filter(Todo.parent_id == todo_id).all()
    for child in children:
        delete_todo_recursive(session, child.id)
    
    todo = session.query(Todo).get(todo_id)
    if todo:
        if todo.attachments:
            for attachment in todo.attachments.split('|'):
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], attachment)
                if os.path.exists(filepath):
                    os.remove(filepath)
        session.delete(todo)

@app.route('/api/todos/<int:todo_id>', methods=['DELETE'])
def delete_todo(todo_id):
    session = Session()
    try:
        todo = session.query(Todo).get(todo_id)
        if not todo:
            return jsonify({'error': 'Todo not found'}), 404
        
        delete_todo_recursive(session, todo_id)
        session.commit()
        return '', 204
    finally:
        session.close()

@app.route('/api/todos/<int:todo_id>/upload', methods=['POST'])
def upload_file(todo_id):
    session = Session()
    try:
        todo = session.query(Todo).get(todo_id)
        if not todo:
            return jsonify({'error': 'Todo not found'}), 404
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            unique_filename = f"{todo_id}_{timestamp}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(filepath)
            
            existing_attachments = todo.attachments.split('|') if todo.attachments else []
            existing_attachments.append(unique_filename)
            todo.attachments = '|'.join(existing_attachments)
            
            session.commit()
            return jsonify(todo.to_dict(include_children=True, session=session))
        
        return jsonify({'error': 'File type not allowed'}), 400
    finally:
        session.close()

@app.route('/api/todos/<int:todo_id>/attachments/<filename>', methods=['DELETE'])
def delete_attachment(todo_id, filename):
    session = Session()
    try:
        todo = session.query(Todo).get(todo_id)
        if not todo:
            return jsonify({'error': 'Todo not found'}), 404
        
        if todo.attachments:
            attachments = todo.attachments.split('|')
            if filename in attachments:
                attachments.remove(filename)
                todo.attachments = '|'.join(attachments) if attachments else None
                
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                if os.path.exists(filepath):
                    os.remove(filepath)
                
                session.commit()
                return jsonify(todo.to_dict(include_children=True, session=session))
        
        return jsonify({'error': 'Attachment not found'}), 404
    finally:
        session.close()

@app.route('/uploads/<filename>')
def download_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/todos/<int:todo_id>/move', methods=['POST'])
def move_todo(todo_id):
    session = Session()
    try:
        data = request.json
        target_id = data.get('target_id')
        after = data.get('after', False)
        
        dragged_todo = session.query(Todo).get(todo_id)
        target_todo = session.query(Todo).get(target_id)
        
        if not dragged_todo or not target_todo:
            return jsonify({'error': 'Todo not found'}), 404
        
        if dragged_todo.parent_id != target_todo.parent_id:
            return jsonify({'error': 'Cannot move between different parents'}), 400
        
        siblings = session.query(Todo).filter(Todo.parent_id == dragged_todo.parent_id).order_by(Todo.sort_order.asc(), Todo.created_at.asc()).all()
        
        dragged_index = next((i for i, t in enumerate(siblings) if t.id == todo_id), None)
        target_index = next((i for i, t in enumerate(siblings) if t.id == target_id), None)
        
        if dragged_index is None or target_index is None:
            return jsonify({'error': 'Todo not found in siblings'}), 404
        
        dragged_item = siblings.pop(dragged_index)
        
        if after:
            if dragged_index < target_index:
                siblings.insert(target_index, dragged_item)
            else:
                siblings.insert(target_index + 1, dragged_item)
        else:
            siblings.insert(target_index, dragged_item)
        
        for i, sibling in enumerate(siblings):
            sibling.sort_order = i
        
        session.commit()
        return jsonify({'success': True})
    finally:
        session.close()

@app.route('/api/todos/<int:todo_id>/comments', methods=['POST'])
def add_comment(todo_id):
    session = Session()
    try:
        todo = session.query(Todo).get(todo_id)
        if not todo:
            return jsonify({'error': 'Todo not found'}), 404
        
        data = request.json
        comment = Comment(
            todo_id=todo_id,
            text=data['text']
        )
        session.add(comment)
        session.commit()
        return jsonify(comment.to_dict()), 201
    finally:
        session.close()

@app.route('/api/todos/<int:todo_id>/comments/<int:comment_id>', methods=['PUT'])
def update_comment(todo_id, comment_id):
    session = Session()
    try:
        comment = session.query(Comment).filter(Comment.id == comment_id, Comment.todo_id == todo_id).first()
        if not comment:
            return jsonify({'error': 'Comment not found'}), 404
        
        data = request.json
        if 'text' in data:
            comment.text = data['text']
        
        session.commit()
        return jsonify(comment.to_dict())
    finally:
        session.close()

@app.route('/api/todos/<int:todo_id>/comments/<int:comment_id>', methods=['DELETE'])
def delete_comment(todo_id, comment_id):
    session = Session()
    try:
        comment = session.query(Comment).filter(Comment.id == comment_id, Comment.todo_id == todo_id).first()
        if not comment:
            return jsonify({'error': 'Comment not found'}), 404
        
        # Delete comment attachments
        if comment.attachments:
            for attachment in comment.attachments.split('|'):
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], attachment)
                if os.path.exists(filepath):
                    os.remove(filepath)
        
        session.delete(comment)
        session.commit()
        return '', 204
    finally:
        session.close()

@app.route('/api/todos/<int:todo_id>/comments/<int:comment_id>/attachments', methods=['POST'])
def add_comment_attachment(todo_id, comment_id):
    session = Session()
    try:
        comment = session.query(Comment).filter(Comment.id == comment_id, Comment.todo_id == todo_id).first()
        if not comment:
            return jsonify({'error': 'Comment not found'}), 404
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file:
            filename = secure_filename(file.filename)
            unique_filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(filepath)
            
            existing_attachments = comment.attachments.split('|') if comment.attachments else []
            existing_attachments.append(unique_filename)
            comment.attachments = '|'.join(existing_attachments)
            
            session.commit()
            return jsonify(comment.to_dict())
    finally:
        session.close()

@app.route('/api/todos/<int:todo_id>/comments/<int:comment_id>/attachments/<filename>', methods=['DELETE'])
def delete_comment_attachment(todo_id, comment_id, filename):
    session = Session()
    try:
        comment = session.query(Comment).filter(Comment.id == comment_id, Comment.todo_id == todo_id).first()
        if not comment:
            return jsonify({'error': 'Comment not found'}), 404
        
        if comment.attachments:
            attachments = comment.attachments.split('|')
            if filename in attachments:
                attachments.remove(filename)
                comment.attachments = '|'.join(attachments) if attachments else None
                
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                if os.path.exists(filepath):
                    os.remove(filepath)
                
                session.commit()
                return jsonify(comment.to_dict())
        
        return jsonify({'error': 'Attachment not found'}), 404
    finally:
        session.close()

@app.route('/api/todos/<int:todo_id>/focus', methods=['POST', 'DELETE'])
def focus_todo(todo_id):
    session = Session()
    try:
        todo = session.query(Todo).get(todo_id)
        if not todo:
            return jsonify({'error': 'Todo not found'}), 404
        
        today = date.today()
        
        if request.method == 'DELETE':
            # Unfocus - set focused to false but keep work session
            todo.focused = False
            session.commit()
            return jsonify({'success': True, 'focused': False, 'worked_today': True})
        else:
            # POST - Set focused and add work session for today
            # Unfocus all other tasks first
            session.query(Todo).update({Todo.focused: False})
            
            # Focus this task
            todo.focused = True
            
            # Check if already worked on today
            existing = session.query(WorkSession).filter(
                WorkSession.todo_id == todo_id,
                WorkSession.work_date == today
            ).first()
            
            if not existing:
                work_session = WorkSession(
                    todo_id=todo_id,
                    work_date=today
                )
                session.add(work_session)
            
            session.commit()
            return jsonify({'success': True, 'focused': True, 'worked_today': True})
    finally:
        session.close()

@app.route('/api/reports/work-sessions', methods=['GET'])
def get_work_sessions():
    session = Session()
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not start_date or not end_date:
            return jsonify({'error': 'start_date and end_date required'}), 400
        
        start = datetime.fromisoformat(start_date).date()
        end = datetime.fromisoformat(end_date).date()
        
        work_sessions = session.query(WorkSession).filter(
            WorkSession.work_date >= start,
            WorkSession.work_date <= end
        ).all()
        
        # Get unique todo IDs
        todo_ids = list(set([ws.todo_id for ws in work_sessions]))
        todos = session.query(Todo).filter(Todo.id.in_(todo_ids)).all()
        
        result = []
        for todo in todos:
            sessions = [ws for ws in work_sessions if ws.todo_id == todo.id]
            result.append({
                'todo': todo.to_dict(session=session),
                'work_dates': [ws.work_date.isoformat() for ws in sessions]
            })
        
        return jsonify(result)
    finally:
        session.close()

@app.route('/api/backup', methods=['POST'])
def backup_database():
    import os
    import shutil
    from datetime import datetime
    
    try:
        # Create backups directory if it doesn't exist
        os.makedirs('backups', exist_ok=True)
        
        # Generate timestamp for backup filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = f"backups/todos_backup_{timestamp}.db"
        
        # Copy the database
        shutil.copy2('todos.db', backup_file)
        
        return jsonify({
            'success': True,
            'backup_file': backup_file,
            'timestamp': timestamp
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
